import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Loader } from '../../components/common/Loader';
import { FinancialChart } from '../../components/charts/FinancialChart';
import { Users, Wallet, Landmark, Activity, ShieldAlert, BadgePercent } from 'lucide-react';

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader label="Generating executive analytics dashboard..." />;

  const chartData = {
    labels: analytics?.chartData?.map(c => c.month) || ['Jul 2026'],
    datasets: [
      {
        label: 'Monthly Deposits (₹)',
        data: analytics?.chartData?.map(c => parseFloat(c.total_deposits || 0)) || [190000],
        backgroundColor: '#38bdf8'
      },
      {
        label: 'Monthly Withdrawals (₹)',
        data: analytics?.chartData?.map(c => parseFloat(c.total_withdrawals || 0)) || [15000],
        backgroundColor: '#f43f5e'
      }
    ]
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">System Analytics & Executive Overview</h1>
        <p className="text-xs text-slate-500">Real-time metrics on customer growth, liquid assets, and system audit logs</p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={analytics?.totalCustomers?.toString() || '0'}
          subtitle="Registered Banking Users"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Accounts"
          value={analytics?.totalAccounts?.toString() || '0'}
          subtitle="Active Savings & Checking"
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="Total Bank Holdings"
          value={`₹ ${(analytics?.totalBalance || 0).toLocaleString('en-IN')}`}
          subtitle="Customer Deposit Reserves"
          icon={Landmark}
          color="purple"
        />
        <StatCard
          title="Daily Transactions"
          value={analytics?.dailyTransactionsCount?.toString() || '0'}
          subtitle={`Volume: ₹${(analytics?.dailyTransactionsVolume || 0).toLocaleString()}`}
          icon={Activity}
          color="amber"
        />
      </div>

      {/* Chart & Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bank-wide Cash Flow Analytics</h3>
          <FinancialChart type="bar" data={chartData} />
        </div>

        {/* Audit Log Feed */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audit Feed</h3>
          </div>

          <div className="space-y-3">
            {analytics?.recentAudits?.map((log) => (
              <div key={log.log_id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>{log.action}</span>
                  <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-500 text-[11px] truncate">{log.details}</p>
                <p className="text-[10px] text-slate-400">IP: {log.ip_address} | User: {log.email || 'System'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
