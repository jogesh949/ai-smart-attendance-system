import React from 'react';
import PageTransition from '../components/PageTransition';
import AdminOverview from './admin/AdminOverview'; // Assuming AdminOverview is the content for the dashboard

const AdminDashboard = () => {
  return (
    <PageTransition>
      <AdminOverview />
    </PageTransition>
  );
};

export default AdminDashboard;