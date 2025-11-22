import React from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';

const bookings = [
  { id: '#BK-7829', client: 'Esther Howard', service: 'Full Body Massage', date: 'Oct 24, 2024', time: '14:00', status: 'Confirmed', price: '$120.00', avatar: 'https://picsum.photos/32/32?random=4' },
  { id: '#BK-7830', client: 'Cameron Williamson', service: 'Haircut & Styling', date: 'Oct 24, 2024', time: '15:30', status: 'Pending', price: '$65.00', avatar: 'https://picsum.photos/32/32?random=5' },
  { id: '#BK-7831', client: 'Robert Fox', service: 'Manicure', date: 'Oct 25, 2024', time: '09:00', status: 'Confirmed', price: '$45.00', avatar: 'https://picsum.photos/32/32?random=6' },
  { id: '#BK-7832', client: 'Jenny Wilson', service: 'Spa Package', date: 'Oct 25, 2024', time: '11:00', status: 'Cancelled', price: '$250.00', avatar: 'https://picsum.photos/32/32?random=7' },
  { id: '#BK-7833', client: 'Guy Hawkins', service: 'Facial Treatment', date: 'Oct 26, 2024', time: '10:30', status: 'Confirmed', price: '$90.00', avatar: 'https://picsum.photos/32/32?random=8' },
];

export const Bookings: React.FC = () => {
  return (
    <div>
      <AdminPageHeader 
        title="Bookings" 
        action={
          <button className="bg-primary text-white px-4 py-2 rounded-md shadow-md hover:bg-primary-dark transition-all flex items-center gap-2 text-sm font-medium">
            <i className='bx bx-plus'></i> Add Booking
          </button>
        }
      />

      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
           <h5 className="font-semibold text-lg text-txt-primary">Appointment List</h5>
           <div className="flex items-center gap-2">
             <div className="relative">
                <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'></i>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:border-primary outline-none text-txt-secondary w-64"
                />
             </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 text-txt-primary font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-3">Booking ID</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-primary">
                    <span className="font-bold">{booking.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={booking.avatar} alt="" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                      <div>
                        <span className="block font-medium text-txt-primary">{booking.client}</span>
                        <span className="text-xs text-txt-muted">Regular</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-txt-secondary font-medium">{booking.service}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-txt-primary">{booking.date}</span>
                      <span className="text-xs text-txt-muted">{booking.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-txt-primary">{booking.price}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase
                      ${booking.status === 'Confirmed' ? 'bg-green-100 text-success' : 
                        booking.status === 'Pending' ? 'bg-yellow-100 text-warning' : 
                        'bg-red-100 text-danger'}
                    `}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="text-txt-muted hover:text-primary transition-colors">
                         <i className='bx bx-edit-alt text-lg'></i>
                      </button>
                      <button className="text-txt-muted hover:text-danger transition-colors">
                         <i className='bx bx-trash text-lg'></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-gray-100">
           <span className="text-xs text-txt-muted">Showing 1 to 5 of 50 entries</span>
           <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-txt-secondary hover:bg-gray-200"><i className='bx bx-chevron-left'></i></button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white shadow-sm shadow-primary/50">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-txt-secondary hover:bg-gray-200">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-txt-secondary hover:bg-gray-200"><i className='bx bx-chevron-right'></i></button>
           </div>
        </div>
      </div>
    </div>
  );
};