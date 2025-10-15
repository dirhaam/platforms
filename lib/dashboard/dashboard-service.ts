import { db } from '@/lib/database/server';
import {
  bookings as bookingsTable,
  customers as customersTable,
  services as servicesTable,
} from '@/lib/database/schema';
import { and, desc, eq, gte, lt, lte, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const COMPLETED_STATUSES = ['confirmed', 'completed'] as const;

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function countBookings(whereClause: any): Promise<number> {
  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`cast(count(${bookingsTable.id}) as int)` })
    .from(bookingsTable)
    .where(whereClause);

  return count ?? 0;
}

async function sumBookings(whereClause: any): Promise<number> {
  const [{ total } = { total: 0 }] = await db
    .select({ total: sql<number>`coalesce(sum(${bookingsTable.totalAmount}), 0)` })
    .from(bookingsTable)
    .where(whereClause);

  return toNumber(total);
}

async function countCustomers(whereClause: any): Promise<number> {
  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`cast(count(${customersTable.id}) as int)` })
    .from(customersTable)
    .where(whereClause);

  return count ?? 0;
}

export interface DashboardStats {
  todayBookings: number;
  todayBookingsChange: number;
  totalCustomers: number;
  newCustomersThisWeek: number;
  todayRevenue: number;
  revenueChange: number;
  completionRate: number;
}

export interface DashboardBooking {
  id: string;
  scheduledAt: Date;
  status: string;
  totalAmount: number;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
  };
}

export interface DashboardCustomer {
  id: string;
  name: string;
  phone: string;
  totalBookings: number;
  lastBookingAt: Date | null;
}

export interface PendingAction {
  id: string;
  type: 'booking_confirmation' | 'payment_overdue' | 'customer_message';
  title: string;
  description: string;
  actionUrl: string;
  actionText: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export class DashboardService {
  // Get today's statistics
  static async getTodayStats(tenantId: string): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    try {
      const tenantCondition = eq(bookingsTable.tenantId, tenantId);

      const todayRange = and(
        tenantCondition,
        gte(bookingsTable.scheduledAt, today),
        lt(bookingsTable.scheduledAt, tomorrow)
      );

      const yesterdayRange = and(
        tenantCondition,
        gte(bookingsTable.scheduledAt, yesterday),
        lt(bookingsTable.scheduledAt, today)
      );

      const weekRange = and(
        tenantCondition,
        gte(bookingsTable.scheduledAt, weekAgo)
      );

      const statusesArray = Array.from(COMPLETED_STATUSES);

      const revenueTodayCondition = and(
        todayRange,
        inArray(bookingsTable.status, statusesArray)
      );

      const revenueYesterdayCondition = and(
        yesterdayRange,
        inArray(bookingsTable.status, statusesArray)
      );

      const todayBookings = await countBookings(todayRange);
      const yesterdayBookings = await countBookings(yesterdayRange);
      const totalCustomers = await countCustomers(eq(customersTable.tenantId, tenantId));
      const newCustomersThisWeek = await countCustomers(
        and(eq(customersTable.tenantId, tenantId), gte(customersTable.createdAt, weekAgo))
      );
      const todayRevenue = await sumBookings(revenueTodayCondition);
      const yesterdayRevenue = await sumBookings(revenueYesterdayCondition);
      const thisWeekBookings = await countBookings(weekRange);
      const thisWeekCompleted = await countBookings(
        and(weekRange, eq(bookingsTable.status, 'completed'))
      );

      const todayBookingsChange = yesterdayBookings > 0 
        ? Math.round(((todayBookings - yesterdayBookings) / yesterdayBookings) * 100)
        : 0;

      const revenueChange = yesterdayRevenue > 0
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
        : 0;

      const completionRate = thisWeekBookings > 0
        ? Math.round((thisWeekCompleted / thisWeekBookings) * 100)
        : 0;

      return {
        todayBookings,
        todayBookingsChange,
        totalCustomers,
        newCustomersThisWeek,
        todayRevenue,
        revenueChange,
        completionRate,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        todayBookings: 0,
        todayBookingsChange: 0,
        totalCustomers: 0,
        newCustomersThisWeek: 0,
        todayRevenue: 0,
        revenueChange: 0,
        completionRate: 0,
      };
    }
  }

  // Get recent bookings
  static async getRecentBookings(tenantId: string, limit: number = 10): Promise<DashboardBooking[]> {
    try {
      const results = await db
        .select({
          id: bookingsTable.id,
          scheduledAt: bookingsTable.scheduledAt,
          status: bookingsTable.status,
          totalAmount: bookingsTable.totalAmount,
          customer: {
            id: customersTable.id,
            name: customersTable.name,
            phone: customersTable.phone,
          },
          service: {
            id: servicesTable.id,
            name: servicesTable.name,
          },
        })
        .from(bookingsTable)
        .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
        .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
        .where(eq(bookingsTable.tenantId, tenantId))
        .orderBy(desc(bookingsTable.createdAt))
        .limit(limit);

      return results.map(row => ({
        id: row.id,
        scheduledAt: row.scheduledAt ?? new Date(),
        status: row.status ?? 'pending',
        totalAmount: toNumber(row.totalAmount),
        customer: {
          id: row.customer?.id || '',
          name: row.customer?.name || 'Unknown',
          phone: row.customer?.phone || '',
        },
        service: {
          id: row.service?.id || '',
          name: row.service?.name || 'Unknown',
        },
      }));
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      return [];
    }
  }

  // Get upcoming bookings
  static async getUpcomingBookings(tenantId: string, limit: number = 10): Promise<DashboardBooking[]> {
    const now = new Date();
    
    try {
      const results = await db
        .select({
          id: bookingsTable.id,
          scheduledAt: bookingsTable.scheduledAt,
          status: bookingsTable.status,
          totalAmount: bookingsTable.totalAmount,
          customer: {
            id: customersTable.id,
            name: customersTable.name,
            phone: customersTable.phone,
          },
          service: {
            id: servicesTable.id,
            name: servicesTable.name,
          },
        })
        .from(bookingsTable)
        .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
        .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
        .where(
          and(
            eq(bookingsTable.tenantId, tenantId),
            gte(bookingsTable.scheduledAt, now),
            inArray(bookingsTable.status, ['pending', 'confirmed'])
          )
        )
        .orderBy(bookingsTable.scheduledAt)
        .limit(limit);

      return results.map(row => ({
        id: row.id,
        scheduledAt: row.scheduledAt ?? new Date(),
        status: row.status ?? 'pending',
        totalAmount: toNumber(row.totalAmount),
        customer: {
          id: row.customer?.id || '',
          name: row.customer?.name || 'Unknown',
          phone: row.customer?.phone || '',
        },
        service: {
          id: row.service?.id || '',
          name: row.service?.name || 'Unknown',
        },
      }));
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      return [];
    }
  }

  // Get recent customers
  static async getRecentCustomers(tenantId: string, limit: number = 10): Promise<DashboardCustomer[]> {
    try {
      const results = await db
        .select({
          id: customersTable.id,
          name: customersTable.name,
          phone: customersTable.phone,
          totalBookings: customersTable.totalBookings,
          lastBookingAt: customersTable.lastBookingAt,
        })
        .from(customersTable)
        .where(eq(customersTable.tenantId, tenantId))
        .orderBy(desc(customersTable.createdAt))
        .limit(limit);

      return results.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        totalBookings: customer.totalBookings ?? 0,
        lastBookingAt: customer.lastBookingAt,
      }));
    } catch (error) {
      console.error('Error fetching recent customers:', error);
      return [];
    }
  }

  // Get pending actions that need attention
  static async getPendingActions(tenantId: string): Promise<PendingAction[]> {
    const actions: PendingAction[] = [];
    const now = new Date();

    try {
      // Pending booking confirmations (bookings created more than 1 hour ago but still pending)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const pendingBookings = await countBookings(
        and(
          eq(bookingsTable.tenantId, tenantId),
          eq(bookingsTable.status, 'pending'),
          lt(bookingsTable.createdAt, oneHourAgo)
        )
      );

      if (pendingBookings > 0) {
        actions.push({
          id: 'pending-bookings',
          type: 'booking_confirmation',
          title: `${pendingBookings} booking${pendingBookings > 1 ? 's' : ''} awaiting confirmation`,
          description: 'These bookings have been waiting for more than an hour',
          actionUrl: '/admin/bookings?status=pending',
          actionText: 'Review Bookings',
          priority: 'high',
          createdAt: now,
        });
      }

      // Overdue payments (bookings completed but payment still pending after 24 hours)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const overduePayments = await countBookings(
        and(
          eq(bookingsTable.tenantId, tenantId),
          eq(bookingsTable.status, 'completed'),
          eq(bookingsTable.paymentStatus, 'pending'),
          lt(bookingsTable.updatedAt, oneDayAgo)
        )
      );

      if (overduePayments > 0) {
        actions.push({
          id: 'overdue-payments',
          type: 'payment_overdue',
          title: `${overduePayments} overdue payment${overduePayments > 1 ? 's' : ''}`,
          description: 'These payments are overdue by more than 24 hours',
          actionUrl: '/admin/bookings?payment_status=overdue',
          actionText: 'Follow Up',
          priority: 'high',
          createdAt: now,
        });
      }

      // Today's appointments that need confirmation calls
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayConfirmedBookings = await countBookings(
        and(
          eq(bookingsTable.tenantId, tenantId),
          gte(bookingsTable.scheduledAt, today),
          lt(bookingsTable.scheduledAt, tomorrow),
          eq(bookingsTable.status, 'confirmed')
        )
      );

      if (todayConfirmedBookings > 0) {
        actions.push({
          id: 'today-confirmations',
          type: 'booking_confirmation',
          title: `${todayConfirmedBookings} appointment${todayConfirmedBookings > 1 ? 's' : ''} today`,
          description: 'Consider sending confirmation reminders',
          actionUrl: '/admin/bookings?date=today',
          actionText: 'Send Reminders',
          priority: 'medium',
          createdAt: now,
        });
      }

      // Sort by priority and creation date
      return actions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error fetching pending actions:', error);
      return [];
    }
  }

  // Get dashboard summary for a specific date range
  static async getDashboardSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBookings: number;
    totalRevenue: number;
    totalCustomers: number;
    averageBookingValue: number;
    completionRate: number;
  }> {
    try {
      const baseBookingCondition = and(
        eq(bookingsTable.tenantId, tenantId),
        gte(bookingsTable.scheduledAt, startDate),
        lte(bookingsTable.scheduledAt, endDate)
      );

      const completedStatuses = Array.from(COMPLETED_STATUSES);

      const [bookingsResult, totalRevenue, customersCount, completedBookings] = await Promise.all([
        countBookings(baseBookingCondition),
        sumBookings(
          and(
            baseBookingCondition,
            inArray(bookingsTable.status, completedStatuses)
          )
        ),
        countCustomers(
          and(
            eq(customersTable.tenantId, tenantId),
            gte(customersTable.createdAt, startDate),
            lte(customersTable.createdAt, endDate)
          )
        ),
        countBookings(and(baseBookingCondition, eq(bookingsTable.status, 'completed'))),
      ]);

      const averageBookingValue = bookingsResult > 0 ? totalRevenue / bookingsResult : 0;
      const completionRate = bookingsResult > 0 ? (completedBookings / bookingsResult) * 100 : 0;

      return {
        totalBookings: bookingsResult,
        totalRevenue,
        totalCustomers: customersCount,
        averageBookingValue,
        completionRate: Math.round(completionRate),
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return {
        totalBookings: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        averageBookingValue: 0,
        completionRate: 0,
      };
    }
  }
}