import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Badge } from '../../components/common/Badge';
import { EmptyState, LoadingSpinner } from '../../components/common/EmptyState';
import { FileText, Plus, Search, Download, Trash2, Printer } from 'lucide-react';

export const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    orderId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    discount: 0,
    taxPercent: 0,
    notes: 'Thank you for your business!',
    terms: 'Payment due upon delivery or within agreed 15-day credit terms.',
  });

  const { success, error } = useNotification();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices({ search });
      if (res.success) {
        setInvoices(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.getOrders();
      if (res.success) setOrders(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreateModal = () => {
    setInvoiceForm({
      orderId: orders.length > 0 ? String(orders[0].id) : '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount: 0,
      taxPercent: 0,
      notes: 'Goods once delivered in good condition are subject to agreement.',
      terms: 'Payment balance due upon invoice receipt.',
    });
    setIsModalOpen(true);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceForm.orderId) return error('Please select an order');

    setSubmitting(true);
    try {
      await api.createInvoice(invoiceForm);
      success('Tax Invoice generated successfully!');
      setIsModalOpen(false);
      fetchInvoices();
    } catch (err) {
      error(err.message || 'Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (id, num) => {
    try {
      const blob = await api.downloadInvoicePdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${num || 'Invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      error(err.message || 'Failed to download invoice PDF');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cancel this invoice?')) {
      try {
        await api.deleteInvoice(id);
        success('Invoice cancelled');
        fetchInvoices();
      } catch (err) {
        error(err.message || 'Failed to cancel');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Invoice Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate and print official PDF tax invoices with itemized specifications and configurable GST.
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} icon={Plus}>
          Generate Invoice
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice #, Company, or Order #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>
        <span className="text-xs text-gray-400">Total: {invoices.length} Invoices</span>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading invoices..." />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Invoices Generated"
          description="Generate formal invoices for completed bulk orders with custom GST configuration."
          action={<Button onClick={handleOpenCreateModal} icon={Plus}>Generate First Invoice</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Tax / GST</th>
                  <th className="py-3 px-4 text-right">Total Invoiced</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{inv.company?.name}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">{inv.order?.orderNumber}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {Number(inv.taxAmount) > 0 ? formatCurrency(inv.taxAmount) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">{formatCurrency(inv.balanceDue)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Generate Invoice */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Tax Invoice"
        subtitle="Generates itemized invoice and prepares printable PDF document"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Select
            label="Select Bulk Manufacturing Order"
            required
            value={invoiceForm.orderId}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, orderId: e.target.value })}
            options={orders.map(o => ({ value: String(o.id), label: `${o.orderNumber} – ${o.title} (${o.totalPieces} pcs)` }))}
            placeholder="Select order to invoice"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Invoice Date"
              type="date"
              required
              value={invoiceForm.invoiceDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
            />
            <Input
              label="Payment Due Date"
              type="date"
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Discount (₹)"
              type="number"
              step="0.01"
              min={0}
              value={invoiceForm.discount}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: Number(e.target.value) })}
            />
            <Input
              label="Tax / GST % (Optional - 0% if unregistered)"
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={invoiceForm.taxPercent}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, taxPercent: Number(e.target.value) })}
              helperText="GST is optional. Leave 0% if shop is unregistered."
            />
          </div>

          <Textarea
            label="Invoice Notes"
            rows={2}
            value={invoiceForm.notes}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
          />

          <Textarea
            label="Payment Terms"
            rows={2}
            value={invoiceForm.terms}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Generate Tax Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
