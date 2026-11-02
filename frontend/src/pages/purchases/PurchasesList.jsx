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
  ShoppingBag,
  Plus,
  Search,
  Truck,
  Calendar,
  FileText,
  Trash2,
  Paperclip,
} from 'lucide-react';

export const PurchasesList = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Purchase Form
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceRef: '',
    paymentStatus: 'PAID',
    notes: '',
  });

  const [items, setItems] = useState([
    { materialId: '', quantity: 100, unit: 'METRE', totalCost: 8000, unitCost: 80 },
  ]);

  const [billFile, setBillFile] = useState(null);

  const { success, error } = useNotification();

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.getPurchases({ search });
      if (res.success) {
        setPurchases(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [supRes, matRes] = await Promise.all([
        api.getSuppliers(),
        api.getMaterials(),
      ]);
      if (supRes.success) setSuppliers(supRes.data);
      if (matRes.success) setMaterials(matRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPurchases();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreateModal = () => {
    setPurchaseForm({
      supplierId: suppliers.length > 0 ? String(suppliers[0].id) : '',
      purchaseDate: new Date().toISOString().split('T')[0],
      invoiceRef: '',
      paymentStatus: 'PAID',
      notes: '',
    });
    setItems([
      {
        materialId: materials.length > 0 ? String(materials[0].id) : '',
        quantity: 100,
        unit: materials.length > 0 ? materials[0].unit : 'METRE',
        totalCost: 8000,
        unitCost: 80,
      },
    ]);
    setBillFile(null);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    const defMat = materials[0];
    setItems([
      ...items,
      {
        materialId: defMat ? String(defMat.id) : '',
        quantity: 10,
        unit: defMat ? defMat.unit : 'PIECE',
        totalCost: 1000,
        unitCost: 100,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'materialId') {
      const mat = materials.find(m => String(m.id) === String(value));
      if (mat) updated[index].unit = mat.unit;
    }

    if (field === 'quantity' || field === 'totalCost') {
      const qty = Number(field === 'quantity' ? value : updated[index].quantity);
      const tot = Number(field === 'totalCost' ? value : updated[index].totalCost);
      updated[index].unitCost = qty > 0 ? Number((tot / qty).toFixed(2)) : 0;
    }

    setItems(updated);
  };

  const totalPurchaseAmount = items.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseForm.supplierId) return error('Please select a supplier');
    if (items.length === 0) return error('At least one material item is required');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('supplierId', purchaseForm.supplierId);
      formData.append('purchaseDate', purchaseForm.purchaseDate);
      formData.append('invoiceRef', purchaseForm.invoiceRef);
      formData.append('paymentStatus', purchaseForm.paymentStatus);
      formData.append('totalAmount', totalPurchaseAmount);
      formData.append('notes', purchaseForm.notes);
      formData.append('items', JSON.stringify(items));

      if (billFile) {
        formData.append('billAttachment', billFile);
      }

      await api.createPurchase(formData);
      success('Material purchase logged! Weighted average cost and stock updated.');
      setIsModalOpen(false);
      fetchPurchases();
    } catch (err) {
      error(err.message || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Material Purchases</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Log supplier purchases, update dynamic weighted average unit costs, and track incoming bills.
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} icon={Plus}>
          Purchase Materials
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Purchase #, Supplier, or Invoice Ref..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>
        <span className="text-xs text-gray-400">Total: {purchases.length} Purchases</span>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading material purchases..." />
      ) : purchases.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Purchases Logged"
          description="Record material purchases from suppliers like cotton fabrics, polyester, zippers, or threads."
          action={<Button onClick={handleOpenCreateModal} icon={Plus}>Record First Purchase</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Purchase #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Items Purchased</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.purchaseNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{p.supplier?.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(p.purchaseDate)}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">{p.invoiceRef || '—'}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {p.items?.map((it, i) => (
                        <div key={i} className="text-[11px]">
                          <strong>{it.material?.name}</strong>: {it.quantity} {it.unit} @ {formatCurrency(it.unitCost)}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(p.totalAmount)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={p.paymentStatus} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.billAttachmentUrl ? (
                        <a
                          href={p.billAttachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="View Bill Attachment"
                        >
                          <Paperclip className="w-4 h-4 inline" />
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Purchase Materials */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-3xl"
        title="Record Raw Material Purchase"
        subtitle="Calculates unit cost automatically and updates weighted average inventory valuation"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Supplier"
              required
              value={purchaseForm.supplierId}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
              options={suppliers.map(s => ({ value: String(s.id), label: s.name }))}
              placeholder="Select supplier"
            />
            <Input
              label="Purchase Date"
              type="date"
              required
              value={purchaseForm.purchaseDate}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Supplier Invoice Reference #"
              value={purchaseForm.invoiceRef}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceRef: e.target.value })}
              placeholder="e.g. INV-METRO-9921"
            />
            <Select
              label="Payment Status"
              value={purchaseForm.paymentStatus}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentStatus: e.target.value })}
              options={[
                { value: 'PAID', label: 'Paid in Full' },
                { value: 'PARTIAL', label: 'Partially Paid' },
                { value: 'PENDING', label: 'Payment Pending / Credit' },
              ]}
            />
          </div>

          {/* Dynamic Items Builder */}
          <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Materials & Pricing Details
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 bg-white rounded border border-gray-200 flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Material</label>
                    <select
                      value={item.materialId}
                      onChange={(e) => handleItemChange(idx, 'materialId', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500"
                    >
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min={0.01}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
                    />
                  </div>

                  <div className="w-32">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Total Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min={0.01}
                      value={item.totalCost}
                      onChange={(e) => handleItemChange(idx, 'totalCost', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
                    />
                  </div>

                  <div className="w-28 text-center bg-gray-50 p-1.5 rounded">
                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Unit Cost</span>
                    <span className="text-xs font-bold text-blue-700">₹{item.unitCost}/{item.unit}</span>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between items-center text-xs font-bold text-gray-800 pt-2 border-t border-gray-200">
              <span>Total Purchase Value:</span>
              <span className="text-base text-blue-700">{formatCurrency(totalPurchaseAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Upload Supplier Bill / Invoice Scan
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setBillFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <Textarea
            label="Notes"
            rows={2}
            value={purchaseForm.notes}
            onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
            placeholder="e.g. Purchased for ABC Textiles shirt manufacturing order"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Log Purchase & Update Stock</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
