import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/EmptyState';
import { CalendarCheck, Save, Calendar, Check, X, Clock } from 'lucide-react';

export const AttendanceView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workers, setWorkers] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState({});
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { success, error } = useNotification();

  const loadData = async () => {
    try {
      setLoading(true);
      const [workerRes, attRes, sumRes] = await Promise.all([
        api.getWorkers({ status: 'ACTIVE' }),
        api.getAttendance({ date: selectedDate }),
        api.getAttendanceSummary(),
      ]);

      if (workerRes.success) setWorkers(workerRes.data);
      if (sumRes.success) setSummary(sumRes.data);

      // Map today's attendance records
      const attMap = {};
      if (attRes.success && attRes.data) {
        attRes.data.forEach(a => {
          attMap[a.workerId] = {
            status: a.status,
            workHours: Number(a.workHours),
            overtimeHours: Number(a.overtimeHours),
            notes: a.notes || '',
          };
        });
      }

      // Initialize default for workers without records today
      if (workerRes.success) {
        workerRes.data.forEach(w => {
          if (!attMap[w.id]) {
            attMap[w.id] = {
              status: 'PRESENT',
              workHours: 8,
              overtimeHours: 0,
              notes: '',
            };
          }
        });
      }

      setDailyAttendance(attMap);
    } catch (err) {
      error(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleFieldChange = (workerId, field, value) => {
    setDailyAttendance(prev => {
      const current = prev[workerId] || { status: 'PRESENT', workHours: 8, overtimeHours: 0, notes: '' };
      let newHours = current.workHours;

      if (field === 'status') {
        if (value === 'PRESENT') newHours = 8;
        else if (value === 'HALF_DAY') newHours = 4;
        else newHours = 0;
      }

      return {
        ...prev,
        [workerId]: {
          ...current,
          [field]: value,
          ...(field === 'status' ? { workHours: newHours } : {}),
        },
      };
    });
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(dailyAttendance).map(([workerId, data]) => {
        return api.recordAttendance({
          workerId: Number(workerId),
          date: selectedDate,
          status: data.status,
          workHours: Number(data.workHours),
          overtimeHours: Number(data.overtimeHours),
          notes: data.notes,
        });
      });

      await Promise.all(promises);
      success(`Attendance saved for ${formatDate(selectedDate)}`);
      loadData();
    } catch (err) {
      error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Daily Attendance & Work Hours</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Record regular daily shift hours and overtime for monthly salary calculation and factory labour allocation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-300 shadow-xs text-xs">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-gray-800 bg-transparent focus:outline-none"
            />
          </div>
          <Button onClick={handleSaveAttendance} loading={saving} icon={Save}>
            Save Day Attendance
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading attendance data..." />
      ) : (
        <div className="space-y-6">
          {/* Daily Attendance Sheet */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center">
                <CalendarCheck className="w-4 h-4 mr-2 text-blue-600" />
                Attendance Sheet: {formatDate(selectedDate)}
              </h3>
              <span className="text-xs text-gray-400">{workers.length} Active Staff</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Worker</th>
                    <th className="py-3 px-4">Salary Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 w-32">Regular Hours</th>
                    <th className="py-3 px-4 w-32">Overtime (hrs)</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workers.map((w) => {
                    const row = dailyAttendance[w.id] || { status: 'PRESENT', workHours: 8, overtimeHours: 0, notes: '' };

                    return (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{w.name}</div>
                          <div className="text-[11px] text-gray-400">₹{w.computedHourlyRate}/hr rate</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">{w.salaryType}</td>
                        <td className="py-3 px-4">
                          <select
                            value={row.status}
                            onChange={(e) => handleFieldChange(w.id, 'status', e.target.value)}
                            className="text-xs font-semibold px-2.5 py-1 rounded border border-gray-300 bg-white focus:border-blue-500"
                          >
                            <option value="PRESENT">Present (Full Day)</option>
                            <option value="HALF_DAY">Half Day</option>
                            <option value="ABSENT">Absent</option>
                            <option value="LEAVE">Authorized Leave</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            max={24}
                            value={row.workHours}
                            onChange={(e) => handleFieldChange(w.id, 'workHours', Number(e.target.value))}
                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            max={24}
                            value={row.overtimeHours}
                            onChange={(e) => handleFieldChange(w.id, 'overtimeHours', Number(e.target.value))}
                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Optional shift notes..."
                            value={row.notes}
                            onChange={(e) => handleFieldChange(w.id, 'notes', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Staff Summary */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Current Month Staff Productivity Summary</h3>
              <p className="text-xs text-gray-500">Aggregated attendance days and logged hours for active month.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Worker</th>
                    <th className="py-3 px-4 text-center">Present Days</th>
                    <th className="py-3 px-4 text-center">Half Days</th>
                    <th className="py-3 px-4 text-center">Absent Days</th>
                    <th className="py-3 px-4 text-right">Total Regular Hours</th>
                    <th className="py-3 px-4 text-right">Total Overtime Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.map((s) => (
                    <tr key={s.workerId} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{s.workerName}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{s.presentDays} days</td>
                      <td className="py-3 px-4 text-center text-amber-600">{s.halfDays}</td>
                      <td className="py-3 px-4 text-center text-rose-600">{s.absentDays}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-800">{s.totalHours} hrs</td>
                      <td className="py-3 px-4 text-right text-blue-600 font-bold">{s.totalOvertime} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
