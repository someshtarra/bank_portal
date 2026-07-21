import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import { Wallet, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';

export const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/accounts');
      if (res.data.success) setAccounts(res.data.accounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader label="Loading bank accounts..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bank Accounts</h1>
          <p className="text-xs text-slate-500">Manage your active savings and checking accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc) => (
          <div key={acc.account_id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {acc.account_type} ACCOUNT
                </span>
                <h3 className="text-xl font-mono font-bold text-slate-900 dark:text-white tracking-wider">{acc.account_number}</h3>
              </div>
              <Badge status={acc.status} />
            </div>

            <div>
              <p className="text-xs text-slate-500">Available Balance</p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                ₹ {parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h2>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Minimum Required Balance:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">₹ 1,000.00</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Withdrawable Balance:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹ {Math.max(0, parseFloat(acc.balance) - 1000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
