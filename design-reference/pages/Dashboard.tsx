import React from 'react';
import { DashboardCharts } from '../components/DashboardCharts';
import { ChartDataPoint } from '../types';

const bookingTrends: ChartDataPoint[] = [
  { name: 'Mon', value: 24 },
  { name: 'Tue', value: 18 },
  { name: 'Wed', value: 32 },
  { name: 'Thu', value: 45 },
  { name: 'Fri', value: 38 },
  { name: 'Sat', value: 55 },
  { name: 'Sun', value: 48 },
];

const revenueData: ChartDataPoint[] = [
  { name: 'Jan', value: 4000, value2: 2400 },
  { name: 'Feb', value: 3000, value2: 1398 },
  { name: 'Mar', value: 2000, value2: 9800 },
  { name: 'Apr', value: 2780, value2: 3908 },
  { name: 'May', value: 1890, value2: 4800 },
  { name: 'Jun', value: 2390, value2: 3800 },
  { name: 'Jul', value: 3490, value2: 4300 },
];

const transactions = [
  { id: 1, title: 'Paypal', subtitle: 'Send money', amount: '-82.60', currency: 'USD', icon: 'bx bxl-paypal', color: 'text-danger', bg: 'bg-red-100' },
  { id: 2, title: 'Wallet', subtitle: 'Mac\'D', amount: '+270.69', currency: 'USD', icon: 'bx bx-wallet', color: 'text-primary', bg: 'bg-primary-light' },
  { id: 3, title: 'Transfer', subtitle: 'Refund', amount: '+637.91', currency: 'USD', icon: 'bx bx-transfer', color: 'text-success', bg: 'bg-green-100' },
  { id: 4, title: 'Credit Card', subtitle: 'Ordered Food', amount: '-838.71', currency: 'USD', icon: 'bx bx-credit-card', color: 'text-info', bg: 'bg-cyan-100' },
  { id: 5, title: 'Wallet', subtitle: 'Starbucks', amount: '+203.33', currency: 'USD', icon: 'bx bx-wallet', color: 'text-warning', bg: 'bg-yellow-100' },
  { id: 6, title: 'Mastercard', subtitle: 'Ordered Food', amount: '-92.45', currency: 'USD', icon: 'bx bxl-mastercard', color: 'text-secondary', bg: 'bg-gray-200' },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Welcome / Congratulations Card */}
      <div className="lg:col-span-8 md:col-span-6 col-span-12">
        <div className="bg-white rounded-card shadow-card h-full relative overflow-hidden flex flex-col md:flex-row">
           <div className="p-6 flex-1 z-10">
              <h5 className="text-primary font-bold text-lg mb-1">Congratulations John! 🎉</h5>
              <p className="text-txt-secondary text-sm mb-4">
                You have done <span className="font-bold text-txt-primary">72%</span> more sales today. Check your new badge in your profile.
              </p>
              <button className="text-primary border border-primary/30 bg-transparent hover:bg-primary/10 px-4 py-1.5 rounded text-sm font-medium transition-colors">
                View Badges
              </button>
           </div>
           <div className="p-4 flex items-end justify-end md:absolute md:right-0 md:bottom-0 md:h-full md:w-1/2 pointer-events-none">
              {/* Simple CSS Illustration placeholder */}
              <div className="text-9xl opacity-90">
                 🏆
              </div>
           </div>
        </div>
      </div>

      {/* Stats: Profit & Sales (Right Side Column top) */}
      <div className="lg:col-span-2 md:col-span-3 col-span-6">
        <div className="bg-white rounded-card shadow-card p-5 h-full">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success">
                <i className='bx bx-dollar-circle text-2xl'></i>
             </div>
             <button className="text-txt-muted"><i className='bx bx-dots-vertical-rounded'></i></button>
          </div>
          <span className="block text-txt-secondary font-semibold mb-1">Profit</span>
          <h3 className="text-2xl font-bold text-txt-primary mb-1">$12,628</h3>
          <p className="text-success text-xs font-medium">+72.80%</p>
        </div>
      </div>

      <div className="lg:col-span-2 md:col-span-3 col-span-6">
        <div className="bg-white rounded-card shadow-card p-5 h-full">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-info">
                <i className='bx bx-wallet text-2xl'></i>
             </div>
             <button className="text-txt-muted"><i className='bx bx-dots-vertical-rounded'></i></button>
          </div>
          <span className="block text-txt-secondary font-semibold mb-1">Sales</span>
          <h3 className="text-2xl font-bold text-txt-primary mb-1">$4,679</h3>
          <p className="text-success text-xs font-medium">+28.42%</p>
        </div>
      </div>

      {/* Total Revenue Chart (Big Area) */}
      <div className="lg:col-span-8 col-span-12">
         <DashboardCharts type="bar" title="Total Revenue" description="Yearly earnings overview" data={revenueData} />
      </div>

      {/* More Stats (Grid of 2x2 on right side) */}
      <div className="lg:col-span-4 col-span-12">
         <div className="grid grid-cols-2 gap-6 h-full">
            
            <div className="bg-white rounded-card shadow-card p-5">
               <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-danger mb-3">
                  <i className='bx bxl-paypal text-2xl'></i>
               </div>
               <span className="block text-txt-secondary font-semibold mb-1">Payments</span>
               <h3 className="text-xl font-bold text-txt-primary mb-1">$2,468</h3>
               <p className="text-danger text-xs font-medium">-14.82%</p>
            </div>

            <div className="bg-white rounded-card shadow-card p-5">
               <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-secondary mb-3">
                  <i className='bx bx-credit-card text-2xl'></i>
               </div>
               <span className="block text-txt-secondary font-semibold mb-1">Transactions</span>
               <h3 className="text-xl font-bold text-txt-primary mb-1">$14,857</h3>
               <p className="text-success text-xs font-medium">+28.14%</p>
            </div>

            <div className="col-span-2 bg-white rounded-card shadow-card p-5">
               <div className="flex justify-between mb-4">
                 <div>
                   <h5 className="text-lg font-semibold text-txt-primary">Profile Report</h5>
                   <span className="text-xs bg-yellow-100 text-warning px-2 py-0.5 rounded-md font-bold">YEAR 2022</span>
                 </div>
                 <i className='bx bx-chevron-down text-txt-muted'></i>
               </div>
               <div className="flex items-center gap-2 mb-2">
                   <i className='bx bx-up-arrow-alt text-success'></i>
                   <span className="text-success font-medium">68.2%</span>
               </div>
               <h3 className="text-2xl font-bold text-txt-primary">$84,686k</h3>
            </div>
         </div>
      </div>

      {/* Booking / Order Statistics */}
      <div className="md:col-span-6 lg:col-span-8 col-span-12">
         <DashboardCharts type="area" title="Order Statistics" description="42.82k Total Sales" data={bookingTrends} />
      </div>

      {/* Transactions List */}
      <div className="md:col-span-6 lg:col-span-4 col-span-12">
         <div className="bg-white rounded-card shadow-card h-full">
            <div className="p-6 flex justify-between items-center">
               <h5 className="text-lg font-semibold text-txt-primary">Transactions</h5>
               <button className="text-txt-muted"><i className='bx bx-dots-vertical-rounded'></i></button>
            </div>
            <div className="px-6 pb-6 space-y-6">
               {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded flex items-center justify-center ${t.bg} ${t.color}`}>
                           <i className={`${t.icon} text-xl`}></i>
                        </div>
                        <div>
                           <h6 className="text-sm font-semibold text-txt-primary">{t.title}</h6>
                           <span className="text-xs text-txt-muted">{t.subtitle}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className={`font-semibold text-sm ${t.amount.startsWith('-') ? 'text-txt-primary' : 'text-success'}`}>
                           {t.amount}
                        </span>
                        <span className="text-xs text-txt-muted uppercase">{t.currency}</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

    </div>
  );
};