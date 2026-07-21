import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Toast } from '../../components/common/Toast';
import { ArrowDownCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export const Deposit = () => {
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
      const res = await api.post('/transactions/deposit', {
        account_number: selectedAccount,
        amount: parseFloat(amount),
        description: description || 'Online Deposit'
      });

      if (res.data.success) {
        setToast({
          message: `Deposit successful! Ref: ${res.data.reference_number}. New Balance: ₹${res.data.new_balance}`,
          type: 'success'
        });
        setAmount('');
        setDescription('');
        fetchAccounts();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Deposit failed. Please try again.',
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
        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
          <ArrowDownCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Deposit Money</h1>
        <p className="text-xs text-slate-500">Credit funds instantly into your bank account</p>
      </div>

      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Select Target Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.account_id} value={acc.account_number}>
                  {acc.account_number} ({acc.account_type.toUpperCase()}) - Current: ₹{acc.balance}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Deposit Amount (₹)</label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Remarks / Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Salary / Cash Deposit"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Processing Deposit...' : 'Confirm Deposit'}
          </button>
        </form>
      </div>
    </div>
  );
};
