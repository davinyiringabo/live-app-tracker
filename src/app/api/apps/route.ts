import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function GET() {
  try {
    const apps = await db.getAllApps();
    return NextResponse.json({ apps });
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, checkInterval } = body;

    // Validation
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if URL already exists
    const existingApps = await db.getAllApps();
    const urlExists = existingApps.some(app => app.url === url);
    if (urlExists) {
      return NextResponse.json(
        { error: 'URL already exists' },
        { status: 409 }
      );
    }

    // Add the app
    const newApp = await db.addApp(name, url, checkInterval || 60);
    
    return NextResponse.json({ app: newApp }, { status: 201 });
  } catch (error) {
    console.error('Error adding app:', error);
    return NextResponse.json(
      { error: 'Failed to add app' },
      { status: 500 }
    );
  }
} 