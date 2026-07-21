import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import { UserCheck, BadgePercent, Users, ArrowRight } from 'lucide-react';

export const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employee/dashboard');
      if (res.data.success) setData(res.data.dashboard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader label="Loading bank officer dashboard..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Employee Officer Workbench</h1>
        <p className="text-xs text-slate-500">Perform customer KYC verifications, account reviews, and loan approvals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Pending KYC Verifications"
          value={data?.pendingKyc?.toString() || '0'}
          subtitle="Customers awaiting ID document verification"
          icon={UserCheck}
          color="amber"
        />
        <StatCard
          title="Pending Loan Applications"
          value={data?.pendingLoans?.toString() || '0'}
          subtitle="Credit risk review queue"
          icon={BadgePercent}
          color="purple"
        />
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Customer Onboardings</h3>
          <Link to="/employee/kyc" className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1">
            <span>Process KYC Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {data?.recentCustomers?.map((c) => (
            <div key={c.customer_id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{c.first_name} {c.last_name}</p>
                <p className="text-[10px] text-slate-400">{c.email}</p>
              </div>
              <Badge status={c.kyc_status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
