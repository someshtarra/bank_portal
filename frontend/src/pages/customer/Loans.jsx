import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { BadgePercent, PlusCircle, Calendar, CheckCircle2 } from 'lucide-react';

export const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const [loanType, setLoanType] = useState('Personal Loan');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('12');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/loans/my-loans');
      if (res.data.success) setLoans(res.data.loans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/loans/apply', {
        loan_type: loanType,
        amount: parseFloat(amount),
        duration: parseInt(duration)
      });
      if (res.data.success) {
        setToast({ message: res.data.message, type: 'success' });
        setIsModalOpen(false);
        setAmount('');
        fetchLoans();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Loan application failed', type: 'error' });
    }
  };

  if (loading) return <Loader label="Fetching active loans..." />;

  return (
    <div className="space-y-6">
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Loan Accounts</h1>
          <p className="text-xs text-slate-500">Apply for pre-approved personal, home, and auto loans</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apply New Loan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loans.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 col-span-2 text-center">No loan applications found.</p>
        ) : (
          loans.map((loan) => (
            <div key={loan.loan_id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{loan.loan_type}</span>
                <Badge status={loan.status} />
              </div>

              <div>
                <p className="text-xs text-slate-500">Principal Amount</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  ₹ {parseFloat(loan.amount).toLocaleString('en-IN')}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 text-[10px]">Interest Rate</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{loan.interest_rate}% P.A.</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Tenure</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{loan.duration} Months</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Apply Loan Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Pre-Approved Loan">
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Loan Type</label>
            <select
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none"
            >
              <option value="Personal Loan">Personal Loan (10.5% Interest)</option>
              <option value="Home Loan">Home Loan (8.25% Interest)</option>
              <option value="Auto Loan">Auto Loan (9.0% Interest)</option>
              <option value="Education Loan">Education Loan (7.5% Interest)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Required Loan Amount (₹)</label>
            <input
              type="number"
              min="1000"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Months)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none"
            >
              <option value="12">12 Months (1 Year)</option>
              <option value="24">24 Months (2 Years)</option>
              <option value="36">36 Months (3 Years)</option>
              <option value="60">60 Months (5 Years)</option>
              <option value="120">120 Months (10 Years)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow"
            >
              Submit Loan Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
