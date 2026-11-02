import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Badge } from '../../components/common/Badge';
import { EmptyState, LoadingSpinner } from '../../components/common/EmptyState';
import { CreditCard, Plus, Search, Trash2 } from 'lucide-react';

export const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyId: '',
    orderId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    paymentType: 'ADVANCE',
    referenceNo: '',
    notes: '',
  });

  const { success, error } = useNotification();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.getPayments({ search });
      if (res.success) {
        setPayments(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [compRes, ordRes] = await Promise.all([
        api.getCompanies(),
        api.getOrders(),
      ]);
      if (compRes.success) setCompanies(compRes.data);
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
      fetchPayments();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setFormData({
      companyId: companies.length > 0 ? String(companies[0].id) : '',
      orderId: orders.length > 0 ? String(orders[0].id) : '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
      paymentType: 'ADVANCE',
      referenceNo: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      return error('Please enter a valid payment amount');
    }

    setSubmitting(true);
    try {
      await api.createPayment(formData);
      success('Payment recorded and credited to company balance');
      setIsModalOpen(false);
      fetchPayments();
    } catch (err) {
      error(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this payment transaction?')) {
      try {
        await api.deletePayment(id);
        success('Payment record deleted');
        fetchPayments();
      } catch (err) {
        error(err.message || 'Failed to delete');
      }
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Client Payments & Collections</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Log advance payments, progressive instalments, and final balance settlements from client companies.
          </p>
        </div>
        <Button onClick={handleOpenCreate} icon={Plus}>
          Record Payment
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Cash Collected</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Payment #, Company, Order # or Reference..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading payment transactions..." />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Payments Recorded"
          description="Record client advances or instalment payments against company bulk orders."
          action={<Button onClick={handleOpenCreate} icon={Plus}>Record First Payment</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Payment Type</th>
                  <th className="py-3 px-4">Method / UTR</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">{p.paymentNumber}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{p.company?.name}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">{p.order?.orderNumber || 'General Account'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                        {p.paymentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div>{p.paymentMethod}</div>
                      {p.referenceNo && <span className="font-mono text-[10px] text-gray-400">{p.referenceNo}</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded"
                        title="Delete record"
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

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Client Payment"
        subtitle="Credits client ledger and updates invoice balance due"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Company"
              required
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              options={companies.map(c => ({ value: String(c.id), label: `${c.name} (${c.code})` }))}
              placeholder="Select client company"
            />
            <Select
              label="Linked Order (Optional)"
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              options={orders.map(o => ({ value: String(o.id), label: `${o.orderNumber} – ${o.title}` }))}
              placeholder="Select order reference"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount Received (₹)"
              type="number"
              step="0.01"
              required
              min={1}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <Input
              label="Payment Date"
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Payment Type"
              required
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              options={[
                { value: 'ADVANCE', label: 'Advance Deposit' },
                { value: 'INSTALMENT', label: 'Progressive Instalment' },
                { value: 'FINAL_SETTLEMENT', label: 'Final Account Settlement' },
              ]}
            />
            <Select
              label="Payment Method"
              required
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={[
                { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS/IMPS)' },
                { value: 'UPI', label: 'UPI / GooglePay / PhonePe' },
                { value: 'CASH', label: 'Cash' },
                { value: 'CHEQUE', label: 'Cheque' },
              ]}
            />
          </div>

          <Input
            label="Transaction Reference / UTR Number"
            value={formData.referenceNo}
            onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
            placeholder="e.g. UTR-20261101-7781"
          />

          <Textarea
            label="Notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Advance payment against 500 shirt uniform batch"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Log Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
