import React, { useState } from 'react';
import { useCompany } from '../../context/CompanyContext';

export const CompanyLogo = ({
  size = 'md',
  showText = true,
  className = '',
  textColor = 'text-white',
  subtextColor = 'text-gray-400',
}) => {
  const { company } = useCompany();
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: {
      box: 'w-7 h-7 text-xs rounded-md',
      img: 'h-7 max-w-[100px] object-contain',
      title: 'text-sm font-bold',
      subtitle: 'text-[9px]',
    },
    md: {
      box: 'w-9 h-9 text-sm rounded-lg',
      img: 'h-9 max-w-[140px] object-contain',
      title: 'text-base font-extrabold',
      subtitle: 'text-[10px]',
    },
    lg: {
      box: 'w-12 h-12 text-lg rounded-xl shadow-md',
      img: 'h-12 max-w-[180px] object-contain',
      title: 'text-xl font-black',
      subtitle: 'text-xs',
    },
    xl: {
      box: 'w-16 h-16 text-2xl rounded-2xl shadow-lg',
      img: 'h-16 max-w-[220px] object-contain',
      title: 'text-2xl font-black',
      subtitle: 'text-xs',
    },
  }[size] || {
    box: 'w-9 h-9 text-sm rounded-lg',
    img: 'h-9 max-w-[140px] object-contain',
    title: 'text-base font-extrabold',
    subtitle: 'text-[10px]',
  };

  const hasImage = Boolean(company.logoUrl && !imgError);

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      {hasImage ? (
        <img
          src={company.logoUrl}
          alt={company.name}
          onError={() => setImgError(true)}
          className={sizeClasses.img}
        />
      ) : (
        /* Typographic DP Monogram Identity */
        <div
          className={`${sizeClasses.box} bg-gradient-to-br from-[#172B4D] to-[#0F1B2F] border border-blue-400/30 flex items-center justify-center font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-tr from-blue-300 via-white to-blue-200 select-none shadow-xs`}
          title={company.name}
        >
          DP
        </div>
      )}

      {showText && (
        <div className="leading-tight">
          <h1 className={`${sizeClasses.title} tracking-tight ${textColor}`}>
            {company.name}
          </h1>
          <p className={`${sizeClasses.subtitle} font-medium tracking-wide ${subtextColor}`}>
            GarmentFlow ERP
          </p>
        </div>
      )}
    </div>
  );
};
