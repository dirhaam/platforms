import { NextRequest, NextResponse } from 'next/server';
import { reminderService } from '@/lib/reminder/reminder-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const action = searchParams.get('action'); // 'scheduled', 'pending', 'templates'

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'scheduled':
        const scheduledReminders = reminderService.getScheduledReminders(tenantId);
        return NextResponse.json({
          reminders: scheduledReminders,
          total: scheduledReminders.length
        });

      case 'pending':
        const pendingReminders = reminderService.getPendingReminders(tenantId);
        return NextResponse.json({
          reminders: pendingReminders,
          total: pendingReminders.length
        });

      case 'templates':
        const templates = reminderService.getAllTemplates();
        return NextResponse.json({
          templates,
          total: templates.length
        });

      case 'settings':
        const settings = reminderService.getTenantSettings(tenantId);
        return NextResponse.json({ settings });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: scheduled, pending, templates, or settings' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in reminders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, action, ...data } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'send_immediate': {
        const { templateId, booking, customer, service } = data;
        
        if (!templateId || !booking) {
          return NextResponse.json(
            { error: 'Template ID and booking are required' },
            { status: 400 }
          );
        }

        const result = await reminderService.sendImmediateReminder(
          tenantId,
          templateId,
          booking,
          customer,
          service
        );

        return NextResponse.json(result);
      }

      case 'schedule_reminders': {
        const { booking, customer, service } = data;
        
        if (!booking) {
          return NextResponse.json(
            { error: 'Booking is required' },
            { status: 400 }
          );
        }

        const scheduledReminders = await reminderService.scheduleRemindersForBooking(
          tenantId,
          booking,
          customer,
          service
        );

        return NextResponse.json({
          success: true,
          reminders: scheduledReminders,
          total: scheduledReminders.length
        });
      }

      case 'cancel_reminder': {
        const { reminderId } = data;
        
        if (!reminderId) {
          return NextResponse.json(
            { error: 'Reminder ID is required' },
            { status: 400 }
          );
        }

        const success = reminderService.cancelReminder(reminderId);
        
        return NextResponse.json({
          success,
          message: success ? 'Reminder cancelled successfully' : 'Reminder not found'
        });
      }

      case 'update_settings': {
        const { settings } = data;
        
        if (!settings) {
          return NextResponse.json(
            { error: 'Settings are required' },
            { status: 400 }
          );
        }

        reminderService.updateTenantSettings(tenantId, settings);
        
        return NextResponse.json({
          success: true,
          message: 'Settings updated successfully',
          settings: reminderService.getTenantSettings(tenantId)
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: send_immediate, schedule_reminders, cancel_reminder, or update_settings' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in reminders API POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
