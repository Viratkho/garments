import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Badge } from '../../components/common/Badge';
import { EmptyState, LoadingSpinner } from '../../components/common/EmptyState';
import { Wallet, Plus, Calendar, DollarSign, CheckCircle2, History } from 'lucide-react';

export const SalaryView = () => {
  const currentMonthYear = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);
  const [salaries, setSalaries] = useState([]);
  const [salarySummary, setSalarySummary] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalaryRecord, setSelectedSalaryRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    workerId: '',
    salaryRecordId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    referenceNo: '',
    notes: '',
  });

  const { success, error } = useNotification();

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const res = await api.getSalaries({ monthYear: selectedMonth });
      if (res.success) {
        setSalaries(res.data);
        if (res.summary) {
          setSalarySummary(res.summary);
        }
      }
    } catch (err) {
      error(err.message || 'Failed to fetch salary records');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    try {
      const res = await api.getWorkers({ status: 'ACTIVE' });
      if (res.success) setWorkers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [selectedMonth]);

  const handleGenerateMonth = async () => {
    try {
      setLoading(true);
      const res = await api.generateSalaries({ monthYear: selectedMonth });
      success(res.message || 'Monthly salary sheets generated');
      fetchSalaries();
    } catch (err) {
      error(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (record) => {
    setSelectedSalaryRecord(record);
    setPaymentForm({
      workerId: String(record.workerId),
      salaryRecordId: String(record.id),
      amount: Number(record.pendingBalance) > 0 ? Number(record.pendingBalance) : Number(record.salaryDue),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      referenceNo: '',
      notes: `Salary disbursement for ${selectedMonth}`,
    });
    setIsModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.recordSalaryPayment(paymentForm);
      success('Salary payment recorded and reflected in general business expenses!');
      setIsModalOpen(false);
      fetchSalaries();
    } catch (err) {
      error(err.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalDue = salaries.reduce((sum, s) => sum + Number(s.salaryDue), 0);
  const totalPaid = salaries.reduce((sum, s) => sum + Number(s.salaryPaid), 0);
  const totalPending = salaries.reduce((sum, s) => sum + Number(s.pendingBalance), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Worker Salary Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Disburse monthly wages, handle advances, and record business salary expenses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-300 shadow-xs text-xs">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-gray-800 bg-transparent focus:outline-none"
            />
          </div>
          <Button onClick={handleGenerateMonth} icon={Plus}>
            Generate Monthly Sheet
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payroll Due</span>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(totalDue)}</p>
          <span className="text-[11px] text-gray-400">{salaries.length} staff records</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Disbursed Wages</span>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatCurrency(totalPaid)}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Recorded in expenses</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Balance</span>
          <p className="text-lg font-bold text-rose-600 mt-0.5">{formatCurrency(totalPending)}</p>
          <span className="text-[11px] text-gray-400">Due to be cleared</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Allocated to Orders</span>
          <p className="text-lg font-bold text-blue-600 mt-0.5">
            {formatCurrency(salarySummary?.totalAllocatedLabour || 0)}
          </p>
          <span className="text-[11px] text-blue-600 font-medium">
            {salarySummary?.labourRecoveryRate || 0}% absorbed
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 shadow-xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Unallocated Labour</span>
          <p className="text-lg font-bold text-amber-900 mt-0.5">
            {formatCurrency(salarySummary?.unallocatedLabourCost || Math.max(0, totalDue - (salarySummary?.totalAllocatedLabour || 0)))}
          </p>
          <span className="text-[11px] text-amber-700">General shop overhead</span>
        </div>
      </div>

      {/* Critical accounting note banner */}
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
        <strong>Accounting Rule:</strong> Actual salary payments are recorded once as general business expenses.
        Labour costs allocated inside individual order sheets distribute this wage expense across manufacturing jobs without double-counting.
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading salary sheets..." />
      ) : salaries.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={`No Salary Records for ${selectedMonth}`}
          description="Click 'Generate Monthly Sheet' to generate salary entries for all active workers."
          action={<Button onClick={handleGenerateMonth} icon={Plus}>Generate Sheet for {selectedMonth}</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-4">Salary Type</th>
                  <th className="py-3 px-4 text-right">Base Due</th>
                  <th className="py-3 px-4 text-right">Overtime</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Pending Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{s.worker?.name}</td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{s.worker?.salaryType}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-800">{formatCurrency(s.salaryDue)}</td>
                    <td className="py-3 px-4 text-right text-blue-600 font-medium">+{formatCurrency(s.overtimePay)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(s.salaryPaid)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">{formatCurrency(s.pendingBalance)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={s.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {Number(s.pendingBalance) > 0 ? (
                        <Button size="sm" onClick={() => handleOpenPayment(s)}>
                          Pay Wage
                        </Button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs flex items-center justify-end">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Pay Wage */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Disburse Salary: ${selectedSalaryRecord?.worker?.name}`}
        subtitle={`Record wage payment for ${selectedMonth} (Pending: ${formatCurrency(selectedSalaryRecord?.pendingBalance)})`}
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
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
              label="Payment Method"
              required
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'UPI', label: 'UPI / PhonePe / GPay' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'CHEQUE', label: 'Cheque' },
              ]}
            />
            <Input
              label="Reference / Cheque Number"
              value={paymentForm.referenceNo}
              onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
              placeholder="e.g. UPI-TRANS-9901"
            />
          </div>

          <Textarea
            label="Payment Notes"
            rows={2}
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            placeholder="e.g. Salary cleared for monthly production work"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Confirm Salary Disbursement</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
