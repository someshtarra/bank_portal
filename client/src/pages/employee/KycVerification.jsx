import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { Toast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export const KycVerification = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchPendingKyc();
  }, []);

  const fetchPendingKyc = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employee/kyc/pending');
      if (res.data.success) setPendingList(res.data.pendingCustomers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (customerId, status) => {
    try {
      const res = await api.put(`/employee/kyc/verify/${customerId}`, { status });
      if (res.data.success) {
        setToast({ message: res.data.message, type: 'success' });
        fetchPendingKyc();
      }
    } catch (err) {
      setToast({ message: 'Failed to update KYC status', type: 'error' });
    }
  };

  if (loading) return <Loader label="Fetching pending KYC documents..." />;

  return (
    <div className="space-y-6">
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KYC Document Verification Queue</h1>
        <p className="text-xs text-slate-500">Inspect submitted Aadhaar and PAN card details for compliance approval</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pendingList.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 col-span-2 text-center">No pending KYC verifications in queue. All accounts up-to-date!</p>
        ) : (
          pendingList.map((c) => (
            <div key={c.customer_id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{c.first_name} {c.last_name}</h3>
                  <p className="text-xs text-slate-500">{c.email} | {c.phone}</p>
                </div>
                <Badge status="pending" text="KYC PENDING" />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Aadhaar Card:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{c.aadhaar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PAN Number:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{c.pan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DOB:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{new Date(c.dob).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => handleVerify(c.customer_id, 'verified')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center space-x-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve KYC</span>
                </button>
                <button
                  onClick={() => handleVerify(c.customer_id, 'rejected')}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center space-x-1.5 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject KYC</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
