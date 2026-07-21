import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Toast } from '../../components/common/Toast';
import { ArrowUpCircle, AlertCircle } from 'lucide-react';

export const Withdraw = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/customer/accounts');
      if (res.data.success && res.data.accounts.length > 0) {
        setAccounts(res.data.accounts);
        setSelectedAccount(res.data.accounts[0].account_number);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/transactions/withdraw', {
        account_number: selectedAccount,
        amount: parseFloat(amount),
        description: description || 'Cash Withdrawal'
      });

      if (res.data.success) {
        setToast({
          message: `Withdrawal successful! Ref: ${res.data.reference_number}. New Balance: ₹${res.data.new_balance}`,
          type: 'success'
        });
        setAmount('');
        setDescription('');
        fetchAccounts();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Withdrawal failed.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}

      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
          <ArrowUpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Withdraw Money</h1>
        <p className="text-xs text-slate-500">Withdraw funds while adhering to the ₹1,000 minimum balance rule</p>
      </div>

      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl space-y-5">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center space-x-3 text-amber-700 dark:text-amber-400 text-xs font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Note: A mandatory minimum balance of ₹1,000 must remain in your account at all times.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Select Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.account_id} value={acc.account_number}>
                  {acc.account_number} ({acc.account_type.toUpperCase()}) - Balance: ₹{acc.balance}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Withdrawal Amount (₹)</label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Remarks / Reason</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ATM Cash Withdrawal"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Processing Withdrawal...' : 'Confirm Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
};
