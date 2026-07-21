import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { Search, UserPlus, Lock, Unlock, Trash2, Edit, CheckCircle } from 'lucide-react';

export const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCust, setNewCust] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: 'Password@123',
    address: '',
    dob: '1995-01-01',
    aadhaar: '',
    pan: '',
    account_type: 'savings',
    initial_deposit: '5000'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/customers?search=${encodeURIComponent(query)}`);
      if (res.data.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/customers', newCust);
      if (res.data.success) {
        setToast({ message: res.data.message, type: 'success' });
        setIsCreateOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to create customer', type: 'error' });
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will remove all associated bank accounts.')) return;
    try {
      const res = await api.delete(`/admin/customers/${id}`);
      if (res.data.success) {
        setToast({ message: 'Customer deleted successfully', type: 'success' });
        fetchCustomers();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete customer', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Management</h1>
          <p className="text-xs text-slate-500">Search, create, update, and manage customer accounts</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-2 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Email, Aadhaar, or PAN..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">Search</button>
        </form>
      </div>

      {/* Customer List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <Loader label="Fetching customer directory..." />
        ) : customers.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">No customer records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">KYC Status</th>
                  <th className="py-3.5 px-4">Accounts</th>
                  <th className="py-3.5 px-4">Total Balance</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {customers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {c.first_name} {c.last_name}
                      <span className="block text-[10px] text-slate-400 font-normal">PAN: {c.pan}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {c.email}
                      <span className="block text-[10px] text-slate-400">{c.phone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.kyc_status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{c.account_count} Account(s)</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹ {parseFloat(c.total_balance).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteCustomer(c.customer_id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Customer">
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="First Name"
              value={newCust.first_name}
              onChange={(e) => setNewCust({ ...newCust, first_name: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
            />
            <input
              type="text"
              required
              placeholder="Last Name"
              value={newCust.last_name}
              onChange={(e) => setNewCust({ ...newCust, last_name: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={newCust.email}
              onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
            />
            <input
              type="text"
              required
              placeholder="Phone"
              value={newCust.phone}
              onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Aadhaar (12 digits)"
              value={newCust.aadhaar}
              onChange={(e) => setNewCust({ ...newCust, aadhaar: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
            />
            <input
              type="text"
              placeholder="PAN Card (10 chars)"
              value={newCust.pan}
              onChange={(e) => setNewCust({ ...newCust, pan: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1">Account Type</label>
              <select
                value={newCust.account_type}
                onChange={(e) => setNewCust({ ...newCust, account_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
              >
                <option value="savings">Savings Account</option>
                <option value="checking">Checking Account</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1">Initial Deposit (₹)</label>
              <input
                type="number"
                value={newCust.initial_deposit}
                onChange={(e) => setNewCust({ ...newCust, initial_deposit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow">Create Customer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
