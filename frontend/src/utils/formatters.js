/**
 * Format currency amount in Indian Rupee format (INR)
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

/**
 * Format number with Indian numbering system
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(Number(num));
};

/**
 * Format Date to readable format (e.g. 15 Oct 2026)
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Format Date & Time
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Map status to badge color classes
 */
export const getStatusBadgeStyle = (status) => {
  switch (String(status || '').toUpperCase()) {
    case 'COMPLETED':
    case 'DELIVERED':
    case 'PAID':
    case 'PASSED':
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'IN_PROGRESS':
    case 'PARTIAL':
    case 'IN_TRANSIT':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'PENDING':
    case 'DRAFT':
    case 'NOT_STARTED':
    case 'SCHEDULED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CANCELLED':
    case 'FAILED':
    case 'REJECTED':
    case 'INACTIVE':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'REWORK_REQUIRED':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};
