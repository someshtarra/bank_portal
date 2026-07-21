import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../../components/common/Loader';
import { Toast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import { User, Phone, Mail, MapPin, Calendar, CreditCard, ShieldCheck, Upload } from 'lucide-react';

export const Profile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/profile');
      if (res.data.success) {
        const data = res.data.profile;
        setProfile(data);
        setPhone(data.phone || '');
        setAddress(data.address || '');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      formData.append('address', address);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.put('/customer/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setToast({ message: 'Profile updated successfully!', type: 'success' });
        updateUser({ phone });
        fetchProfile();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Fetching profile details..." />;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}

      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-3xl shadow-xl overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                `${profile?.first_name?.[0] || 'U'}${profile?.last_name?.[0] || ''}`
              )}
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center space-x-3 justify-center sm:justify-start">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <Badge status={profile?.kyc_status} text={`KYC ${profile?.kyc_status?.toUpperCase()}`} />
            </div>
            <p className="text-xs text-slate-500">{profile?.email}</p>
            <p className="text-xs text-slate-400 font-mono">Customer ID: CUST-{profile?.customer_id}</p>
          </div>
        </div>

        {/* Read-Only Statutory Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Aadhaar Number</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{profile?.aadhaar || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">PAN Card</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{profile?.pan || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Date of Birth</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Edit Profile Information</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Update Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Residential Address</label>
            <textarea
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
