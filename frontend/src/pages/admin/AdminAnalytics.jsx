import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Download, TrendingUp, HandCoins, Award, Target, Trophy } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminAnalytics = () => {
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports-data'],
    queryFn: async () => {
      const res = await api.get('/admin/reports');
      return res.data?.data;
    },
  });

  const { data: topDonors, isLoading: donorsLoading } = useQuery({
    queryKey: ['admin-top-donors'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/top-donors');
      return res.data?.data || [];
    },
  });

  const summary = reportsData?.summary;
  const categories = reportsData?.categoryBreakdown || [];

  const COLORS = ['#0A192F', '#D4AF37', '#059669', '#3B82F6', '#8B5CF6', '#F97316'];

  // One-click CSV Export
  const handleExportCSV = () => {
    if (!categories.length) return;
    const headers = ['Category,StudentCount,TargetAmount,RaisedAmount,ProgressPercent\n'];
    const rows = categories.map(
      (c) => `${c.category},${c.count},${c.target},${c.raised},${c.progressPercent}%\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Educarrus_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (reportsLoading || donorsLoading) {
    return <LoadingSpinner text="Generating analytics insights..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Financial & Education Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated institutional reports, category performance, and top contributions.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-amber-400 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Funds Raised"
          value={`₹${Number(summary?.totalRaised || 0).toLocaleString('en-IN')}`}
          change="+21.4%"
          trend="up"
          icon={HandCoins}
        />
        <StatCard
          title="Average Contribution"
          value={`₹${Number(summary?.averageDonation || 0).toLocaleString('en-IN')}`}
          change="Consistent"
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Aid Fulfillment Rate"
          value={summary?.successRate || '98.5%'}
          change="+4.2%"
          trend="up"
          icon={Target}
        />
        <StatCard
          title="Total Transactions"
          value={summary?.totalDonations || 0}
          change="+18.7%"
          trend="up"
          icon={Award}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Funding by Academic Stream</h3>
              <p className="text-xs text-slate-400">Total target vs amount raised per category (INR)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#fff',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="raised" fill="#D4AF37" radius={[6, 6, 0, 0]} name="Raised Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Contributors Ranking Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Top Contributors Leaderboard</h3>
            </div>
            <span className="text-xs text-slate-400">Contributor Rank</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topDonors.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-extrabold flex items-center justify-center text-xs">
                    {item.rank}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{item.user?.fullName}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.donationsCount} contributions • {item.user?.location || 'India'}
                    </div>
                  </div>
                </div>

                <span className="font-extrabold text-slate-900">
                  ₹{Number(item.totalDonated).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
