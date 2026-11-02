import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Badge } from '../../components/common/Badge';
import { EmptyState, LoadingSpinner } from '../../components/common/EmptyState';
import {
  Package,
  Plus,
  Search,
  Copy,
  XCircle,
  Eye,
  Calendar,
  Building2,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

export const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create Order Form State
  const [orderForm, setOrderForm] = useState({
    companyId: '',
    title: '',
    description: '',
    pricingMethod: 'PER_PIECE', // PER_PIECE or FIXED_QUOTE
    totalPieces: 500,
    unitRate: 70,
    totalQuotedAmount: 35000,
    deliveryDate: '',
    specialInstructions: '',
  });

  const [specs, setSpecs] = useState([
    { specKey: 'Fabric', specValue: '100% Combed Cotton' },
    { specKey: 'Collar Style', specValue: 'Classic Spread Collar' },
  ]);

  const [designFile, setDesignFile] = useState(null);

  const { success, error } = useNotification();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (companyFilter) params.companyId = companyFilter;

      const res = await api.getOrders(params);
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.getCompanies();
      if (res.success) {
        setCompanies(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, companyFilter]);

  const handleOpenCreateModal = () => {
    setOrderForm({
      companyId: companies.length > 0 ? String(companies[0].id) : '',
      title: '',
      description: '',
      pricingMethod: 'PER_PIECE',
      totalPieces: 100,
      unitRate: 150,
      totalQuotedAmount: 15000,
      deliveryDate: '',
      specialInstructions: '',
    });
    setSpecs([
      { specKey: 'Fabric', specValue: '' },
      { specKey: 'Collar / Neck Style', specValue: '' },
    ]);
    setDesignFile(null);
    setIsModalOpen(true);
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { specKey: '', specValue: '' }]);
  };

  const handleRemoveSpec = (index) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index, field, value) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.companyId) {
      return error('Please select a client company');
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('companyId', orderForm.companyId);
      formData.append('title', orderForm.title);
      formData.append('description', orderForm.description);
      formData.append('pricingMethod', orderForm.pricingMethod);
      formData.append('totalPieces', orderForm.totalPieces);
      formData.append('unitRate', orderForm.unitRate);
      formData.append('totalQuotedAmount', orderForm.totalQuotedAmount);
      if (orderForm.deliveryDate) formData.append('deliveryDate', orderForm.deliveryDate);
      formData.append('specialInstructions', orderForm.specialInstructions);

      // Append specs
      const validSpecs = specs.filter(s => s.specKey.trim() && s.specValue.trim());
      formData.append('specifications', JSON.stringify(validSpecs));

      if (designFile) {
        formData.append('designImage', designFile);
      }

      const res = await api.createOrder(formData);
      success('Bulk order created with production tracking stages!');
      setIsModalOpen(false);
      fetchOrders();
      if (res.data?.id) {
        navigate(`/orders/${res.data.id}`);
      }
    } catch (err) {
      error(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.duplicateOrder(id);
      success('Order duplicated successfully');
      fetchOrders();
      if (res.data?.id) {
        navigate(`/orders/${res.data.id}`);
      }
    } catch (err) {
      error(err.message || 'Failed to duplicate order');
    }
  };

  const handleCancel = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await api.cancelOrder(id);
        success('Order cancelled');
        fetchOrders();
      } catch (err) {
        error(err.message || 'Failed to cancel order');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Bulk Order Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage garment manufacturing orders, custom specifications and delivery schedules.</p>
        </div>
        <Button onClick={handleOpenCreateModal} icon={Plus}>
          Create Bulk Order
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order #, Title, or Company..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500 max-w-[180px] truncate"
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List / Cards */}
      {loading ? (
        <LoadingSpinner text="Loading bulk orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Bulk Orders Found"
          description="Create a bulk garment order with custom piece count, unit pricing, and technical specifications."
          action={<Button onClick={handleOpenCreateModal} icon={Plus}>Create First Order</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-lg border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2563EB] tracking-wide">
                    {ord.orderNumber}
                  </span>
                  <Badge status={ord.status} />
                </div>
                <h3 className="mt-2 text-sm font-bold text-gray-900 line-clamp-1">
                  {ord.title}
                </h3>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {ord.company?.name || 'Unknown Company'}
                </p>
              </div>

              {/* Card Metrics */}
              <div className="p-4 bg-gray-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Order Quantity:</span>
                  <span className="font-bold text-gray-900">{ord.totalPieces} Pieces</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Pricing Method:</span>
                  <span className="font-medium text-gray-700">
                    {ord.pricingMethod === 'FIXED_QUOTE' ? 'Fixed Quotation' : `₹${ord.unitRate}/piece`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total Revenue:</span>
                  <span className="font-bold text-base text-gray-900">
                    {formatCurrency(ord.totalRevenue)}
                  </span>
                </div>
                {ord.deliveryDate && (
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      Target Delivery:
                    </span>
                    <span className="font-medium">{formatDate(ord.deliveryDate)}</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleDuplicate(ord.id, e)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                    title="Duplicate Order"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {ord.status !== 'CANCELLED' && (
                    <button
                      onClick={(e) => handleCancel(ord.id, e)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      title="Cancel Order"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Link
                  to={`/orders/${ord.id}`}
                  className="inline-flex items-center text-xs font-semibold text-white bg-[#172B4D] hover:bg-navy-light px-3 py-1.5 rounded-md transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View & Costing
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Bulk Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-3xl"
        title="Create Bulk Manufacturing Order"
        subtitle="Set garment specifications, pricing method, delivery timeline and material requirements"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Client Company"
              required
              value={orderForm.companyId}
              onChange={(e) => setOrderForm({ ...orderForm, companyId: e.target.value })}
              options={companies.map(c => ({ value: String(c.id), label: `${c.name} (${c.code})` }))}
              placeholder="Select client company"
            />
            <Input
              label="Order Title / Style Name"
              required
              value={orderForm.title}
              onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })}
              placeholder="e.g. Oxford Button-Down Shirts (Navy/White)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-blue-50/50 rounded-lg border border-blue-100">
            <Select
              label="Pricing Method"
              required
              value={orderForm.pricingMethod}
              onChange={(e) => setOrderForm({ ...orderForm, pricingMethod: e.target.value })}
              options={[
                { value: 'PER_PIECE', label: 'Per-Piece Rate (Qty × Rate)' },
                { value: 'FIXED_QUOTE', label: 'Fixed Quotation Total' },
              ]}
            />
            <Input
              label="Total Quantity (Pieces)"
              type="number"
              required
              min={1}
              value={orderForm.totalPieces}
              onChange={(e) => {
                const pieces = Number(e.target.value);
                const rate = Number(orderForm.unitRate);
                setOrderForm({
                  ...orderForm,
                  totalPieces: pieces,
                  totalQuotedAmount: pieces * rate,
                });
              }}
            />
            {orderForm.pricingMethod === 'PER_PIECE' ? (
              <Input
                label="Unit Rate (₹ per piece)"
                type="number"
                step="0.01"
                required
                min={0}
                value={orderForm.unitRate}
                onChange={(e) => {
                  const rate = Number(e.target.value);
                  const pieces = Number(orderForm.totalPieces);
                  setOrderForm({
                    ...orderForm,
                    unitRate: rate,
                    totalQuotedAmount: pieces * rate,
                  });
                }}
              />
            ) : (
              <Input
                label="Total Negotiated Quote (₹)"
                type="number"
                step="0.01"
                required
                min={0}
                value={orderForm.totalQuotedAmount}
                onChange={(e) => setOrderForm({ ...orderForm, totalQuotedAmount: Number(e.target.value) })}
              />
            )}
          </div>

          <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">Calculated Order Revenue:</span>
            <span className="font-bold text-sm text-blue-700">
              {formatCurrency(orderForm.pricingMethod === 'FIXED_QUOTE' ? orderForm.totalQuotedAmount : (orderForm.totalPieces * orderForm.unitRate))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target Delivery Date"
              type="date"
              value={orderForm.deliveryDate}
              onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Design Spec Sheet / Tech Pack (Image or PDF)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setDesignFile(e.target.files[0])}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          <Textarea
            label="Garment Description & Detailed Requirements"
            rows={2}
            value={orderForm.description}
            onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
            placeholder="e.g. 500 Customized Long Sleeve Button-Down Shirts with chest pocket and embroidered logo"
          />

          {/* Custom Specifications Builder */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Custom Garment Specifications
              </span>
              <button
                type="button"
                onClick={handleAddSpec}
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Specification
              </button>
            </div>
            <div className="space-y-2">
              {specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spec.specKey}
                    onChange={(e) => handleSpecChange(idx, 'specKey', e.target.value)}
                    placeholder="Spec (e.g. Fabric, Collar)"
                    className="w-1/3 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={spec.specValue}
                    onChange={(e) => handleSpecChange(idx, 'specValue', e.target.value)}
                    placeholder="Specification Detail (e.g. 100% Combed Cotton Poplin)"
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label="Special Production Instructions"
            rows={2}
            value={orderForm.specialInstructions}
            onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
            placeholder="Double needle stitching, reinforced collar, ABC Textiles custom woven label..."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Order & Initialize Tracking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
