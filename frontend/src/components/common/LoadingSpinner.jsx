import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mb-2" />
      <p className="text-xs font-medium text-gray-500">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
