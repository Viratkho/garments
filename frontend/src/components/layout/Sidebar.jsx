import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  Layers,
  ShoppingBag,
  Truck,
  Users,
  CalendarCheck,
  Wallet,
  Receipt,
  Calculator,
  Kanban,
  CreditCard,
  FileText,
  TrendingUp,
  BarChart3,
  Settings,
  X,
  Scissors,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const navigation = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Sales & Orders',
      items: [
        { name: 'Companies', href: '/companies', icon: Building2 },
        { name: 'Bulk Orders', href: '/orders', icon: Package },
        { name: 'Invoices', href: '/invoices', icon: FileText },
        { name: 'Payments', href: '/payments', icon: CreditCard },
      ],
    },
    {
      group: 'Inventory & Trims',
      items: [
        { name: 'Raw Materials', href: '/materials', icon: Layers },
        { name: 'Material Purchases', href: '/purchases', icon: ShoppingBag },
        { name: 'Suppliers', href: '/suppliers', icon: Truck },
      ],
    },
    {
      group: 'Factory & Labour',
      items: [
        { name: 'Workers', href: '/workers', icon: Users },
        { name: 'Attendance & Hours', href: '/attendance', icon: CalendarCheck },
        { name: 'Salaries', href: '/salaries', icon: Wallet },
      ],
    },
    {
      group: 'Production & Costs',
      items: [
        { name: 'Production Tracking', href: '/production', icon: Kanban },
        { name: 'Order Costing Engine', href: '/costing', icon: Calculator },
        { name: 'Expenses', href: '/expenses', icon: Receipt },
      ],
    },
    {
      group: 'Reports & Settings',
      items: [
        { name: 'Profit & Loss', href: '/profit-loss', icon: TrendingUp },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#172B4D] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 bg-[#0F1B2F]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#2563EB] rounded-md text-white shadow-sm">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-none">GARMENTFLOW</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-1">Manufacturing ERP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-400 hover:text-white rounded-md hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navigation.map((section) => (
            <div key={section.group}>
              <h2 className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {section.group}
              </h2>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-xs font-medium rounded-md transition-all ${
                        isActive
                          ? 'bg-[#2563EB] text-white shadow-sm font-semibold'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 mr-2.5 flex-shrink-0 opacity-80" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Shop Info Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0F1B2F]/60 text-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-medium text-emerald-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5"></span>
              MySQL Live
            </span>
            <span className="text-[10px] text-gray-400">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
