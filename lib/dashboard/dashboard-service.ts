import { prisma } from '@/lib/database';
import type { Booking, Customer, Service } from '@/types/database';

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
      // Today's bookings
      const todayBookings = await prisma.booking.count({
        where: {
          tenantId,
          scheduledAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Yesterday's bookings for comparison
      const yesterdayBookings = await prisma.booking.count({
        where: {
          tenantId,
          scheduledAt: {
            gte: yesterday,
            lt: today,
          },
        },
      });

      // Total customers
      const totalCustomers = await prisma.customer.count({
        where: { tenantId },
      });

      // New customers this week
      const newCustomersThisWeek = await prisma.customer.count({
        where: {
          tenantId,
          createdAt: {
            gte: weekAgo,
          },
        },
      });

      // Today's revenue
      const todayRevenueResult = await prisma.booking.aggregate({
        where: {
          tenantId,
          scheduledAt: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: ['confirmed', 'completed'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      // Yesterday's revenue for comparison
      const yesterdayRevenueResult = await prisma.booking.aggregate({
        where: {
          tenantId,
          scheduledAt: {
            gte: yesterday,
            lt: today,
          },
          status: {
            in: ['confirmed', 'completed'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      // Completion rate (this week)
      const thisWeekBookings = await prisma.booking.count({
        where: {
          tenantId,
          scheduledAt: {
            gte: weekAgo,
          },
        },
      });

      const thisWeekCompleted = await prisma.booking.count({
        where: {
          tenantId,
          scheduledAt: {
            gte: weekAgo,
          },
          status: 'completed',
        },
      });

      const todayRevenue = Number(todayRevenueResult._sum.totalAmount || 0);
      const yesterdayRevenue = Number(yesterdayRevenueResult._sum.totalAmount || 0);

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
      const bookings = await prisma.booking.findMany({
        where: { tenantId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return bookings.map(booking => ({
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        totalAmount: Number(booking.totalAmount),
        customer: booking.customer,
        service: booking.service,
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
      const bookings = await prisma.booking.findMany({
        where: {
          tenantId,
          scheduledAt: {
            gte: now,
          },
          status: {
            in: ['pending', 'confirmed'],
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        take: limit,
      });

      return bookings.map(booking => ({
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        totalAmount: Number(booking.totalAmount),
        customer: booking.customer,
        service: booking.service,
      }));
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      return [];
    }
  }

  // Get recent customers
  static async getRecentCustomers(tenantId: string, limit: number = 10): Promise<DashboardCustomer[]> {
    try {
      const customers = await prisma.customer.findMany({
        where: { tenantId },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        totalBookings: customer.totalBookings,
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
      const pendingBookings = await prisma.booking.count({
        where: {
          tenantId,
          status: 'pending',
          createdAt: {
            lt: oneHourAgo,
          },
        },
      });

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
      const overduePayments = await prisma.booking.count({
        where: {
          tenantId,
          status: 'completed',
          paymentStatus: 'pending',
          updatedAt: {
            lt: oneDayAgo,
          },
        },
      });

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

      const todayConfirmedBookings = await prisma.booking.count({
        where: {
          tenantId,
          scheduledAt: {
            gte: today,
            lt: tomorrow,
          },
          status: 'confirmed',
        },
      });

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
      const [bookingsResult, revenueResult, customersCount] = await Promise.all([
        prisma.booking.count({
          where: {
            tenantId,
            scheduledAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.booking.aggregate({
          where: {
            tenantId,
            scheduledAt: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: ['confirmed', 'completed'],
            },
          },
          _sum: {
            totalAmount: true,
          },
        }),
        prisma.customer.count({
          where: {
            tenantId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      ]);

      const completedBookings = await prisma.booking.count({
        where: {
          tenantId,
          scheduledAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed',
        },
      });

      const totalRevenue = Number(revenueResult._sum.totalAmount || 0);
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