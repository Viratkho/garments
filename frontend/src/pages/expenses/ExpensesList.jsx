import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Badge } from '../../components/common/Badge';
import { EmptyState, LoadingSpinner } from '../../components/common/EmptyState';
import {
  Receipt,
  Plus,
  Search,
  Divide,
  Trash2,
  Paperclip,
  Tag,
  FolderPlus,
} from 'lucide-react';

export const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [overheadOnly, setOverheadOnly] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    categoryId: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    orderId: '',
    paymentMethod: 'CASH',
    isOverhead: false,
  });

  const [receiptFile, setReceiptFile] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    isOverhead: false,
  });

  // Overhead Allocation state
  const [allocationMethod, setAllocationMethod] = useState('EQUAL'); // EQUAL, QUANTITY_BASED, MANUAL
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  const { success, error } = useNotification();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (overheadOnly) params.isOverhead = 'true';

      const res = await api.getExpenses(params);
      if (res.success) {
        setExpenses(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [catRes, ordRes] = await Promise.all([
        api.getExpenseCategories(),
        api.getOrders({ status: 'IN_PROGRESS' }),
      ]);
      if (catRes.success) setCategories(catRes.data);
      if (ordRes.success) setOrders(ordRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, overheadOnly]);

  const handleOpenCreateModal = () => {
    setExpenseForm({
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
      orderId: '',
      paymentMethod: 'CASH',
      isOverhead: false,
    });
    setReceiptFile(null);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.categoryId) return error('Please select a category');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('categoryId', expenseForm.categoryId);
      formData.append('amount', expenseForm.amount);
      formData.append('description', expenseForm.description);
      formData.append('expenseDate', expenseForm.expenseDate);
      if (expenseForm.orderId) formData.append('orderId', expenseForm.orderId);
      formData.append('paymentMethod', expenseForm.paymentMethod);
      formData.append('isOverhead', String(expenseForm.isOverhead));

      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      await api.createExpense(formData);
      success('Expense recorded successfully');
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err) {
      error(err.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createExpenseCategory(categoryForm);
      success('Expense category created');
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: '', isOverhead: false });
      loadDependencies();
    } catch (err) {
      error(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAllocate = (exp) => {
    setSelectedExpense(exp);
    setSelectedOrderIds(orders.map(o => o.id));
    setAllocationMethod('EQUAL');
    setIsAllocateModalOpen(true);
  };

  const handleSaveAllocation = async () => {
    if (selectedOrderIds.length === 0) return error('Select at least one active order');
    setSubmitting(true);
    try {
      const orderAllocations = selectedOrderIds.map(orderId => ({ orderId }));
      await api.allocateOverhead(selectedExpense.id, {
        allocationMethod,
        orderAllocations,
      });
      success('Shared overhead allocated among selected orders!');
      setIsAllocateModalOpen(false);
      fetchExpenses();
    } catch (err) {
      error(err.message || 'Allocation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Archive this expense record?')) {
      try {
        await api.deleteExpense(id);
        success('Expense archived');
        fetchExpenses();
      } catch (err) {
        error(err.message || 'Failed to archive');
      }
    }
  };

  const totalExpenseSum = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Expense Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track operational expenses, raw materials, electricity, rent, logistics, and allocate shared overheads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={FolderPlus} onClick={() => setIsCategoryModalOpen(true)}>
            Add Category
          </Button>
          <Button size="sm" icon={Plus} onClick={handleOpenCreateModal}>
            Record Expense
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Recorded Expenses</span>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalExpenseSum)}</p>
        </div>
        <span className="text-xs text-gray-400">{expenses.length} Expense Transactions</span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by expense #, description, or category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setOverheadOnly(!overheadOnly)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium border flex items-center gap-1 transition-colors ${
              overheadOnly
                ? 'bg-purple-600 text-white border-purple-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Divide className="w-3.5 h-3.5" />
            Overheads Only
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading expense entries..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Expenses Logged"
          description="Record electricity, rent, maintenance, material purchases, or direct order expenses."
          action={<Button onClick={handleOpenCreateModal} icon={Plus}>Record First Expense</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Expense #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Type / Order</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">{e.expenseNumber}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(e.expenseDate)}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{e.category?.name}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{e.description || '—'}</td>
                    <td className="py-3 px-4">
                      {e.order ? (
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Order: {e.order.orderNumber}
                        </span>
                      ) : e.isOverhead ? (
                        <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          Shared Overhead ({e.overheadAllocations?.length || 0} split)
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500">General Expense</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(e.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      {e.receiptUrl ? (
                        <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800" title="View receipt">
                          <Paperclip className="w-4 h-4 inline" />
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {e.isOverhead && (
                        <button
                          onClick={() => handleOpenAllocate(e)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="Allocate overhead to orders"
                        >
                          <Divide className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Archive expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Record Expense */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Business Expense"
        subtitle="Log operational overheads or direct job costs"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Expense Category"
              required
              value={expenseForm.categoryId}
              onChange={(e) => {
                const catId = e.target.value;
                const cat = categories.find(c => String(c.id) === String(catId));
                setExpenseForm({
                  ...expenseForm,
                  categoryId: catId,
                  isOverhead: cat ? cat.isOverhead : false,
                });
              }}
              options={categories.map(c => ({ value: String(c.id), label: `${c.name} ${c.isOverhead ? '(Overhead)' : ''}` }))}
              placeholder="Select category"
            />
            <Input
              label="Expense Date"
              type="date"
              required
              value={expenseForm.expenseDate}
              onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount (₹)"
              type="number"
              step="0.01"
              required
              min={1}
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            />
            <Select
              label="Payment Method"
              value={expenseForm.paymentMethod}
              onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'UPI', label: 'UPI / PhonePe / GPay' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'CHEQUE', label: 'Cheque' },
              ]}
            />
          </div>

          <Select
            label="Related Order (Optional - Leave blank for general overhead)"
            value={expenseForm.orderId}
            onChange={(e) => setExpenseForm({ ...expenseForm, orderId: e.target.value })}
            options={orders.map(o => ({ value: String(o.id), label: `${o.orderNumber} – ${o.title}` }))}
            placeholder="General / Shared Expense (Not order specific)"
          />

          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
            <input
              type="checkbox"
              id="isOverhead"
              checked={expenseForm.isOverhead}
              onChange={(e) => setExpenseForm({ ...expenseForm, isOverhead: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isOverhead" className="text-xs text-gray-700 font-medium">
              Treat as shared overhead (Can be split equally or proportionally among active manufacturing orders)
            </label>
          </div>

          <Input
            label="Description"
            required
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            placeholder="e.g. Factory electricity bill, sewing machine spare part replacement"
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Receipt / Bill Attachment
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setReceiptFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Record Expense</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Category */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Expense Category"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name"
            required
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="e.g. Generator Fuel, Machine Lubricants"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="catOverhead"
              checked={categoryForm.isOverhead}
              onChange={(e) => setCategoryForm({ ...categoryForm, isOverhead: e.target.checked })}
              className="rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="catOverhead" className="text-xs text-gray-700 font-medium">
              Overhead Category
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Category</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Allocate Overhead */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title={`Allocate Shared Overhead: ${selectedExpense?.expenseNumber}`}
        subtitle={`Amount to distribute: ${formatCurrency(selectedExpense?.amount)}`}
      >
        <div className="space-y-4 text-xs">
          <Select
            label="Distribution Algorithm"
            value={allocationMethod}
            onChange={(e) => setAllocationMethod(e.target.value)}
            options={[
              { value: 'EQUAL', label: 'Equal Split (Distributed equally across selected orders)' },
              { value: 'QUANTITY_BASED', label: 'Quantity-Based (Proportional to order pieces)' },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Select Target Manufacturing Orders:
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded p-3">
              {orders.map((o) => (
                <label key={o.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(o.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedOrderIds([...selectedOrderIds, o.id]);
                      else setSelectedOrderIds(selectedOrderIds.filter(id => id !== o.id));
                    }}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="font-semibold text-gray-900">{o.orderNumber}</span>
                  <span className="text-gray-600">{o.title}</span>
                  <span className="text-gray-400 ml-auto">{o.totalPieces} pcs</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsAllocateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAllocation} loading={submitting}>
              Distribute Overhead to Orders
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
