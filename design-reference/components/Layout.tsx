import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-body font-sans">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out relative ${collapsed ? 'ml-20' : 'ml-64'}`}
      >
        {/* Navbar - Floating & Detached */}
        <header className="px-6 py-3 sticky top-0 z-40 bg-body/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-nav px-6 h-16 flex items-center justify-between">
             {/* Search */}
             <div className="flex items-center gap-3 flex-1">
                <i className='bx bx-search text-gray-400 text-xl'></i>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full bg-transparent border-none outline-none text-txt-secondary placeholder-gray-400 text-sm"
                />
             </div>

             {/* Right Actions */}
             <div className="flex items-center gap-5">
                <div className="flex items-center gap-1">
                   <button className="w-9 h-9 rounded-full flex items-center justify-center text-txt-secondary hover:bg-gray-100 transition-colors">
                      <i className='bx bx-globe text-xl'></i>
                   </button>
                   <button className="w-9 h-9 rounded-full flex items-center justify-center text-txt-secondary hover:bg-gray-100 transition-colors">
                      <i className='bx bx-moon text-xl'></i>
                   </button>
                   <button className="w-9 h-9 rounded-full flex items-center justify-center text-txt-secondary hover:bg-gray-100 transition-colors">
                      <i className='bx bx-grid-alt text-xl'></i>
                   </button>
                   <button className="w-9 h-9 rounded-full flex items-center justify-center text-txt-secondary hover:bg-gray-100 transition-colors relative">
                      <i className='bx bx-bell text-xl'></i>
                      <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border border-white"></span>
                   </button>
                </div>
                
                {/* Profile */}
                <div className="relative cursor-pointer">
                   <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm relative">
                      <img src="https://picsum.photos/seed/admin/100" alt="Profile" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full"></span>
                   </div>
                </div>
             </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
          
          {/* Footer */}
          <footer className="mt-12 flex flex-col md:flex-row justify-between items-center text-sm text-txt-muted">
            <p>&copy; 2024, made with ❤️ by ThemeSelection</p>
            <div className="flex gap-4 mt-2 md:mt-0">
               <a href="#" className="hover:text-primary">License</a>
               <a href="#" className="hover:text-primary">More Themes</a>
               <a href="#" className="hover:text-primary">Documentation</a>
               <a href="#" className="hover:text-primary">Support</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};