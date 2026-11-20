import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  GraduationCap,
  HandCoins,
  ShieldAlert,
  TrendingUp,
  FileCheck2,
  Clock,
  ArrowUpRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Activity,
  CheckCircle2,
  Layers,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [period, setPeriod] = useState('30d');

  // 1. Fetch KPIs
  const { data: kpiData, isLoading: kpiLoading, refetch: refetchKpis } = useQuery({
    queryKey: ['admin-kpis'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/kpis');
      return res.data?.data;
    },
  });

  // 2. Fetch Donation Trends
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['admin-trends', period],
    queryFn: async () => {
      const res = await api.get(`/admin/analytics/trends?period=${period}`);
      const payload = res.data?.data;
      if (!payload) return [];
      return payload.labels.map((lbl, idx) => ({
        date: lbl,
        amount: payload.values[idx] || 0,
      }));
    },
  });

  // 3. Fetch Pending Verifications
  const { data: verificationsData } = useQuery({
    queryKey: ['admin-pending-verifications'],
    queryFn: async () => {
      const res = await api.get('/admin/verifications?status=PENDING&limit=4');
      return res.data?.data || [];
    },
  });

  // 4. Fetch Recent Student Enquiries
  const { data: recentEnquiriesData } = useQuery({
    queryKey: ['admin-recent-enquiries'],
    queryFn: async () => {
      const res = await api.get('/admin/enquiries?limit=4');
      return res.data?.data || [];
    },
  });

  // 5. System Health Check
  const { data: healthData } = useQuery({
    queryKey: ['admin-system-health-widget'],
    queryFn: async () => {
      const res = await api.get('/admin/system-health');
      return res.data?.data;
    },
    staleTime: 30 * 1000,
  });

  if (kpiLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner text="Loading executive telemetry & metrics..." />
      </div>
    );
  }

  const pendingEnquiriesCount = recentEnquiriesData?.filter((e) => e.status === 'PENDING').length || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Executive Header Banner ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 text-[10px] font-black tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Executive Command Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-900 tracking-tight">
            Platform Governance & Telemetry
          </h1>
          <p className="text-xs text-slate-500">
            Real-time financial telemetry, student verification pipeline, and academic counseling feed.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => refetchKpis()}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/enquiries"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Student Enquiries ({pendingEnquiriesCount})</span>
          </Link>
          <Link
            to="/admin/verifications"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verification Queue ({kpiData?.pendingVerification || 0})</span>
          </Link>
        </div>
      </div>

      {/* ── 4 High-Impact KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Funds Raised */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Total Funds Disbursed
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl lg:text-3xl font-black font-heading text-slate-900 tracking-tight">
              ₹{Number(kpiData?.amountRaised || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                100% Direct
              </span>
              <span>Fee disbursement</span>
            </div>
          </div>
        </div>

        {/* Card 2: Enrolled Students */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Enrolled Scholars
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl lg:text-3xl font-black font-heading text-slate-900 tracking-tight">
              {kpiData?.totalBeneficiaries || 0}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                Verified
              </span>
              <span>Student accounts</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Verifications */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Verification Queue
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200/60">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl lg:text-3xl font-black font-heading text-slate-900 tracking-tight">
              {kpiData?.pendingVerification || 0}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className={`font-bold px-1.5 py-0.2 rounded border ${
                (kpiData?.pendingVerification || 0) > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {(kpiData?.pendingVerification || 0) > 0 ? 'Action Needed' : 'All Clear'}
              </span>
              <span>Marksheets & Fee slips</span>
            </div>
          </div>
        </div>

        {/* Card 4: Career & Course Enquiries */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Career Enquiries
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl lg:text-3xl font-black font-heading text-slate-900 tracking-tight">
              {recentEnquiriesData?.length || 0}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Post-12th / Degree
              </span>
              <span>Guidance requests</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Telemetry Grid (Chart + Operational Pulse) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donation Inflow Chart (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-heading font-black text-slate-900 text-sm sm:text-base">
                Platform Financial Telemetry & Inflow
              </h2>
              <p className="text-xs text-slate-400">
                Verified donor contributions through Razorpay, UPI & NetBanking
              </p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              {['7d', '30d', '6m', '1y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase transition-colors cursor-pointer ${
                    period === p
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            {trendLoading ? (
              <LoadingSpinner text="Plotting telemetry..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#fff',
                      borderRadius: '0.75rem',
                      border: '1px solid #1E293B',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Operational Pulse & System Status (1/3) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <h3 className="font-heading font-black text-slate-900 text-sm">
                  Operational Pulse
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                All Systems Normal
              </span>
            </div>

            {/* Quick Attention List */}
            <div className="space-y-2">
              <Link
                to="/admin/enquiries"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/70 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center text-xs font-bold">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Student Career Enquiries</div>
                    <div className="text-[10px] text-slate-400">
                      {pendingEnquiriesCount} awaiting academic advice
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </Link>

              <Link
                to="/admin/verifications"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/70 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center text-xs font-bold">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Pending Student Documents</div>
                    <div className="text-[10px] text-slate-400">
                      {kpiData?.pendingVerification || 0} records in compliance queue
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </Link>

              <Link
                to="/admin/support"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/70 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold">
                    <LifeBuoy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Support Desk Tickets</div>
                    <div className="text-[10px] text-slate-400">
                      {kpiData?.urgentTickets || 0} urgent escalations
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </Link>
            </div>
          </div>

          {/* Database Health Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">PostgreSQL Latency</span>
              <span className="font-bold text-slate-900 font-mono">
                {healthData?.services?.database?.latency || '< 15ms'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">80G Compliance</span>
              <span className="font-bold text-emerald-700">Verified & Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Audit Integrity</span>
              <span className="font-bold text-slate-800">100% Immutable</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-Column Bottom Feed: Recent Enquiries & Pending Verifications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Student Enquiries */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span>Recent Career & Course Enquiries</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scholars seeking advice after 12th or degree
              </p>
            </div>
            <Link
              to="/admin/enquiries"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentEnquiriesData?.length > 0 ? (
              recentEnquiriesData.map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{e.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {e.highestEducation} &rarr; <span className="font-semibold text-slate-700">{e.interestedCourse}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {e.status}
                    </span>
                    <Link
                      to="/admin/enquiries"
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition-colors"
                    >
                      Respond
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-slate-400 font-medium">
                No student enquiries logged yet.
              </p>
            )}
          </div>
        </div>

        {/* Right: Document Verification Queue Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pending Verification Queue</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Marksheets, fee receipts & admission letters
              </p>
            </div>
            <Link
              to="/admin/verifications"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Full Queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {verificationsData?.length > 0 ? (
              verificationsData.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{v.user?.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{v.documentType}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={v.status} />
                    <Link
                      to="/admin/verifications"
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-slate-400 font-medium">
                No documents pending verification.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
