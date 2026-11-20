import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { ShieldAlert, Code2 } from 'lucide-react';

export const AdminAuditLogs = () => {
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: async () => {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=20`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  const columns = [
    {
      header: 'Timestamp',
      render: (l) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(l.createdAt).toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'medium',
          })}
        </span>
      ),
    },
    {
      header: 'Admin Actor',
      render: (l) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">
            {l.actor?.fullName || 'Super Admin'}
          </div>
          <div className="text-[10px] text-slate-400">{l.actor?.email || 'System Daemon'}</div>
        </div>
      ),
    },
    {
      header: 'Action Taken',
      render: (l) => (
        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          {l.action}
        </span>
      ),
    },
    {
      header: 'Target Entity',
      render: (l) => (
        <span className="text-xs font-medium text-slate-700">
          {l.entityType} {l.entityId && <span className="font-mono text-slate-400">({l.entityId})</span>}
        </span>
      ),
    },
    {
      header: 'IP Address',
      render: (l) => <span className="font-mono text-xs text-slate-400">{l.ipAddress || '127.0.0.1'}</span>,
    },
    {
      header: 'Payload',
      className: 'text-right',
      render: (l) => (
        <button
          onClick={() => setSelectedMeta(l.newState || l.previousState || { info: 'No delta captured' })}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          title="Inspect State Payload"
        >
          <Code2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically immutable activity logs recording every administrative state alteration.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={isLoading}
        searchPlaceholder="Filter audit events..."
        pagination={pagination}
        onPageChange={setPage}
      />

      {/* Metadata JSON Modal */}
      <Modal
        isOpen={Boolean(selectedMeta)}
        onClose={() => setSelectedMeta(null)}
        title="Audit State Payload (JSON)"
        maxWidth="max-w-xl"
      >
        {selectedMeta && (
          <div className="space-y-4">
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-96">
              {JSON.stringify(selectedMeta, null, 2)}
            </pre>
            <button
              onClick={() => setSelectedMeta(null)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
            >
              Close Viewer
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAuditLogs;
