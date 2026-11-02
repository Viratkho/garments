import React from 'react';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../context/CompanyContext';

export const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { company } = useCompany();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center">
          <span className="text-xs font-bold text-[#172B4D] tracking-tight">{company.name}</span>
          <span className="text-xs text-gray-300 mx-2">|</span>
          <span className="text-xs font-semibold text-gray-500">GarmentFlow Workstation</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* User Profile Pill */}
        <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-full">
          <div className="w-6 h-6 rounded-full bg-[#172B4D] text-white flex items-center justify-center text-xs font-bold">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-none">{user?.name || 'Store Owner'}</p>
            <p className="text-[10px] text-gray-500 leading-none mt-1">{user?.email || 'admin@garmentflow.com'}</p>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
            {user?.role || 'ADMIN'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors focus:outline-none"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
