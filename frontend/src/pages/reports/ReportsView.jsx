import React, { useState } from 'react';
import { api } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
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
  const { company } = useCompany();
  const [downloading, setDownloading] = useState(null);
  const { success, error } = useNotification();

  const handleDownloadExcel = async (type) => {
    setDownloading(type);
    try {
      let blob;
      let filename;

      if (type === 'orders') {
        blob = await api.exportOrdersExcel();
        filename = 'DP_ENTERPRISES_Orders_Profitability_Report.xlsx';
      } else if (type === 'inventory') {
        blob = await api.exportInventoryExcel();
        filename = 'DP_ENTERPRISES_Inventory_Stock_Valuation.xlsx';
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success(`${filename} exported successfully for ${company.name}!`);
    } catch (err) {
      error(err.message || 'Export failed');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPnlPdf = async () => {
    setDownloading('pnl-pdf');
    try {
      const blob = await api.exportProfitLossPdf();
      const filename = 'DP_ENTERPRISES_Profit_Loss_Report.pdf';
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success(`Official Profit & Loss PDF report exported successfully for ${company.name}!`);
    } catch (err) {
      error(err.message || 'PDF Export failed');
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
      description: `Comprehensive manufacturing audit for ${company.name} including contract revenue, material costs, allocated labour, overheads, net margin, and per-piece cost.`,
      icon: DollarSign,
      type: 'EXCEL',
      action: () => handleDownloadExcel('orders'),
      btnLabel: 'Export Excel (.xlsx)',
    },
    {
      id: 'inventory',
      title: 'Raw Materials & Stock Valuation',
      description: `Warehouse valuation report across fabrics, trims, and threads with dynamic weighted average cost calculations and minimum stock status.`,
      icon: Layers,
      type: 'EXCEL',
      action: () => handleDownloadExcel('inventory'),
      btnLabel: 'Export Excel (.xlsx)',
    },
    {
      id: 'pnl-pdf',
      title: 'Official Profit & Loss PDF Statement',
      description: `Executive PDF report for ${company.name} showing total contract revenues, actual business expense categories, operating margin, and labour absorption.`,
      icon: FileText,
      type: 'PDF',
      action: handleDownloadPnlPdf,
      btnLabel: 'Export PDF (.pdf)',
    },
    {
      id: 'pnl',
      title: 'Interactive Annual Profit & Loss Statement',
      description: `Interactive online P&L sheet showing monthly and annual operating margins with double-counting prevention audit notes.`,
      icon: BarChart3,
      type: 'VIEW',
      action: () => window.location.href = '/profit-loss',
      btnLabel: 'Open P&L View',
    },
    {
      id: 'salaries',
      title: 'Worker Salary & Labour Allocation Ledger',
      description: `Audit report of monthly worker salary disbursements, productive hours, hourly rate snapshots, and order labour shares.`,
      icon: Users,
      type: 'VIEW',
      action: () => window.location.href = '/salaries',
      btnLabel: 'View Salary Ledger',
    },
    {
      id: 'production',
      title: '10-Stage Production & Quality Report',
      description: `Factory production pipeline tracking cutting, collar, pocket, assembly, finishing, QC inspection passes, and delivery notes.`,
      icon: Package,
      type: 'VIEW',
      action: () => window.location.href = '/production',
      btnLabel: 'View Production Log',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
              {company.name} Reporting
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Executive Reports & Data Export Center</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Export transaction logs, order-wise costing audits, and inventory valuations to formatted Excel, PDF or print.
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
              <span className="text-[11px] text-gray-400">Live database records</span>
              <Button
                size="sm"
                variant="primary"
                icon={r.type === 'EXCEL' ? FileSpreadsheet : (r.type === 'PDF' ? FileText : Download)}
                loading={downloading === r.id}
                onClick={r.action}
              >
                {r.btnLabel}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
