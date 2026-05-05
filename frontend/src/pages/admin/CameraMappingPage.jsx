import React from 'react';
import { Camera } from 'lucide-react';
import { Card } from '../../components/UI';

const CameraMappingPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Camera Mapping</h1>
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <Camera className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Camera Configuration</h3>
        <p className="text-gray-500 max-w-md">Map physical cameras to specific classrooms and configure streaming endpoints. This feature is coming soon.</p>
      </Card>
    </div>
  );
};

export default CameraMappingPage;
