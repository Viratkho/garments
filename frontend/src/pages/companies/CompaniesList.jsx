import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/FormControls';
import { EmptyState, LoadingSpinner } from '../../components/common/EmptyState';
import { Building2, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';

export const CompaniesList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    notes: '',
  });

  const { success, error } = useNotification();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.getCompanies({ search });
      if (res.success) {
        setCompanies(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp) => {
    setEditingCompany(comp);
    setFormData({
      name: comp.name,
      code: comp.code,
      contactPerson: comp.contactPerson || '',
      phone: comp.phone || '',
      email: comp.email || '',
      address: comp.address || '',
      gstin: comp.gstin || '',
      notes: comp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCompany) {
        await api.updateCompany(editingCompany.id, formData);
        success('Company updated successfully');
      } else {
        await api.createCompany(formData);
        success('Company registered successfully');
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err) {
      error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to archive this company?')) {
      try {
        await api.deleteCompany(id);
        success('Company archived');
        fetchCompanies();
      } catch (err) {
        error(err.message || 'Failed to archive company');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Company Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage client companies, brands and institutional buyers.</p>
        </div>
        <Button onClick={handleOpenCreate} icon={Plus}>
          Register Company
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, code, contact or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>
        <span className="text-xs text-gray-400 font-medium">Total: {companies.length} Companies</span>
      </div>

      {/* Companies Table */}
      {loading ? (
        <LoadingSpinner text="Loading client companies..." />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Companies Found"
          description="Register your first corporate or retail client company to start booking bulk garment orders."
          action={<Button onClick={handleOpenCreate} icon={Plus}>Add First Company</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">{c.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      {c.address && (
                        <div className="text-[11px] text-gray-500 truncate max-w-xs flex items-center mt-0.5">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                          {c.address}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{c.contactPerson || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 space-y-0.5">
                      {c.phone && (
                        <div className="flex items-center text-[11px]">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {c.phone}
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center text-[11px]">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          {c.email}
                        </div>
                      )}
                      {!c.phone && !c.email && '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-600">{c.gstin || 'Unregistered'}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {c._count?.orders || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                        title="Edit company"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                        title="Archive company"
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

      {/* Modal for Create/Edit Company */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? `Edit Company: ${editingCompany.name}` : 'Register New Company'}
        subtitle="Save client company details for bulk order invoicing and tracking"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. ABC Textiles Ltd."
            />
            <Input
              label="Company Code (Optional, auto-generated if blank)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. ABC-TEX-001"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="e.g. Mr. Rajesh Kumar"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98111 22233"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. orders@abctextiles.in"
            />
            <Input
              label="GSTIN (Optional)"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              placeholder="e.g. 33AABCT1234F1Z5"
            />
          </div>

          <Textarea
            label="Physical Factory / Office Address"
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Plot or Street Address, City, State, PIN"
          />

          <Textarea
            label="Internal Notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Credit terms, special packaging instructions, preferred transporter, etc."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingCompany ? 'Save Changes' : 'Register Company'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
