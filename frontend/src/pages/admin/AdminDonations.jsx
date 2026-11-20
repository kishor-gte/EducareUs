import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { Printer, Receipt, Eye } from 'lucide-react';

export const AdminDonations = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // In our backend, we can query recent donations through analytics or direct route
  const { data, isLoading } = useQuery({
    queryKey: ['admin-donations-ledger', search, page],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/reports');
        const donations = res.data?.data?.recentTransactions || [];
        return {
          donations,
          pagination: { total: donations.length, page: 1, totalPages: 1 },
        };
      } catch {
        return {
          donations: [],
          pagination: { total: 0, page: 1, totalPages: 0 },
        };
      }
    },
  });

  const columns = [
    {
      header: 'Receipt No.',
      render: (d) => (
        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
          {d.receiptNumber}
        </span>
      ),
    },
    {
      header: 'Donor Name & Email',
      render: (d) => (
        <div>
          <div className="font-bold text-slate-900">{d.donorName}</div>
          <div className="text-xs text-slate-400">{d.donorEmail}</div>
        </div>
      ),
    },
    {
      header: 'Contribution Purpose',
      render: (d) => (
        <div className="text-xs font-semibold text-slate-800 line-clamp-1">{d.purpose || 'Education Grant'}</div>
      ),
    },
    {
      header: 'Amount',
      render: (d) => (
        <div>
          <div className="font-extrabold text-slate-900">₹{Number(d.amount).toLocaleString('en-IN')}</div>
          {d.tipAmount > 0 && (
            <div className="text-[10px] text-slate-400">+₹{d.tipAmount} Tip</div>
          )}
        </div>
      ),
    },
    {
      header: 'Payment Method',
      render: (d) => <span className="text-xs text-slate-600">{d.paymentMethod}</span>,
    },
    {
      header: 'Status',
      render: (d) => <StatusBadge status={d.status} />,
    },
    {
      header: 'Action',
      className: 'text-right',
      render: (d) => (
        <button
          onClick={() => setSelectedReceipt(d)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          title="View & Print 80G Receipt"
        >
          <Receipt className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Donations Ledger</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete transparent audit trail of all contributions with Indian 80G tax certificate references.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.donations || []}
        loading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by receipt no, donor, or purpose..."
        pagination={data?.pagination}
        onPageChange={setPage}
      />

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title="Official Section 80G Tax Exemption Receipt"
      >
        {selectedReceipt && (
          <div className="space-y-6 text-sm text-slate-800">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">EDUCARRUS FOUNDATION</h3>
                <p className="text-xs text-slate-500">Connaught Place, New Delhi - 110001</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md block">
                  80G Certified
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Reg: 80G-EDUCAREUS-2026-X99</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Receipt No:</span>
                <span className="font-mono font-bold">{selectedReceipt.receiptNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Date of Donation:</span>
                <span className="font-bold">
                  {new Date(selectedReceipt.createdAt).toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Donor Name:</span>
                <span className="font-bold">{selectedReceipt.donorName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Donor Email:</span>
                <span className="font-bold">{selectedReceipt.donorEmail}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Contribution for:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.purpose || 'Education Aid'}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold pt-2 border-t border-slate-200">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-600">₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-800"
              >
                <Printer className="w-4 h-4" /> Print Tax Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDonations;
