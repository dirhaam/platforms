import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Bookings } from './pages/Bookings';
import { GenericPage } from './pages/GenericPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="customers" element={<GenericPage title="Customers" />} />
          <Route path="services" element={<GenericPage title="Services" />} />
          <Route path="staff" element={<GenericPage title="Staff" />} />
          <Route path="sales" element={<GenericPage title="Sales" />} />
          <Route path="finance" element={<GenericPage title="Finance" />} />
          <Route path="invoices" element={<GenericPage title="Invoices" />} />
          <Route path="messages" element={<GenericPage title="Messages" />} />
          <Route path="whatsapp" element={<GenericPage title="WhatsApp" />} />
          <Route path="analytics" element={<GenericPage title="Analytics" />} />
          <Route path="settings" element={<GenericPage title="Settings" />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;