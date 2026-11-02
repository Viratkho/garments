import React from 'react';
import { getStatusBadgeStyle } from '../../utils/formatters';

export const Badge = ({ children, status, className = '' }) => {
  const badgeStyle = status ? getStatusBadgeStyle(status) : 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      {children || status}
    </span>
  );
};
