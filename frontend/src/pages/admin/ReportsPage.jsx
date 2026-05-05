import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Button, Card } from '../../components/UI';

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Detailed Reports Module</h3>
        <p className="text-gray-500 max-w-md">This module allows you to export CSVs, filter by dates and subjects, and view individual student tracking. Functionality mocked for demo.</p>
        <Button className="mt-6">Download Monthly CSV Report</Button>
      </Card>
    </div>
  );
};

export default ReportsPage;
