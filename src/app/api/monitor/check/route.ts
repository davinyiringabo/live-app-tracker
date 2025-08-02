import { NextRequest, NextResponse } from 'next/server';
import monitorService from '@/lib/monitor';
import db from '@/lib/database';

export async function GET() {
  try {
    const status = monitorService.getMonitoringStatus();
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId } = body;

    if (appId) {
      // Check specific app
      const app = await db.getAppById(appId);
      if (!app) {
        return NextResponse.json(
          { error: 'App not found' },
          { status: 404 }
        );
      }
      await monitorService.runManualCheck(appId);
    } else {
      // Check all apps
      await monitorService.runManualCheck();
    }

    return NextResponse.json({ 
      message: appId ? 'Manual check initiated for specific app' : 'Manual check initiated for all apps' 
    });
  } catch (error) {
    console.error('Error running manual check:', error);
    return NextResponse.json(
      { error: 'Failed to run manual check' },
      { status: 500 }
    );
  }
} 