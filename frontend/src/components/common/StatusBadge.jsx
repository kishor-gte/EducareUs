import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const statusNormalized = String(status).toUpperCase();

  const config = {
    // Green / Success
    ACTIVE: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
    VERIFIED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Verified' },
    SUCCESS: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Success' },
    COMPLETED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Completed' },
    RESOLVED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Resolved' },
    APPROVED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' },

    // Amber / Pending / Review
    PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
    PENDING_VERIFICATION: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Verification' },
    UNDER_REVIEW: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Under Review' },
    DRAFT: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Draft' },
    OPEN: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Open' },

    // Blue / In Progress
    IN_PROGRESS: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'In Progress' },
    PROCESSING: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Processing' },

    // Red / Danger / Rejected
    REJECTED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Rejected' },
    FAILED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Failed' },
    SUSPENDED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Suspended' },
    BLOCKED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Blocked' },
    CLOSED: { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Closed' },
  };

  const current = config[statusNormalized] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      {current.label}
    </span>
  );
};

export default StatusBadge;
