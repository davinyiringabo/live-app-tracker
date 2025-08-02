import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid app ID' },
        { status: 400 }
      );
    }

    const app = await db.getAppById(id);
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ app });
  } catch (error) {
    console.error('Error fetching app:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid app ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, url, is_active, check_interval } = body;

    // Check if app exists
    const existingApp = await db.getAppById(id);
    if (!existingApp) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }

      // Check if URL already exists (excluding current app)
      const existingApps = await db.getAllApps();
      const urlExists = existingApps.some(app => app.url === url && app.id !== id);
      if (urlExists) {
        return NextResponse.json(
          { error: 'URL already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare updates
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (is_active !== undefined) updates.is_active = is_active;
    if (check_interval !== undefined) updates.check_interval = check_interval;

    // Update the app
    const success = await db.updateApp(id, updates);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update app' },
        { status: 500 }
      );
    }

    const updatedApp = await db.getAppById(id);
    return NextResponse.json({ app: updatedApp });
  } catch (error) {
    console.error('Error updating app:', error);
    return NextResponse.json(
      { error: 'Failed to update app' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid app ID' },
        { status: 400 }
      );
    }

    // Check if app exists
    const existingApp = await db.getAppById(id);
    if (!existingApp) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    // Delete the app
    const success = await db.deleteApp(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete app' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'App deleted successfully' });
  } catch (error) {
    console.error('Error deleting app:', error);
    return NextResponse.json(
      { error: 'Failed to delete app' },
      { status: 500 }
    );
  }
} 