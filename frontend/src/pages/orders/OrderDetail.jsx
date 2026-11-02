import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { LoadingSpinner } from '../../components/common/EmptyState';
import {
  Package,
  Building2,
  Calendar,
  Layers,
  Users,
  Kanban,
  FileText,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Download,
  AlertCircle,
  Truck,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Receipt,
} from 'lucide-react';

export const OrderDetail = () => {
  const { id } = useParams();
  const orderId = Number(id);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('costing'); // costing, materials, labour, production, invoices, specs

  // Form modals state
  const [materialModal, setMaterialModal] = useState(false);
  const [labourModal, setLabourModal] = useState(false);
  const [productionModal, setProductionModal] = useState(false);
  const [qualityModal, setQualityModal] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);

  // Auxiliary data
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [productionStages, setProductionStages] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Consumption Form
  const [consumptionForm, setConsumptionForm] = useState({
    materialId: '',
    source: 'SHOP',
    requiredQuantity: 0,
    consumedQuantity: 0,
    wastageQuantity: 0,
    notes: '',
  });

  // Labour Allocation Form
  const [labourForm, setLabourForm] = useState({
    workerId: '',
    allocationMethod: 'HOUR_BASED',
    hoursWorked: 8,
    piecesProduced: 0,
    manualCost: 0,
    notes: '',
  });

  // Production Update Form
  const [stageForm, setStageForm] = useState({
    stageId: '',
    completedQuantity: 0,
    defectiveQuantity: 0,
    reworkQuantity: 0,
    wastageRecorded: 0,
    status: 'IN_PROGRESS',
    notes: '',
  });

  // Quality Check Form
  const [qcForm, setQcForm] = useState({
    stageId: '',
    inspectedQuantity: 0,
    approvedQuantity: 0,
    rejectedQuantity: 0,
    defectReason: '',
    status: 'PASSED',
    notes: '',
  });

  // Delivery Form
  const [deliveryForm, setDeliveryForm] = useState({
    deliveredQuantity: 0,
    deliveryDate: new Date().toISOString().split('T')[0],
    recipientName: '',
    recipientContact: '',
    trackingNumber: '',
    notes: '',
  });

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    paymentType: 'ADVANCE',
    referenceNo: '',
    notes: '',
  });

  // Direct Expense Form
  const [expenseForm, setExpenseForm] = useState({
    categoryId: '',
    amount: 0,
    description: '',
    paymentMethod: 'CASH',
  });

  const { success, error } = useNotification();

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getOrder(orderId);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const loadAuxData = async () => {
    try {
      const [matRes, workRes, stageRes, expCatRes] = await Promise.all([
        api.getMaterials(),
        api.getWorkers(),
        api.getProductionStages(),
        api.getExpenseCategories(),
      ]);
      if (matRes.success) setAvailableMaterials(matRes.data);
      if (workRes.success) setAvailableWorkers(workRes.data);
      if (stageRes.success) setProductionStages(stageRes.data);
      if (expCatRes.success) setExpenseCategories(expCatRes.data);
    } catch (e) {
      console.error('Aux data error:', e);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    loadAuxData();
  }, [orderId]);

  if (loading || !order) {
    return <LoadingSpinner text="Computing order costing & live progress..." />;
  }

  const { costing } = order;
  const fin = costing?.financials || {};

  // Handlers for Submitting Forms
  const handleRecordConsumption = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.recordMaterialConsumption(orderId, consumptionForm);
      success('Material consumed and inventory updated!');
      setMaterialModal(false);
      fetchOrderDetails();
    } catch (err) {
      error(err.message || 'Failed to record consumption');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConsumption = async (consumptionId) => {
    if (window.confirm('Reverse this consumption and restore stock?')) {
      try {
        await api.deleteMaterialConsumption(consumptionId);
        success('Consumption reversed and inventory restored');
        fetchOrderDetails();
      } catch (err) {
        error(err.message || 'Failed to reverse consumption');
      }
    }
  };

  const handleRecordLabour = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.recordLabourAllocation(orderId, labourForm);
      success('Worker labour allocated to order!');
      setLabourModal(false);
      fetchOrderDetails();
    } catch (err) {
      error(err.message || 'Failed to allocate labour');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLabour = async (labourId) => {
    if (window.confirm('Delete this labour allocation?')) {
      try {
        await api.deleteLabourAllocation(labourId);
        success('Labour allocation removed');
        fetchOrderDetails();
      } catch (err) {
        error(err.message || 'Failed to delete labour allocation');
      }
    }
  };

  const handleUpdateStage = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.updateStageProgress(orderId, stageForm);
      success('Stage progress updated!');
      setProductionModal(false);
      fetchOrderDetails();
    } catch (err) {
      error(err.message || 'Failed to update stage progress');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordQC = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.recordQualityCheck(orderId, qcForm);
      success('Quality check recorded!');
      setQualityModal(false);
      fetchOrderDetails();
    } catch (err) {
      error(err.message || 'Failed to record QC');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordDelivery = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.recordDelivery(orderId, deliveryForm);
      success('Delivery dispatch recorded!');
      setDeliveryModal(false);
      fetchOrderDetails();
    } catch (err) {
      error(err.message || 'Failed to record delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (window.confirm('Generate official invoice for this order?')) {
      try {
        await api.createInvoice({ orderId });
        success('Invoice generated successfully!');
        fetchOrderDetails();
      } catch (err) {
        error(err.message || 'Failed to generate invoice');
      }
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createPayment({ ...paymentForm, orderId, companyId: order.companyId });
      success('Payment recorded successfully!');
      setPaymentModal(false);
      fetchOrderDetails();
    } catch (err) {
      error(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('categoryId', expenseForm.categoryId);
      formData.append('amount', expenseForm.amount);
      formData.append('description', expenseForm.description);
      formData.append('paymentMethod', expenseForm.paymentMethod);
      formData.append('orderId', orderId);
      formData.append('isOverhead', 'false');

      await api.createExpense(formData);
      success('Direct order expense recorded!');
      setExpenseModal(false);
      fetchOrderDetails();
    } catch (err) {
      error(err.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoicePdf = async (invoiceId, invoiceNumber) => {
    try {
      const blob = await api.downloadInvoicePdf(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber || 'Invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      error(err.message || 'Failed to download invoice PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back and Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to="/orders" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>
        <span className="text-xs text-gray-400 font-mono">ID: #{order.id}</span>
      </div>

      {/* Main Order Header Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#2563EB] tracking-wider">{order.orderNumber}</span>
            <Badge status={order.status} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{order.title}</h1>
          <p className="text-xs text-gray-500 flex items-center mt-1">
            <Building2 className="w-3.5 h-3.5 mr-1 text-gray-400" />
            <span className="font-medium text-gray-700">{order.company?.name}</span>
            <span className="mx-2">•</span>
            <span>{order.totalPieces} Pieces</span>
            <span className="mx-2">•</span>
            <span>Target: {formatDate(order.deliveryDate)}</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" icon={Layers} onClick={() => {
            setConsumptionForm({
              materialId: availableMaterials.length > 0 ? String(availableMaterials[0].id) : '',
              source: 'SHOP',
              requiredQuantity: 10,
              consumedQuantity: 10,
              wastageQuantity: 0,
              notes: '',
            });
            setMaterialModal(true);
          }}>
            Consume Material
          </Button>

          <Button size="sm" variant="outline" icon={Users} onClick={() => {
            setLabourForm({
              workerId: availableWorkers.length > 0 ? String(availableWorkers[0].id) : '',
              allocationMethod: 'HOUR_BASED',
              hoursWorked: 8,
              piecesProduced: 0,
              manualCost: 0,
              notes: '',
            });
            setLabourModal(true);
          }}>
            Allocate Labour
          </Button>

          <Button size="sm" variant="outline" icon={Receipt} onClick={() => {
            setExpenseForm({
              categoryId: expenseCategories.length > 0 ? String(expenseCategories[0].id) : '',
              amount: 500,
              description: 'Trims, packaging or transport for this order',
              paymentMethod: 'CASH',
            });
            setExpenseModal(true);
          }}>
            Add Expense
          </Button>

          <Button size="sm" variant="secondary" icon={CreditCard} onClick={() => {
            setPaymentForm({
              amount: fin.pendingPaymentBalance || 10000,
              paymentDate: new Date().toISOString().split('T')[0],
              paymentMethod: 'BANK_TRANSFER',
              paymentType: fin.totalPaymentsReceived > 0 ? 'INSTALMENT' : 'ADVANCE',
              referenceNo: '',
              notes: 'Payment received against order',
            });
            setPaymentModal(true);
          }}>
            Receive Payment
          </Button>
        </div>
      </div>

      {/* Real-Time Costing Engine KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Gross Revenue</span>
          <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(fin.revenue)}</p>
          <span className="text-[10px] text-gray-400">
            {order.pricingMethod === 'FIXED_QUOTE' ? 'Fixed Quotation' : `₹${order.unitRate}/pc`}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Material Cost</span>
          <p className="text-base font-bold text-amber-700 mt-1">{formatCurrency(fin.actualMaterialCost)}</p>
          <span className="text-[10px] text-gray-400">{costing?.breakdowns?.shopMaterials?.length || 0} materials consumed</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Allocated Labour</span>
          <p className="text-base font-bold text-blue-700 mt-1">{formatCurrency(fin.actualLabourCost)}</p>
          <span className="text-[10px] text-gray-400">{costing?.breakdowns?.labour?.length || 0} worker logs</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Order Cost</span>
          <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(fin.totalOrderCost)}</p>
          <span className="text-[10px] text-gray-400">Materials + Labour + Exps</span>
        </div>

        <div className={`p-3.5 rounded-lg border ${fin.netProfit >= 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${fin.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
            Net Order Profit
          </span>
          <p className={`text-base font-bold mt-1 ${fin.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(fin.netProfit)}
          </p>
          <span className="text-[10px] font-semibold text-emerald-800">
            {fin.profitMargin}% Margin
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pending Balance</span>
          <p className="text-base font-bold text-rose-600 mt-1">{formatCurrency(fin.pendingPaymentBalance)}</p>
          <span className="text-[10px] text-gray-400">Recv: {formatCurrency(fin.totalPaymentsReceived)}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'costing', label: 'Order Costing Engine', icon: DollarSign },
            { id: 'materials', label: `Materials (${costing?.breakdowns?.shopMaterials?.length + costing?.breakdowns?.companyMaterials?.length || 0})`, icon: Layers },
            { id: 'labour', label: `Worker Labour (${costing?.breakdowns?.labour?.length || 0})`, icon: Users },
            { id: 'production', label: 'Production & QC (10 Stages)', icon: Kanban },
            { id: 'invoices', label: `Invoices & Payments (${order.invoices?.length || 0})`, icon: FileText },
            { id: 'specs', label: 'Garment Tech Specs', icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 flex items-center whitespace-nowrap border-b-2 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-1.5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: Order Costing Engine */}
      {activeTab === 'costing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Centralized Order Financial Statement</h3>
            <p className="text-xs text-gray-500 mb-5">
              Accurate breakdown of manufacturing revenue, material costs, allocated labour and net profitability.
            </p>

            <div className="space-y-4">
              {/* Cost bar visual */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-gray-700">Cost Structure Breakdown</span>
                  <span className="text-gray-500">Cost Per Garment: <strong>{formatCurrency(fin.costPerGarment)}</strong> / piece</span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
                  {fin.revenue > 0 && (
                    <>
                      <div
                        style={{ width: `${Math.min(100, (fin.actualMaterialCost / fin.revenue) * 100)}%` }}
                        className="bg-amber-500 h-full"
                        title={`Materials: ${formatCurrency(fin.actualMaterialCost)}`}
                      />
                      <div
                        style={{ width: `${Math.min(100, (fin.actualLabourCost / fin.revenue) * 100)}%` }}
                        className="bg-blue-600 h-full"
                        title={`Labour: ${formatCurrency(fin.actualLabourCost)}`}
                      />
                      <div
                        style={{ width: `${Math.min(100, ((fin.directExpenseCost + fin.allocatedOverheadCost) / fin.revenue) * 100)}%` }}
                        className="bg-purple-500 h-full"
                        title={`Expenses & Overheads: ${formatCurrency(fin.directExpenseCost + fin.allocatedOverheadCost)}`}
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 mt-2">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" /> Materials ({formatCurrency(fin.actualMaterialCost)})</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-1.5" /> Labour ({formatCurrency(fin.actualLabourCost)})</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5" /> Direct Expenses & Overheads ({formatCurrency(fin.directExpenseCost + fin.allocatedOverheadCost)})</span>
                  <span className="flex items-center font-bold text-emerald-700 ml-auto">Net Profit: {formatCurrency(fin.netProfit)}</span>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden mt-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 font-semibold text-gray-700">
                    <tr>
                      <th className="py-2.5 px-4">Financial Component</th>
                      <th className="py-2.5 px-4">Calculation Method / Source</th>
                      <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    <tr>
                      <td className="py-3 px-4 font-bold text-gray-900">1. Order Revenue</td>
                      <td className="py-3 px-4 text-gray-500">{order.pricingMethod === 'FIXED_QUOTE' ? 'Fixed Contract Quotation' : `${order.totalPieces} pcs @ ₹${order.unitRate}/piece`}</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">{formatCurrency(fin.revenue)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-gray-800 pl-8">• Shop Raw Material Consumption</td>
                      <td className="py-2.5 px-4 text-gray-500">Actual consumed qty × Weighted average cost snapshot</td>
                      <td className="py-2.5 px-4 text-right text-gray-800">− {formatCurrency(fin.actualMaterialCost)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-gray-800 pl-8">• Worker Labour Cost</td>
                      <td className="py-2.5 px-4 text-gray-500">Hours worked × Derived productive hourly rate (Monthly salary / 200 hrs)</td>
                      <td className="py-2.5 px-4 text-right text-gray-800">− {formatCurrency(fin.actualLabourCost)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-gray-800 pl-8">• Direct Order Expenses</td>
                      <td className="py-2.5 px-4 text-gray-500">Directly recorded trims, packaging, transport for this order</td>
                      <td className="py-2.5 px-4 text-right text-gray-800">− {formatCurrency(fin.directExpenseCost)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-gray-800 pl-8">• Allocated Overhead Cost</td>
                      <td className="py-2.5 px-4 text-gray-500">Allocated rent, power or maintenance share</td>
                      <td className="py-2.5 px-4 text-right text-gray-800">− {formatCurrency(fin.allocatedOverheadCost)}</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                      <td className="py-3 px-4 text-gray-900">Total Manufacturing Cost</td>
                      <td className="py-3 px-4 text-gray-500">Sum of materials, direct labour, expenses and overheads</td>
                      <td className="py-3 px-4 text-right text-gray-900">− {formatCurrency(fin.totalOrderCost)}</td>
                    </tr>
                    <tr className={fin.netProfit >= 0 ? 'bg-emerald-50 text-emerald-900 font-bold' : 'bg-rose-50 text-rose-900 font-bold'}>
                      <td className="py-3.5 px-4 text-sm">Net Operating Profit</td>
                      <td className="py-3.5 px-4 text-xs font-normal">Order Revenue − Total Manufacturing Cost</td>
                      <td className="py-3.5 px-4 text-right text-sm font-bold">{formatCurrency(fin.netProfit)} ({fin.profitMargin}%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Materials Consumption */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Order Material Consumptions</h3>
              <p className="text-xs text-gray-500">Fabrics, threads, buttons and linings consumed for this specific order.</p>
            </div>
            <Button size="sm" icon={Plus} onClick={() => setMaterialModal(true)}>
              Record Consumption
            </Button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Required Qty</th>
                  <th className="py-3 px-4 text-right">Consumed Qty</th>
                  <th className="py-3 px-4 text-right">Wastage</th>
                  <th className="py-3 px-4 text-right">Unit Cost Snapshot</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {costing?.breakdowns?.shopMaterials?.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{m.materialName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">SHOP</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{m.requiredQuantity} {m.unit}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{m.consumedQuantity} {m.unit}</td>
                    <td className="py-3 px-4 text-right text-amber-600">{m.wastageQuantity} {m.unit}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(m.unitCostSnapshot)}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(m.totalCost)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteConsumption(m.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                        title="Delete and restore stock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Company-supplied materials */}
                {costing?.breakdowns?.companyMaterials?.map((m) => (
                  <tr key={m.id} className="bg-purple-50/30 hover:bg-purple-50/50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{m.materialName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        COMPANY SUPPLIED
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{m.requiredQuantity} {m.unit}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{m.consumedQuantity} {m.unit}</td>
                    <td className="py-3 px-4 text-right text-gray-500">{m.wastageQuantity} {m.unit}</td>
                    <td className="py-3 px-4 text-right text-gray-400">₹0.00 (Client Provided)</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-500">₹0.00</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteConsumption(m.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {(!costing?.breakdowns?.shopMaterials || costing.breakdowns.shopMaterials.length === 0) &&
                 (!costing?.breakdowns?.companyMaterials || costing.breakdowns.companyMaterials.length === 0) && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No materials consumed for this order yet. Click "Record Consumption" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Labour Allocation */}
      {activeTab === 'labour' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Worker Labour Allocations</h3>
              <p className="text-xs text-gray-500">
                Labour hours devoted to cutting, stitching, and finishing this order.
              </p>
            </div>
            <Button size="sm" icon={Plus} onClick={() => setLabourModal(true)}>
              Allocate Labour
            </Button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Hours Worked</th>
                  <th className="py-3 px-4 text-right">Hourly Rate Snapshot</th>
                  <th className="py-3 px-4 text-right">Allocated Cost</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {costing?.breakdowns?.labour?.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{l.workerName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                        {l.allocationMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-800">{l.hoursWorked} hrs</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(l.hourlyRateSnapshot)}/hr</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(l.allocatedCost)}</td>
                    <td className="py-3 px-4 text-gray-500 truncate max-w-xs">{l.notes || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteLabour(l.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                        title="Delete allocation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!costing?.breakdowns?.labour || costing.breakdowns.labour.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No labour hours allocated yet. Click "Allocate Labour" to assign worker effort.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Production Tracking across 10 Stages */}
      {activeTab === 'production' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">10-Stage Production Pipeline</h3>
              <p className="text-xs text-gray-500">Track piece counts from initial cutting through finishing, QC and dispatch.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                setQcForm({
                  stageId: String(productionStages.find(s => s.stageName === 'Quality Checking')?.id || 8),
                  inspectedQuantity: order.totalPieces,
                  approvedQuantity: order.totalPieces,
                  rejectedQuantity: 0,
                  defectReason: '',
                  status: 'PASSED',
                  notes: 'All garments inspected and approved.',
                });
                setQualityModal(true);
              }}>
                Record QC Check
              </Button>
              <Button size="sm" icon={Truck} onClick={() => {
                setDeliveryForm({
                  deliveredQuantity: order.totalPieces,
                  deliveryDate: new Date().toISOString().split('T')[0],
                  recipientName: order.company?.contactPerson || '',
                  recipientContact: order.company?.phone || '',
                  trackingNumber: '',
                  notes: 'Full delivery dispatched',
                });
                setDeliveryModal(true);
              }}>
                Dispatch Delivery
              </Button>
            </div>
          </div>

          {/* Stages List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {order.productionUpdates?.map((pu) => {
              const completed = pu.completedQuantity || 0;
              const pct = order.totalPieces > 0 ? Math.min(100, Math.round((completed / order.totalPieces) * 100)) : 0;
              const isFinished = pu.status === 'COMPLETED' || completed >= order.totalPieces;

              return (
                <div
                  key={pu.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isFinished ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-gray-700">{pu.stage?.stageOrder}. {pu.stage?.stageName}</span>
                    <Badge status={pu.status} />
                  </div>
                  <div className="flex items-baseline justify-between text-xs mt-1">
                    <span className="text-lg font-bold text-gray-900">{completed}</span>
                    <span className="text-gray-400">/ {order.totalPieces} pcs</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFinished ? 'bg-emerald-500' : 'bg-blue-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setStageForm({
                        stageId: String(pu.stageId),
                        completedQuantity: completed,
                        defectiveQuantity: pu.defectiveQuantity || 0,
                        reworkQuantity: pu.reworkQuantity || 0,
                        wastageRecorded: Number(pu.wastageRecorded || 0),
                        status: pu.status,
                        notes: pu.notes || '',
                      });
                      setProductionModal(true);
                    }}
                    className="w-full mt-3 text-[11px] font-semibold text-blue-600 hover:text-blue-800 text-center block pt-1 border-t border-gray-100"
                  >
                    Update Progress →
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quality Records & Deliveries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            {/* QC Records */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                Quality Inspections Log
              </h4>
              <div className="divide-y divide-gray-100 text-xs">
                {order.qualityRecords && order.qualityRecords.length > 0 ? (
                  order.qualityRecords.map((qc) => (
                    <div key={qc.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">{qc.inspectorName} – {formatDate(qc.inspectionDate)}</div>
                        <div className="text-[11px] text-gray-500">
                          Inspected: {qc.inspectedQuantity} | Approved: <strong className="text-emerald-600">{qc.approvedQuantity}</strong> | Rejected: <strong className="text-rose-600">{qc.rejectedQuantity}</strong>
                        </div>
                        {qc.defectReason && <p className="text-[11px] text-rose-500 mt-0.5">Defect: {qc.defectReason}</p>}
                      </div>
                      <Badge status={qc.status} />
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-gray-400">No QC records logged yet.</p>
                )}
              </div>
            </div>

            {/* Deliveries */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                Dispatches & Deliveries
              </h4>
              <div className="divide-y divide-gray-100 text-xs">
                {order.deliveries && order.deliveries.length > 0 ? (
                  order.deliveries.map((del) => (
                    <div key={del.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800 font-mono text-blue-600">{del.deliveryNumber}</div>
                        <div className="text-[11px] text-gray-500">
                          Qty: <strong>{del.deliveredQuantity} pcs</strong> | Date: {formatDate(del.deliveryDate)}
                        </div>
                        {del.recipientName && <p className="text-[11px] text-gray-500">Recv by: {del.recipientName} ({del.recipientContact})</p>}
                      </div>
                      <Badge status={del.status} />
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-gray-400">No deliveries dispatched yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Invoices & Payments */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Invoices & Client Payments</h3>
              <p className="text-xs text-gray-500">Generate tax invoice, print PDF, and manage advance & final settlements.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" icon={FileText} onClick={handleGenerateInvoice}>
                Generate Invoice
              </Button>
              <Button size="sm" icon={CreditCard} onClick={() => setPaymentModal(true)}>
                Record Payment
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoices */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Invoices</h4>
              <div className="space-y-3">
                {order.invoices && order.invoices.length > 0 ? (
                  order.invoices.map((inv) => (
                    <div key={inv.id} className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#2563EB]">{inv.invoiceNumber}</span>
                          <Badge status={inv.status} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Date: {formatDate(inv.invoiceDate)}</div>
                        <div className="text-xs font-bold text-gray-900 mt-1">
                          Total: {formatCurrency(inv.totalAmount)} • Balance: <span className="text-rose-600">{formatCurrency(inv.balanceDue)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadInvoicePdf(inv.id, inv.invoiceNumber)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Download PDF Invoice"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-xs text-gray-400">No invoices generated yet.</p>
                )}
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Payments Received</h4>
              <div className="divide-y divide-gray-100 text-xs">
                {order.payments && order.payments.length > 0 ? (
                  order.payments.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[11px] text-gray-400">{p.paymentNumber}</span>
                        <div className="font-bold text-gray-900">{formatCurrency(p.amount)}</div>
                        <div className="text-[11px] text-gray-500">{p.paymentMethod} • {p.paymentType} • {formatDate(p.paymentDate)}</div>
                        {p.referenceNo && <div className="text-[10px] text-gray-400 font-mono">Ref: {p.referenceNo}</div>}
                      </div>
                      <Badge status="COMPLETED">Received</Badge>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-gray-400">No client payments recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Garment Tech Specs */}
      {activeTab === 'specs' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Garment Technical Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {order.specifications?.map((s) => (
              <div key={s.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.specKey}</span>
                <p className="font-semibold text-gray-900 mt-1">{s.specValue}</p>
                {s.notes && <p className="text-[11px] text-gray-500 mt-0.5">{s.notes}</p>}
              </div>
            ))}
          </div>

          {order.specialInstructions && (
            <div className="p-4 bg-amber-50 rounded-md border border-amber-200 text-xs mt-4">
              <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block mb-1">
                Special Manufacturing Instructions
              </span>
              <p className="text-amber-800">{order.specialInstructions}</p>
            </div>
          )}

          {order.designImageUrl && (
            <div className="pt-4 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-700 block mb-2">Design Spec Attachment:</span>
              <img
                src={order.designImageUrl}
                alt="Order Design Spec"
                className="max-h-64 rounded border border-gray-200 object-contain shadow-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* --- ALL MODALS --- */}

      {/* 1. Modal: Record Material Consumption */}
      <Modal
        isOpen={materialModal}
        onClose={() => setMaterialModal(false)}
        title="Record Material Consumption"
        subtitle="Deducts raw materials from inventory and snapshots unit cost to order costing"
      >
        <form onSubmit={handleRecordConsumption} className="space-y-4">
          <Select
            label="Raw Material"
            required
            value={consumptionForm.materialId}
            onChange={(e) => setConsumptionForm({ ...consumptionForm, materialId: e.target.value })}
            options={availableMaterials.map(m => ({
              value: String(m.id),
              label: `${m.name} (Stock: ${m.currentStock} ${m.unit} @ ₹${m.weightedAvgCost}/${m.unit})`,
            }))}
            placeholder="Select material from stock"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Source"
              required
              value={consumptionForm.source}
              onChange={(e) => setConsumptionForm({ ...consumptionForm, source: e.target.value })}
              options={[
                { value: 'SHOP', label: 'Shop Inventory (Incurs material cost)' },
                { value: 'COMPANY', label: 'Company Supplied (Zero shop cost)' },
              ]}
            />
            <Input
              label="Actual Consumed Quantity"
              type="number"
              step="0.01"
              required
              min={0.01}
              value={consumptionForm.consumedQuantity}
              onChange={(e) => setConsumptionForm({ ...consumptionForm, consumedQuantity: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Wastage Quantity (Scraps / Cutting waste)"
              type="number"
              step="0.01"
              min={0}
              value={consumptionForm.wastageQuantity}
              onChange={(e) => setConsumptionForm({ ...consumptionForm, wastageQuantity: Number(e.target.value) })}
            />
            <Input
              label="Required Quantity (Estimated)"
              type="number"
              step="0.01"
              value={consumptionForm.requiredQuantity}
              onChange={(e) => setConsumptionForm({ ...consumptionForm, requiredQuantity: Number(e.target.value) })}
            />
          </div>

          <Textarea
            label="Consumption Notes"
            rows={2}
            value={consumptionForm.notes}
            onChange={(e) => setConsumptionForm({ ...consumptionForm, notes: e.target.value })}
            placeholder="e.g. Cutting panels for main shirts, collar canvas fusing..."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setMaterialModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Consumption & Deduct Stock</Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Allocate Labour */}
      <Modal
        isOpen={labourModal}
        onClose={() => setLabourModal(false)}
        title="Allocate Worker Labour to Order"
        subtitle="Calculates labour cost based on worker hourly rate derived from monthly salary"
      >
        <form onSubmit={handleRecordLabour} className="space-y-4">
          <Select
            label="Worker"
            required
            value={labourForm.workerId}
            onChange={(e) => setLabourForm({ ...labourForm, workerId: e.target.value })}
            options={availableWorkers.map(w => ({
              value: String(w.id),
              label: `${w.name} (Monthly: ₹${w.agreedSalary} → ₹${w.computedHourlyRate}/hr)`,
            }))}
            placeholder="Select factory worker"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Allocation Method"
              required
              value={labourForm.allocationMethod}
              onChange={(e) => setLabourForm({ ...labourForm, allocationMethod: e.target.value })}
              options={[
                { value: 'HOUR_BASED', label: 'Hour-Based Allocation (Hours × Hourly Rate)' },
                { value: 'PRODUCTION_BASED', label: 'Production-Based (Pieces × Piece Rate)' },
                { value: 'MANUAL', label: 'Manual Fixed Cost Entry' },
              ]}
            />
            {labourForm.allocationMethod === 'HOUR_BASED' && (
              <Input
                label="Hours Worked on this Order"
                type="number"
                step="0.25"
                required
                min={0.1}
                value={labourForm.hoursWorked}
                onChange={(e) => setLabourForm({ ...labourForm, hoursWorked: Number(e.target.value) })}
              />
            )}
            {labourForm.allocationMethod === 'MANUAL' && (
              <Input
                label="Manual Cost (₹)"
                type="number"
                step="0.01"
                required
                value={labourForm.manualCost}
                onChange={(e) => setLabourForm({ ...labourForm, manualCost: Number(e.target.value) })}
              />
            )}
          </div>

          <Textarea
            label="Work Details / Operation Notes"
            rows={2}
            value={labourForm.notes}
            onChange={(e) => setLabourForm({ ...labourForm, notes: e.target.value })}
            placeholder="e.g. 20 hours collar stitching, assembly and button attachment"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setLabourModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Allocate Labour Cost</Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Update Production Stage */}
      <Modal
        isOpen={productionModal}
        onClose={() => setProductionModal(false)}
        title="Update Production Stage Progress"
        subtitle="Record completed, defective or rework quantities"
      >
        <form onSubmit={handleUpdateStage} className="space-y-4">
          <Select
            label="Stage"
            required
            value={stageForm.stageId}
            onChange={(e) => setStageForm({ ...stageForm, stageId: e.target.value })}
            options={productionStages.map(s => ({ value: String(s.id), label: `${s.stageOrder}. ${s.stageName}` }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Completed Quantity"
              type="number"
              required
              min={0}
              value={stageForm.completedQuantity}
              onChange={(e) => setStageForm({ ...stageForm, completedQuantity: Number(e.target.value) })}
            />
            <Input
              label="Defective Quantity"
              type="number"
              min={0}
              value={stageForm.defectiveQuantity}
              onChange={(e) => setStageForm({ ...stageForm, defectiveQuantity: Number(e.target.value) })}
            />
            <Input
              label="Rework Quantity"
              type="number"
              min={0}
              value={stageForm.reworkQuantity}
              onChange={(e) => setStageForm({ ...stageForm, reworkQuantity: Number(e.target.value) })}
            />
          </div>

          <Select
            label="Status"
            required
            value={stageForm.status}
            onChange={(e) => setStageForm({ ...stageForm, status: e.target.value })}
            options={[
              { value: 'NOT_STARTED', label: 'Not Started' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setProductionModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Progress</Button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal: Record QC Check */}
      <Modal
        isOpen={qualityModal}
        onClose={() => setQualityModal(false)}
        title="Record Quality Inspection"
        subtitle="Pass or flag defectives for rework"
      >
        <form onSubmit={handleRecordQC} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Inspected Quantity"
              type="number"
              required
              value={qcForm.inspectedQuantity}
              onChange={(e) => setQcForm({ ...qcForm, inspectedQuantity: Number(e.target.value) })}
            />
            <Input
              label="Approved Quantity"
              type="number"
              required
              value={qcForm.approvedQuantity}
              onChange={(e) => setQcForm({ ...qcForm, approvedQuantity: Number(e.target.value) })}
            />
            <Input
              label="Rejected Quantity"
              type="number"
              value={qcForm.rejectedQuantity}
              onChange={(e) => setQcForm({ ...qcForm, rejectedQuantity: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Defect Reason (if any)"
            value={qcForm.defectReason}
            onChange={(e) => setQcForm({ ...qcForm, defectReason: e.target.value })}
            placeholder="e.g. Loose collar stitching, skipped hem"
          />

          <Select
            label="Inspection Status"
            value={qcForm.status}
            onChange={(e) => setQcForm({ ...qcForm, status: e.target.value })}
            options={[
              { value: 'PASSED', label: 'Passed - Quality Approved' },
              { value: 'REWORK_REQUIRED', label: 'Rework Required' },
              { value: 'FAILED', label: 'Failed' },
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setQualityModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Log Quality Record</Button>
          </div>
        </form>
      </Modal>

      {/* 5. Modal: Record Delivery */}
      <Modal
        isOpen={deliveryModal}
        onClose={() => setDeliveryModal(false)}
        title="Dispatch Delivery"
        subtitle="Record partial or full order shipment to client"
      >
        <form onSubmit={handleRecordDelivery} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Delivered Quantity (Pieces)"
              type="number"
              required
              min={1}
              value={deliveryForm.deliveredQuantity}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveredQuantity: Number(e.target.value) })}
            />
            <Input
              label="Delivery Date"
              type="date"
              required
              value={deliveryForm.deliveryDate}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Recipient Name"
              value={deliveryForm.recipientName}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, recipientName: e.target.value })}
            />
            <Input
              label="Recipient Contact"
              value={deliveryForm.recipientContact}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, recipientContact: e.target.value })}
            />
          </div>

          <Input
            label="Tracking / Waybill / LR Number"
            value={deliveryForm.trackingNumber}
            onChange={(e) => setDeliveryForm({ ...deliveryForm, trackingNumber: e.target.value })}
            placeholder="e.g. EXP-CARGO-77192"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setDeliveryModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Confirm Delivery Dispatch</Button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal: Record Payment */}
      <Modal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Receive Client Payment"
        subtitle="Log advance, instalment, or final settlement for this order"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Payment Amount (₹)"
              type="number"
              step="0.01"
              required
              min={1}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
            />
            <Input
              label="Payment Date"
              type="date"
              required
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Payment Type"
              required
              value={paymentForm.paymentType}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
              options={[
                { value: 'ADVANCE', label: 'Advance Payment' },
                { value: 'INSTALMENT', label: 'Instalment' },
                { value: 'FINAL_SETTLEMENT', label: 'Final Settlement' },
              ]}
            />
            <Select
              label="Payment Method"
              required
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              options={[
                { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS/IMPS)' },
                { value: 'UPI', label: 'UPI / GooglePay / PhonePe' },
                { value: 'CASH', label: 'Cash' },
                { value: 'CHEQUE', label: 'Cheque' },
              ]}
            />
          </div>

          <Input
            label="Reference / Transaction / UTR Number"
            value={paymentForm.referenceNo}
            onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
            placeholder="e.g. UTR-20261101-8891"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setPaymentModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Record Payment & Update Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* 7. Modal: Add Direct Expense */}
      <Modal
        isOpen={expenseModal}
        onClose={() => setExpenseModal(false)}
        title="Record Direct Order Expense"
        subtitle="Log transportation, special packaging, buttons, or direct job costs"
      >
        <form onSubmit={handleRecordExpense} className="space-y-4">
          <Select
            label="Expense Category"
            required
            value={expenseForm.categoryId}
            onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
            options={expenseCategories.map(c => ({ value: String(c.id), label: c.name }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount (₹)"
              type="number"
              step="0.01"
              required
              min={1}
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
            />
            <Select
              label="Payment Method"
              value={expenseForm.paymentMethod}
              onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'UPI', label: 'UPI' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              ]}
            />
          </div>

          <Input
            label="Description"
            required
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            placeholder="e.g. Custom poly bags and courier delivery"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setExpenseModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Expense to Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
