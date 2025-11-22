export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER'
}

export interface NavItem {
  title: string;
  path: string;
  icon: string; // Boxicons class string (e.g., 'bx bx-home')
  category?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  service: string;
  date: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  amount: number;
}

export interface StatCardProps {
  title: string;
  value: string;
  trend?: number; // percentage
  trendLabel?: string;
  icon: string;
  colorClass?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
}