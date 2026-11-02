import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Badge } from '../../components/common/Badge';
import { EmptyState, LoadingSpinner } from '../../components/common/EmptyState';
import { Users, Plus, Search, Edit2, Trash2, Phone, Calendar, Clock, DollarSign } from 'lucide-react';

export const WorkersList = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salaryType: 'MONTHLY',
    agreedSalary: 12000,
    productiveHoursPerMonth: 200,
    status: 'ACTIVE',
    notes: '',
  });

  const { success, error } = useNotification();

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await api.getWorkers({ search });
      if (res.success) {
        setWorkers(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorkers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingWorker(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      joiningDate: new Date().toISOString().split('T')[0],
      salaryType: 'MONTHLY',
      agreedSalary: 12000,
      productiveHoursPerMonth: 200,
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWorker(w);
    setFormData({
      name: w.name,
      phone: w.phone || '',
      address: w.address || '',
      joiningDate: w.joiningDate ? new Date(w.joiningDate).toISOString().split('T')[0] : '',
      salaryType: w.salaryType,
      agreedSalary: Number(w.agreedSalary),
      productiveHoursPerMonth: w.productiveHoursPerMonth || 200,
      status: w.status,
      notes: w.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingWorker) {
        await api.updateWorker(editingWorker.id, formData);
        success('Worker profile updated');
      } else {
        await api.createWorker(formData);
        success('Worker registered successfully');
      }
      setIsModalOpen(false);
      fetchWorkers();
    } catch (err) {
      error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Archive this worker profile?')) {
      try {
        await api.deleteWorker(id);
        success('Worker profile archived');
        fetchWorkers();
      } catch (err) {
        error(err.message || 'Failed to archive worker');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Worker & Factory Staff Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Register tailors, cutting masters, ironers and configure their salary terms and productive rates.
          </p>
        </div>
        <Button onClick={handleOpenCreate} icon={Plus}>
          Register Worker
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workers by name or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>
        <span className="text-xs text-gray-400 font-medium">Active Staff: {workers.filter(w => w.status === 'ACTIVE').length} Workers</span>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading factory staff..." />
      ) : workers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Workers Registered"
          description="Register tailors, pattern masters, and stitchers to record daily attendance, disburse monthly salaries, and allocate labour costs."
          action={<Button onClick={handleOpenCreate} icon={Plus}>Add First Worker</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-lg border border-gray-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge status={w.status} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {w.salaryType}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900">{w.name}</h3>

                {w.phone && (
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {w.phone}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Agreed Salary:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(w.agreedSalary)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Productive Hours:</span>
                    <span className="text-gray-700">{w.productiveHoursPerMonth || 200} hrs/mo</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50/60 rounded border border-blue-100">
                    <span className="font-semibold text-blue-900">Derived Hourly Rate:</span>
                    <span className="font-bold text-sm text-[#2563EB]">
                      ₹{w.computedHourlyRate}/hr
                    </span>
                  </div>
                </div>

                {w.notes && (
                  <p className="mt-3 text-[11px] text-gray-400 italic line-clamp-2">
                    "{w.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Joined: {formatDate(w.joiningDate)}
                </span>
                <div className="space-x-1">
                  <button
                    onClick={() => handleOpenEdit(w)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50"
                    title="Edit profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="p-1.5 text-gray-500 hover:text-rose-600 rounded hover:bg-rose-50"
                    title="Archive worker"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add/Edit Worker */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWorker ? `Edit Worker: ${editingWorker.name}` : 'Register Factory Worker'}
        subtitle="Specify salary structure, monthly base, and productive hours for job costing"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Worker Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ramesh Tailor, Suresh Master"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98222 33445"
            />
            <Input
              label="Joining Date"
              type="date"
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Salary Type"
              required
              value={formData.salaryType}
              onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
              options={[
                { value: 'MONTHLY', label: 'Monthly Salary' },
                { value: 'DAILY', label: 'Daily Wages' },
                { value: 'PER_PIECE', label: 'Per-Piece Rate' },
                { value: 'MONTHLY_WITH_ADDITIONS', label: 'Monthly + Overtime/Additions' },
              ]}
            />
            <Input
              label="Agreed Base Salary (₹)"
              type="number"
              required
              min={0}
              value={formData.agreedSalary}
              onChange={(e) => setFormData({ ...formData, agreedSalary: Number(e.target.value) })}
            />
            <Input
              label="Productive Monthly Hours"
              type="number"
              min={1}
              value={formData.productiveHoursPerMonth}
              onChange={(e) => setFormData({ ...formData, productiveHoursPerMonth: Number(e.target.value) })}
              helperText="Default: 200 hours/month"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded border border-blue-100 flex items-center justify-between text-xs font-semibold text-blue-900">
            <span>Derived Hourly Rate for Order Labour Costing:</span>
            <span className="text-base text-blue-700">
              ₹{formData.productiveHoursPerMonth > 0 ? (formData.agreedSalary / formData.productiveHoursPerMonth).toFixed(2) : 0}/hr
            </span>
          </div>

          <Textarea
            label="Residential Address"
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Textarea
            label="Specialization / Notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Master collar stitcher, 10 years experience in woven shirts"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>
              {editingWorker ? 'Save Changes' : 'Register Worker'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
