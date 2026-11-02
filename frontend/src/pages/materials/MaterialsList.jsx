import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { EmptyState, LoadingSpinner } from '../../components/common/EmptyState';
import {
  Layers,
  Plus,
  Search,
  AlertTriangle,
  SlidersHorizontal,
  FolderPlus,
  Edit2,
  Trash2,
  History,
} from 'lucide-react';

export const MaterialsList = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [materialModal, setMaterialModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [materialForm, setMaterialForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    unit: 'METRE',
    openingStock: 0,
    minStockLevel: 10,
    initialUnitCost: 0,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    adjustedStock: 0,
    reason: '',
  });

  const { success, error } = useNotification();

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (lowStockFilter) params.lowStock = 'true';

      const res = await api.getMaterials(params);
      if (res.success) {
        setMaterials(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.getMaterialCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, lowStockFilter]);

  const handleOpenCreateMaterial = () => {
    setSelectedMaterial(null);
    setMaterialForm({
      name: '',
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
      description: '',
      unit: 'METRE',
      openingStock: 0,
      minStockLevel: 10,
      initialUnitCost: 0,
    });
    setMaterialModal(true);
  };

  const handleOpenEditMaterial = (m) => {
    setSelectedMaterial(m);
    setMaterialForm({
      name: m.name,
      categoryId: String(m.categoryId),
      description: m.description || '',
      unit: m.unit,
      openingStock: Number(m.openingStock),
      minStockLevel: Number(m.minStockLevel),
      initialUnitCost: Number(m.weightedAvgCost),
    });
    setMaterialModal(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedMaterial) {
        await api.updateMaterial(selectedMaterial.id, materialForm);
        success('Material updated');
      } else {
        await api.createMaterial(materialForm);
        success('Material registered successfully');
      }
      setMaterialModal(false);
      fetchMaterials();
    } catch (err) {
      error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createMaterialCategory(categoryForm);
      success('Material category created');
      setCategoryModal(false);
      setCategoryForm({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      error(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAdjust = (m) => {
    setSelectedMaterial(m);
    setAdjustForm({
      adjustedStock: m.currentStock,
      reason: 'Physical inventory audit reconciliation',
    });
    setAdjustModal(true);
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.adjustStock(selectedMaterial.id, adjustForm);
      success('Stock reconciled and adjustment logged');
      setAdjustModal(false);
      fetchMaterials();
    } catch (err) {
      error(err.message || 'Stock adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHistory = async (m) => {
    try {
      const res = await api.getMaterial(m.id);
      if (res.success) {
        setSelectedMaterial(res.data);
        setHistoryModal(true);
      }
    } catch (err) {
      error('Failed to load material audit trail');
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm('Archive this material?')) {
      try {
        await api.deleteMaterial(id);
        success('Material archived');
        fetchMaterials();
      } catch (err) {
        error(err.message || 'Failed to delete');
      }
    }
  };

  const totalStockValuation = materials.reduce((sum, m) => sum + (m.totalValuation || 0), 0);
  const lowStockCount = materials.filter(m => m.isLowStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Raw Materials & Inventory</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage fabrics, threads, buttons, trims and real-time weighted average purchase costing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={FolderPlus} onClick={() => setCategoryModal(true)}>
            Add Category
          </Button>
          <Button size="sm" icon={Plus} onClick={handleOpenCreateMaterial}>
            Add Material
          </Button>
        </div>
      </div>

      {/* KPI mini-strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Raw Materials</span>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{materials.length} Items</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Inventory Value</span>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalStockValuation)}</p>
          </div>
          <span className="text-xs text-gray-400">At weighted avg cost</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Low Stock Warnings</span>
            <p className={`text-xl font-bold mt-0.5 ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {lowStockCount} Items
            </p>
          </div>
          <div className={`p-2 rounded-md ${lowStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search material by name, category or specs..."
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
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium border flex items-center gap-1 transition-colors ${
              lowStockFilter
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading materials inventory..." />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Materials Registered"
          description="Register raw materials such as Cotton Fabric, Threads, Buttons, Zippers, and Linings to track shop stock."
          action={<Button onClick={handleOpenCreateMaterial} icon={Plus}>Add First Material</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Min Level</th>
                  <th className="py-3 px-4 text-right">Weighted Avg Cost</th>
                  <th className="py-3 px-4 text-right">Total Valuation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materials.map((m) => (
                  <tr key={m.id} className={`hover:bg-gray-50 ${m.isLowStock ? 'bg-amber-50/30' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{m.name}</div>
                      {m.description && <div className="text-[11px] text-gray-500 truncate max-w-xs">{m.description}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                        {m.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-600">{m.unit}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${m.isLowStock ? 'text-rose-600' : 'text-gray-900'}`}>
                        {formatNumber(m.currentStock)}
                      </span>
                      {m.isLowStock && (
                        <span className="ml-1.5 text-[9px] font-bold uppercase text-rose-600 bg-rose-50 px-1 py-0.5 rounded">
                          LOW
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">{m.minStockLevel}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">{formatCurrency(m.weightedAvgCost)}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(m.totalValuation)}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenAdjust(m)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50"
                        title="Reconcile stock"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenHistory(m)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 rounded hover:bg-indigo-50"
                        title="Audit history"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditMaterial(m)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50"
                        title="Edit material"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(m.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Archive"
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

      {/* Modal: Add/Edit Material */}
      <Modal
        isOpen={materialModal}
        onClose={() => setMaterialModal(false)}
        title={selectedMaterial ? `Edit Material: ${selectedMaterial.name}` : 'Register New Material'}
        subtitle="Specify category, unit of measurement, initial stock and minimum alert threshold"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Material Name"
              required
              value={materialForm.name}
              onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
              placeholder="e.g. Cotton Fabric 60s, Pearl Buttons 18L"
            />
            <Select
              label="Material Category"
              required
              value={materialForm.categoryId}
              onChange={(e) => setMaterialForm({ ...materialForm, categoryId: e.target.value })}
              options={categories.map(c => ({ value: String(c.id), label: c.name }))}
              placeholder="Select category"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Unit of Measurement"
              required
              value={materialForm.unit}
              onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
              options={[
                { value: 'METRE', label: 'Metre (m)' },
                { value: 'ROLL', label: 'Roll' },
                { value: 'PIECE', label: 'Piece (pcs)' },
                { value: 'KG', label: 'Kilogram (kg)' },
                { value: 'YARD', label: 'Yard' },
                { value: 'CONE', label: 'Cone / Spool' },
                { value: 'PACKET', label: 'Packet' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
            {!selectedMaterial && (
              <Input
                label="Opening Stock"
                type="number"
                step="0.01"
                min={0}
                value={materialForm.openingStock}
                onChange={(e) => setMaterialForm({ ...materialForm, openingStock: Number(e.target.value) })}
              />
            )}
            <Input
              label="Min Stock Threshold"
              type="number"
              step="0.01"
              min={0}
              value={materialForm.minStockLevel}
              onChange={(e) => setMaterialForm({ ...materialForm, minStockLevel: Number(e.target.value) })}
            />
          </div>

          {!selectedMaterial && materialForm.openingStock > 0 && (
            <Input
              label="Initial Unit Cost (₹ per unit)"
              type="number"
              step="0.01"
              min={0}
              value={materialForm.initialUnitCost}
              onChange={(e) => setMaterialForm({ ...materialForm, initialUnitCost: Number(e.target.value) })}
            />
          )}

          <Textarea
            label="Material Description & Quality Specifications"
            rows={2}
            value={materialForm.description}
            onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
            placeholder="e.g. 60x60 combed cotton, 140 GSM, white & light shades"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setMaterialModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>
              {selectedMaterial ? 'Save Material' : 'Register Material'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Category */}
      <Modal
        isOpen={categoryModal}
        onClose={() => setCategoryModal(false)}
        title="Create Material Category"
        subtitle="Add custom category for fabrics, trims or accessories"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name"
            required
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="e.g. Embroideries, Elastic Ribs, Specialized Canvas"
          />
          <Textarea
            label="Description"
            rows={2}
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setCategoryModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Category</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reconcile / Stock Adjustment */}
      <Modal
        isOpen={adjustModal}
        onClose={() => setAdjustModal(false)}
        title={`Stock Adjustment: ${selectedMaterial?.name}`}
        subtitle="Adjust available quantity to match physical floor audit"
      >
        <form onSubmit={handleSaveAdjust} className="space-y-4">
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs">
            Current system stock: <strong>{selectedMaterial?.currentStock} {selectedMaterial?.unit}</strong>
          </div>
          <Input
            label="New Verified Stock"
            type="number"
            step="0.01"
            required
            value={adjustForm.adjustedStock}
            onChange={(e) => setAdjustForm({ ...adjustForm, adjustedStock: Number(e.target.value) })}
          />
          <Textarea
            label="Adjustment Reason"
            required
            rows={2}
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            placeholder="e.g. Physical inventory count variance, damp fabric discard"
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setAdjustModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Confirm Adjustment</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Material History / Audit */}
      <Modal
        isOpen={historyModal}
        onClose={() => setHistoryModal(false)}
        maxWidth="max-w-3xl"
        title={`Inventory Audit Trail: ${selectedMaterial?.name}`}
        subtitle="Recent purchases, consumptions, returns and adjustments"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded border border-gray-200 text-center font-bold">
            <div>Current Stock: {selectedMaterial?.currentStock} {selectedMaterial?.unit}</div>
            <div>Weighted Avg: {formatCurrency(selectedMaterial?.weightedAvgCost)}</div>
            <div>Valuation: {formatCurrency(selectedMaterial?.totalValuation)}</div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded">
            {selectedMaterial?.inventoryTransactions && selectedMaterial.inventoryTransactions.length > 0 ? (
              selectedMaterial.inventoryTransactions.map(tx => (
                <div key={tx.id} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <span className="font-bold text-gray-900">{tx.transactionType}</span>
                    <p className="text-[11px] text-gray-500">{tx.notes || 'Transaction'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${Number(tx.quantity) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {Number(tx.quantity) >= 0 ? `+${tx.quantity}` : tx.quantity} {selectedMaterial.unit}
                    </span>
                    <p className="text-[10px] text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-gray-400">No transactions recorded yet.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
