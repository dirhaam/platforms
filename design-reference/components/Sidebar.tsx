import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NavItem } from '../types';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

// Boxicons class mappings
const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', path: '/', icon: 'bx bx-home-circle' },
  { title: 'Bookings', path: '/bookings', icon: 'bx bx-calendar' },
  { title: 'Customers', path: '/customers', icon: 'bx bx-user' },
  { title: 'Services', path: '/services', icon: 'bx bx-briefcase' },
  { title: 'Staff', path: '/staff', icon: 'bx bx-id-card' },
  { title: 'Sales', path: '/sales', icon: 'bx bx-trending-up' },
  { title: 'Finance', path: '/finance', icon: 'bx bx-wallet' },
  { title: 'Invoices', path: '/invoices', icon: 'bx bx-file' },
  { title: 'Messages', path: '/messages', icon: 'bx bx-chat' },
  { title: 'WhatsApp', path: '/whatsapp', icon: 'bx bxl-whatsapp' },
  { title: 'Analytics', path: '/analytics', icon: 'bx bx-bar-chart-alt-2' },
  { title: 'Settings', path: '/settings', icon: 'bx bx-cog' },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Brand Logo */}
      <div className="h-20 flex items-center justify-center px-6 relative">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="text-primary text-3xl">
             <i className='bx bxl-sketch'></i>
          </div>
          {!collapsed && (
            <span className="text-2xl font-bold text-txt-primary tracking-tight">sneat</span>
          )}
        </div>
        
        {/* Toggle Button (Absolute on edge) */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`
            absolute -right-3 top-8 w-6 h-6 bg-primary rounded-full text-white flex items-center justify-center shadow-md
            hover:bg-primary-dark transition-colors z-50
            ${collapsed ? 'rotate-180' : ''}
          `}
        >
          <i className='bx bx-chevron-left text-lg'></i>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-4 custom-scrollbar">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group font-medium
                  ${isActive 
                    ? 'bg-primary-light text-primary shadow-none' 
                    : 'text-txt-secondary hover:bg-gray-100 hover:text-txt-primary'}
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
                title={collapsed ? item.title : ''}
              >
                <i className={`${item.icon} text-xl ${isActive ? 'text-primary' : 'text-txt-secondary group-hover:text-txt-primary'}`}></i>
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};