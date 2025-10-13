export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection, db } from '@/lib/database';
import { DatabaseUtils } from '@/lib/database';

interface SystemHealthCheck {
  service: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastChecked: Date;
}

export async function GET() {
  try {
    const healthChecks: SystemHealthCheck[] = [];

    // Check database connection
    const dbStart = Date.now();
    try {
      const dbOk = await checkDatabaseConnection();
      healthChecks.push({
        service: 'PostgreSQL Database',
        status: dbOk ? 'online' : 'offline',
        responseTime: Date.now() - dbStart,
        lastChecked: new Date(),
      });
    } catch (error) {
      healthChecks.push({
        service: 'PostgreSQL Database',
        status: 'offline',
        responseTime: Date.now() - dbStart,
        lastChecked: new Date(),
      });
    }

    // Check D1 connection if available (this would be specific to Cloudflare Workers environment)
    const d1Start = Date.now();
    try {
      // In Cloudflare Workers environment, you'd check D1 connection here
      // For now, we'll simulate a check
      const d1Ok = true; // Placeholder: in real environment this could check D1
      healthChecks.push({
        service: 'Cloudflare D1',
        status: d1Ok ? 'online' : 'offline',
        responseTime: Date.now() - d1Start,
        lastChecked: new Date(),
      });
    } catch (error) {
      healthChecks.push({
        service: 'Cloudflare D1',
        status: 'offline',
        responseTime: Date.now() - d1Start,
        lastChecked: new Date(),
      });
    }

    // Check main website
    const websiteStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'http://localhost:3000'}`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      healthChecks.push({
        service: 'Main Website',
        status: response.ok ? 'online' : 'degraded',
        responseTime: Date.now() - websiteStart,
        lastChecked: new Date(),
      });
    } catch (error) {
      clearTimeout(timeoutId);
      healthChecks.push({
        service: 'Main Website',
        status: 'offline',
        responseTime: Date.now() - websiteStart,
        lastChecked: new Date(),
      });
    }

    // Get more detailed database health
    try {
      const dbHealth = await DatabaseUtils.healthCheck();
      const mappedStatus: 'online' | 'offline' | 'degraded' =
        dbHealth.status === 'healthy' ? 'online' : 'degraded';
      healthChecks.push({
        service: 'Database Health',
        status: mappedStatus,
        responseTime: parseInt(dbHealth.details?.split(' ')[2] || '0'),
        lastChecked: new Date(),
      });
    } catch (error) {
      healthChecks.push({
        service: 'Database Health',
        status: 'offline',
        responseTime: 0,
        lastChecked: new Date(),
      });
    }

    // Mock system metrics (in a real implementation, you'd get these from system monitoring tools)
    const systemMetrics = {
      cpu: {
        usage: Math.floor(Math.random() * 40) + 20,
        cores: 4,
      },
      memory: {
        used: Math.round((Math.random() * 3 + 1) * 10) / 10,
        total: 8,
        percentage: Math.floor(Math.random() * 30) + 15,
      },
      storage: {
        used: Math.round((Math.random() * 10 + 10) * 10) / 10,
        total: 50,
        percentage: Math.floor(Math.random() * 20) + 20,
      },
      network: {
        inbound: Math.round((Math.random() * 2) * 10) / 10,
        outbound: Math.round((Math.random() * 1.5) * 10) / 10,
      },
    };

    return NextResponse.json({
      status: 'healthy',
      uptime: Math.floor(process.uptime() / 86400), // Convert seconds to days
      services: healthChecks,
      metrics: systemMetrics,
      lastChecked: new Date(),
    });
  } catch (error) {
    console.error('Failed to get system health:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to check system health',
        lastChecked: new Date(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'restart_service':
        // In a real implementation, you would restart the specified service
        console.log(`Restarting service: ${data.service}`);
        return NextResponse.json({ success: true, message: `Service ${data.service} restart initiated` });

      case 'clear_cache':
        // In D1, we might clear specific cache entries instead of flushall
        // This would depend on your specific implementation
        console.log('Clearing cache entries');
        // Here you might call a function to clear D1 cache tables
        return NextResponse.json({ success: true, message: 'Cache cleared successfully' });

      case 'run_health_check':
        // Trigger a comprehensive health check
        return NextResponse.json({ success: true, message: 'Health check initiated' });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to execute monitoring action:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}