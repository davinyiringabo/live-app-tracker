/* eslint-disable @typescript-eslint/no-explicit-any */
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'monitor.db');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export interface App {
  id: number;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
  last_check: string | null;
  last_status: 'up' | 'down' | null;
  check_interval: number; // in minutes
}

export interface CheckLog {
  id: number;
  app_id: number;
  status: 'up' | 'down';
  response_time: number | null;
  error_message: string | null;
  checked_at: string;
}

class DatabaseManager {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.initDatabase();
  }

  private initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create apps table
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS apps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_check DATETIME,
            last_status TEXT CHECK(last_status IN ('up', 'down')),
            check_interval INTEGER DEFAULT 60
          )
        `);

        // Create check_logs table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS check_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_id INTEGER NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('up', 'down')),
            response_time INTEGER,
            error_message TEXT,
            checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (app_id) REFERENCES apps (id) ON DELETE CASCADE
          )
        `);

        // Create indexes for better performance
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_apps_active ON apps(is_active)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_check_logs_app_id ON check_logs(app_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_check_logs_checked_at ON check_logs(checked_at)`, (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  // App management methods
  getAllApps(): Promise<App[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM apps ORDER BY created_at DESC', (err: Error | null, rows: unknown[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as App[]);
        }
      });
    });
  }

  getActiveApps(): Promise<App[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM apps WHERE is_active = 1 ORDER BY created_at DESC', (err: Error | null, rows: unknown[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as App[]);
        }
      });
    });
  }

  getAppById(id: number): Promise<App | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM apps WHERE id = ?', [id], (err: Error | null, row: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as App | null);
        }
      });
    });
  }

  addApp(name: string, url: string, checkInterval: number = 60): Promise<App> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO apps (name, url, check_interval) VALUES (?, ?, ?)',
        [name, url, checkInterval],
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(err);
          } else {
            // Get the inserted app using the outer scope's this
            const dbManager = this as unknown as DatabaseManager;
            dbManager.getAppById(this.lastID).then(resolve as any).catch(reject);
          }
        }.bind(this as any)
      );
    });
  }

  updateApp(id: number, updates: Partial<Omit<App, 'id' | 'created_at'>>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      
      this.db.run(`UPDATE apps SET ${fields} WHERE id = ?`, [...values, id], function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  deleteApp(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM apps WHERE id = ?', [id], function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Check log methods
  addCheckLog(appId: number, status: 'up' | 'down', responseTime: number | null, errorMessage: string | null): Promise<CheckLog> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO check_logs (app_id, status, response_time, error_message) VALUES (?, ?, ?, ?)',
        [appId, status, responseTime, errorMessage],
        (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            // Update app's last check and status
            this.updateApp(appId, {
              last_check: new Date().toISOString(),
              last_status: status
            }).then(() => {
              const log: CheckLog = {
                id: 0, // We don't have access to lastID here, but it's not critical
                app_id: appId,
                status,
                response_time: responseTime,
                error_message: errorMessage,
                checked_at: new Date().toISOString()
              };
              resolve(log);
            }).catch(reject);
          }
        }
      );
    });
  }

  getCheckLogs(appId: number, limit: number = 50): Promise<CheckLog[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM check_logs WHERE app_id = ? ORDER BY checked_at DESC LIMIT ?',
        [appId, limit],
        (err: Error | null, rows: unknown[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as CheckLog[]);
          }
        }
      );
    });
  }

  getRecentDownApps(hours: number = 24): Promise<App[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT a.* FROM apps a
        INNER JOIN check_logs cl ON a.id = cl.app_id
        WHERE cl.status = 'down' 
        AND cl.checked_at > datetime('now', '-${hours} hours')
        AND a.is_active = 1
        ORDER BY cl.checked_at DESC
      `;
      
      this.db.all(query, (err: Error | null, rows: unknown[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as App[]);
        }
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

// Create a singleton instance
const db = new DatabaseManager();

export default db; 