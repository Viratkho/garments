import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/FormControls';
import { EmptyState, LoadingSpinner } from '../../components/common/EmptyState';
import { Truck, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';

export const SuppliersList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    notes: '',
  });

  const { success, error } = useNotification();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.getSuppliers({ search });
      if (res.success) {
        setSuppliers(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      gstin: sup.gstin || '',
      notes: sup.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, formData);
        success('Supplier updated successfully');
      } else {
        await api.createSupplier(formData);
        success('Supplier registered successfully');
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Archive this supplier?')) {
      try {
        await api.deleteSupplier(id);
        success('Supplier archived');
        fetchSuppliers();
      } catch (err) {
        error(err.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Supplier Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage fabric mills, yarn suppliers, button vendors and packaging distributors.</p>
        </div>
        <Button onClick={handleOpenCreate} icon={Plus}>
          Register Supplier
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by supplier name, contact person or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>
        <span className="text-xs text-gray-400 font-medium">Total: {suppliers.length} Suppliers</span>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading raw material suppliers..." />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Suppliers Found"
          description="Register raw material suppliers to record purchases and invoices."
          action={<Button onClick={handleOpenCreate} icon={Plus}>Add First Supplier</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Phone / Email</th>
                  <th className="py-3 px-4">Location / Address</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-center">Purchases</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">{s.name}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{s.contactPerson || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 space-y-0.5">
                      {s.phone && (
                        <div className="flex items-center text-[11px]">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center text-[11px]">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          {s.email}
                        </div>
                      )}
                      {!s.phone && !s.email && '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{s.address || '—'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-600">{s.gstin || 'Unregistered'}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {s._count?.purchases || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50"
                        title="Edit supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-red-50"
                        title="Archive supplier"
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

      {/* Modal: Add/Edit Supplier */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register Raw Material Supplier'}
        subtitle="Manage textile mills, button suppliers and accessory vendors"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Supplier / Mill Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Metro Fabric Mills, Vardhman Threads"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="e.g. Sanjay Sharma"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 94444 55566"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. sales@metrotextiles.com"
            />
            <Input
              label="GSTIN (Optional)"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              placeholder="e.g. 24AABCS1234F1Z9"
            />
          </div>

          <Textarea
            label="Address"
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Mill address or warehouse hub location"
          />

          <Textarea
            label="Notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Payment terms, credit period, minimum order quantity"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>
              {editingSupplier ? 'Save Changes' : 'Register Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
