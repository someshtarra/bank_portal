import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { FinancialChart } from '../../components/charts/FinancialChart';
import { Wallet, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, CreditCard, History, PlusCircle } from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [accRes, txnRes, cardRes] = await Promise.all([
        api.get('/customer/accounts'),
        api.get('/customer/transactions?limit=5'),
        api.get('/cards/my-cards')
      ]);

      if (accRes.data.success) setAccounts(accRes.data.accounts || []);
      if (txnRes.data.success) setTransactions(txnRes.data.transactions || []);
      if (cardRes.data.success) setCards(cardRes.data.cards || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Monthly Deposits (₹)',
        data: [25000, 40000, 35000, 50000, 45000, 60000, 75000],
        backgroundColor: '#38bdf8'
      },
      {
        label: 'Monthly Withdrawals (₹)',
        data: [12000, 18000, 15000, 22000, 19000, 25000, 30000],
        backgroundColor: '#f43f5e'
      }
    ]
  };

  if (loading) return <Loader label="Loading customer portfolio..." />;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-navy-900 to-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-300 font-bold">Customer Portal</span>
          <h1 className="text-3xl font-extrabold mt-1">Welcome back, {user?.first_name}!</h1>
          <p className="text-sm text-slate-300 mt-1">Account Status: Active & Secured with 256-bit Encryption</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/deposit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Deposit</span>
          </Link>
          <Link
            to="/withdraw"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2 transition-all"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Withdraw</span>
          </Link>
          <Link
            to="/transfer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer Money</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Net Balance"
          value={`₹ ${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${accounts.length} Active Bank Account(s)`}
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Active Cards"
          value={cards.length.toString()}
          subtitle="Visa Debit & Credit Cards"
          icon={CreditCard}
          color="emerald"
        />
        <StatCard
          title="Recent Transactions"
          value={transactions.length.toString()}
          subtitle="Processed this month"
          icon={History}
          color="amber"
        />
      </div>

      {/* Primary Accounts Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Bank Accounts</h3>
          <Link to="/accounts" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View All</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => (
            <div key={acc.account_id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{acc.account_type} Account</span>
                  <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{acc.account_number}</p>
                </div>
                <Badge status={acc.status} />
              </div>

              <div>
                <p className="text-xs text-slate-500">Available Balance</p>
                <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  ₹ {parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h4>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Min. Balance: ₹1,000</span>
                <Link to="/transfer" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Transfer →</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Financial Activity Overview</h3>
          <FinancialChart type="bar" data={chartData} />
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs font-bold text-blue-600 hover:underline">View History</Link>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent transactions found.</p>
            ) : (
              transactions.map((txn) => (
                <div key={txn.transaction_id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{txn.description}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{txn.reference_number}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${txn.transaction_type.includes('withdrawal') || txn.transaction_type.includes('debit') ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {txn.transaction_type.includes('withdrawal') || txn.transaction_type.includes('debit') ? '-' : '+'}₹{parseFloat(txn.amount).toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-400">{new Date(txn.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
