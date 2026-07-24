import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Toast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { ArrowRightLeft, UserPlus, Users, AlertCircle } from 'lucide-react';

export const Transfer = () => {
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [senderAccount, setSenderAccount] = useState('');
  const [receiverAccount, setReceiverAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Add Beneficiary Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [benName, setBenName] = useState('');
  const [benAcc, setBenAcc] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accRes, benRes] = await Promise.all([
        api.get('/customer/accounts'),
        api.get('/customer/beneficiaries')
      ]);

      if (accRes.data.success && accRes.data.accounts.length > 0) {
        setAccounts(accRes.data.accounts);
        setSenderAccount(accRes.data.accounts[0].account_number);
      }
      if (benRes.data.success) {
        setBeneficiaries(benRes.data.beneficiaries || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/transactions/transfer', {
        sender_account: senderAccount,
        receiver_account: receiverAccount,
        amount: parseFloat(amount),
        description: description || 'Fund Transfer'
      });

      if (res.data.success) {
        setToast({
          message: `Transfer successful! Ref: ${res.data.reference_number}. New Balance: ₹${res.data.new_balance}`,
          type: 'success'
        });
        setAmount('');
        setDescription('');
        setReceiverAccount('');
        fetchData();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Transfer failed.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customer/beneficiaries', {
        beneficiary_account: benAcc,
        beneficiary_name: benName
      });
      if (res.data.success) {
        setToast({ message: 'Beneficiary added successfully!', type: 'success' });
        setBenName('');
        setBenAcc('');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to add beneficiary', type: 'error' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Transfer Money</h1>
          <p className="text-xs text-slate-500">Instant 24x7 fund transfers with minimum ₹1,000 balance protection</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-2 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Beneficiary</span>
        </button>
      </div>

      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl space-y-5">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">From Account (Sender)</label>
            <select
              value={senderAccount}
              onChange={(e) => setSenderAccount(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Saved Beneficiary OR Enter Account Number
            </label>

            {beneficiaries.length > 0 && (
              <div className="mb-2">
                <select
                  onChange={(e) => setReceiverAccount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">-- Choose from Saved Beneficiaries --</option>
                  {beneficiaries.map((b) => (
                    <option key={b.beneficiary_id} value={b.beneficiary_account}>
                      {b.beneficiary_name} ({b.beneficiary_account})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="text"
              required
              value={receiverAccount}
              onChange={(e) => setReceiverAccount(e.target.value)}
              placeholder="Recipient Account Number (e.g. 100120240003)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Transfer Amount (₹)</label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Payment Remarks</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rent / Fees / General Transfer"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Executing Transfer...' : 'Confirm Transfer'}
          </button>
        </form>
      </div>

      {/* Add Beneficiary Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Beneficiary">
        <form onSubmit={handleAddBeneficiary} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Beneficiary Full Name</label>
            <input
              type="text"
              required
              value={benName}
              onChange={(e) => setBenName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Beneficiary Account Number</label>
            <input
              type="text"
              required
              value={benAcc}
              onChange={(e) => setBenAcc(e.target.value)}
              placeholder="e.g. 100120240003"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow"
            >
              Save Beneficiary
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
