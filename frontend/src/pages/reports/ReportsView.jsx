import React, { useState } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { Button } from '../../components/common/Button';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  DollarSign,
  Layers,
  Users,
  Package,
} from 'lucide-react';

export const ReportsView = () => {
  const [downloading, setDownloading] = useState(null);
  const { success, error } = useNotification();

  const handleDownloadExcel = async (type) => {
    setDownloading(type);
    try {
      let blob;
      let filename;

      if (type === 'orders') {
        blob = await api.exportOrdersExcel();
        filename = 'GarmentFlow_Orders_Profitability_Report.xlsx';
      } else if (type === 'inventory') {
        blob = await api.exportInventoryExcel();
        filename = 'GarmentFlow_Inventory_Stock_Valuation.xlsx';
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success(`${filename} exported successfully!`);
    } catch (err) {
      error(err.message || 'Export failed');
    } finally {
      setDownloading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportCards = [
    {
      id: 'orders',
      title: 'Order-wise Profit & Costing Report',
      description: 'Comprehensive report including contract revenue, material costs, allocated labour, overheads, net margin, and per-piece cost.',
      icon: DollarSign,
      type: 'EXCEL',
      action: () => handleDownloadExcel('orders'),
    },
    {
      id: 'inventory',
      title: 'Raw Materials & Stock Valuation',
      description: 'Inventory levels across all fabrics and trims with dynamic weighted average cost calculations and minimum stock status.',
      icon: Layers,
      type: 'EXCEL',
      action: () => handleDownloadExcel('inventory'),
    },
    {
      id: 'pnl',
      title: 'Annual Profit & Loss Statement',
      description: 'Official P&L sheet showing total contract revenues, actual business expense categories, operating margin and cash collections.',
      icon: BarChart3,
      type: 'PRINT',
      action: () => window.location.href = '/profit-loss',
    },
    {
      id: 'salaries',
      title: 'Worker Salary & Labour Allocation Ledger',
      description: 'Audit report of monthly worker salary disbursements, productive hours, hourly rate snapshots, and order labour shares.',
      icon: Users,
      type: 'VIEW',
      action: () => window.location.href = '/salaries',
    },
    {
      id: 'production',
      title: '10-Stage Production & Quality Report',
      description: 'Factory production pipeline log tracking cutting, collar, pocket, assembly, finishing, QC inspection passes, and delivery notes.',
      icon: Package,
      type: 'VIEW',
      action: () => window.location.href = '/production',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Business Reports & Export Center</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Export transaction logs, order-wise costing audits, and inventory valuations to Excel, PDF or print.
          </p>
        </div>
        <Button variant="outline" icon={Printer} onClick={handlePrint}>
          Print Current View
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <r.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                  {r.type}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mt-1">{r.title}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.description}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Real-time database records</span>
              <Button
                size="sm"
                variant="primary"
                icon={r.type === 'EXCEL' ? FileSpreadsheet : Download}
                loading={downloading === r.id}
                onClick={r.action}
              >
                {r.type === 'EXCEL' ? 'Export Excel (.xlsx)' : 'View & Export'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
