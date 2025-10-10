import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogger } from '@/lib/admin/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const limitNumber = limit ? parseInt(limit, 10) : undefined;

    const activities = await ActivityLogger.getActivityLog(limitNumber);
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Failed to fetch activity log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await ActivityLogger.clearActivityLog();
    await ActivityLogger.logAdminAction(
      'Activity Log Cleared',
      'Admin cleared the activity log'
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear activity log:', error);
    return NextResponse.json(
      { error: 'Failed to clear activity log' },
      { status: 500 }
    );
  }
}