const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'data', 'monitor.db');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Setting up database...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

// Create tables
db.serialize(() => {
  // Create apps table
  db.run(`
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
  `, (err) => {
    if (err) {
      console.error('Error creating apps table:', err.message);
    } else {
      console.log('Apps table created successfully.');
    }
  });

  // Create check_logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS check_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('up', 'down')),
      response_time INTEGER,
      error_message TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES apps (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating check_logs table:', err.message);
    } else {
      console.log('Check logs table created successfully.');
    }
  });

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_apps_active ON apps(is_active)`, (err) => {
    if (err) {
      console.error('Error creating apps index:', err.message);
    } else {
      console.log('Apps index created successfully.');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_check_logs_app_id ON check_logs(app_id)`, (err) => {
    if (err) {
      console.error('Error creating check_logs app_id index:', err.message);
    } else {
      console.log('Check logs app_id index created successfully.');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_check_logs_checked_at ON check_logs(checked_at)`, (err) => {
    if (err) {
      console.error('Error creating check_logs checked_at index:', err.message);
    } else {
      console.log('Check logs checked_at index created successfully.');
    }
    
    // Close database after all operations
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database setup completed successfully!');
      }
    });
  });
}); 