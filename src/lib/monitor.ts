/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import cron from 'node-cron';
import db, { App } from './database';
import emailService from './email';

interface HealthCheckResult {
  status: 'up' | 'down';
  responseTime: number | null;
  errorMessage: string | null;
}

class MonitorService {
  private isRunning = false;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    // Start monitoring on initialization
    this.startMonitoring();
  }

  async checkAppHealth(app: App): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(app.url, {
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500, // Consider 5xx as down
      });

      const responseTime = Date.now() - startTime;
      
      return {
        status: 'up',
        responseTime,
        errorMessage: null,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      let errorMessage = 'Unknown error';

      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - server may be down';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'DNS resolution failed - domain not found';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Request timed out';
      } else if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response received from server';
      } else {
        errorMessage = error.message || 'Unknown network error';
      }

      return {
        status: 'down',
        responseTime,
        errorMessage,
      };
    }
  }

  async checkAllApps(): Promise<void> {
    if (this.isRunning) {
      console.log('Health check already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log(`Starting health check at ${new Date().toISOString()}`);

    try {
      const activeApps = await db.getActiveApps();
      console.log(`Checking ${activeApps.length} active apps...`);

      for (const app of activeApps) {
        await this.checkSingleApp(app);
        // Add a small delay between checks to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error during health check:', error);
    } finally {
      this.isRunning = false;
      console.log(`Health check completed at ${new Date().toISOString()}`);
    }
  }

  private async checkSingleApp(app: App): Promise<void> {
    try {
      console.log(`Checking ${app.name} (${app.url})...`);
      
      const result = await this.checkAppHealth(app);
      
      // Log the check result
      await db.addCheckLog(app.id, result.status, result.responseTime, result.errorMessage);
      
      // Handle status changes and notifications
      await this.handleStatusChange(app, result);
      
    } catch (error) {
      console.error(`Error checking app ${app.name}:`, error);
      
      // Log the error as a failed check
      await db.addCheckLog(app.id, 'down', null, `Check failed: ${error}`);
    }
  }

  private async handleStatusChange(app: App, result: HealthCheckResult): Promise<void> {
    const previousStatus = app.last_status;
    const currentStatus = result.status;

    // If status changed from up to down, send down notification
    if (previousStatus === 'up' && currentStatus === 'down') {
      console.log(`🚨 ${app.name} is now DOWN!`);
      await emailService.sendDownNotification(app, result.errorMessage || 'Unknown error');
    }
    
    // If status changed from down to up, send recovery notification
    else if (previousStatus === 'down' && currentStatus === 'up') {
      console.log(`✅ ${app.name} is back UP!`);
      await emailService.sendUpNotification(app);
    }
    
    // If status is down and was already down, don't send duplicate notifications
    else if (currentStatus === 'down') {
      console.log(`⚠️ ${app.name} is still DOWN`);
    }
    
    // If status is up and was already up, just log it
    else {
      console.log(`✅ ${app.name} is UP (${result.responseTime}ms)`);
    }
  }

  startMonitoring(): void {
    if (this.cronJob) {
      console.log('Monitoring is already running');
      return;
    }

    // Run health checks every hour (at minute 0)
    this.cronJob = cron.schedule('0 * * * *', () => {
      this.checkAllApps();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    console.log('Monitoring service started - health checks will run every hour');
    
    // Run initial check after 30 seconds
    setTimeout(() => {
      this.checkAllApps();
    }, 30000);
  }

  stopMonitoring(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Monitoring service stopped');
    }
  }

  async runManualCheck(appId?: number): Promise<void> {
    if (appId) {
      const app = await db.getAppById(appId);
      if (app) {
        await this.checkSingleApp(app);
      } else {
        console.error(`App with ID ${appId} not found`);
      }
    } else {
      await this.checkAllApps();
    }
  }

  getMonitoringStatus(): { isRunning: boolean; nextCheck?: string } {
    const status = { isRunning: this.isRunning };
    
    if (this.cronJob) {
      const nextDate = this.cronJob.nextDates(1)[0];
      status.nextCheck = nextDate?.toISOString();
    }
    
    return status;
  }
}

export default new MonitorService(); 