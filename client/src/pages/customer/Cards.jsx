import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import { Toast } from '../../components/common/Toast';
import { CreditCard, Lock, Unlock, PlusCircle, Eye, EyeOff } from 'lucide-react';

export const Cards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCvv, setShowCvv] = useState({});
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cards/my-cards');
      if (res.data.success) setCards(res.data.cards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCard = async (type) => {
    try {
      const res = await api.post('/cards/request', { type });
      if (res.data.success) {
        setToast({ message: res.data.message, type: 'success' });
        fetchCards();
      }
    } catch (err) {
      setToast({ message: 'Failed to issue new card', type: 'error' });
    }
  };

  const toggleStatus = async (cardId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      const res = await api.put(`/cards/${cardId}/toggle-status`, { status: newStatus });
      if (res.data.success) {
        setToast({ message: res.data.message, type: 'success' });
        fetchCards();
      }
    } catch (err) {
      setToast({ message: 'Failed to update card status', type: 'error' });
    }
  };

  if (loading) return <Loader label="Fetching digital cards..." />;

  return (
    <div className="space-y-6">
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Debit & Credit Cards</h1>
          <p className="text-xs text-slate-500">Virtual cards with instant block/unblock security controls</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleRequestCard('debit')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-all"
          >
            + New Debit Card
          </button>
          <button
            onClick={() => handleRequestCard('credit')}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl shadow transition-all"
          >
            + New Credit Card
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {cards.map((card) => (
          <div key={card.card_id} className="space-y-4">
            {/* Visual Bank Card */}
            <div className={`p-8 rounded-3xl text-white shadow-2xl space-y-6 transition-all ${
              card.type === 'credit'
                ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900'
                : 'bank-card-bg'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-extrabold tracking-widest text-sm uppercase">{card.type} Card</span>
                <Badge status={card.status} />
              </div>

              <div className="py-2">
                <p className="text-[10px] text-slate-300 uppercase tracking-widest">Card Number</p>
                <h3 className="text-xl font-mono font-bold tracking-widest mt-0.5">{card.card_number}</h3>
              </div>

              <div className="flex justify-between items-end text-xs tracking-wider">
                <div>
                  <p className="text-slate-300 uppercase text-[9px]">Card Holder</p>
                  <p className="font-semibold uppercase">{card.card_holder}</p>
                </div>
                <div>
                  <p className="text-slate-300 uppercase text-[9px]">Expires</p>
                  <p className="font-semibold">{card.expiry}</p>
                </div>
                <div className="text-lg font-bold italic tracking-tighter opacity-90">VISA</div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs">
              <span className="text-slate-500 font-medium">Daily ATM Limit: ₹{parseFloat(card.daily_limit).toLocaleString()}</span>
              <button
                onClick={() => toggleStatus(card.card_id, card.status)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-colors ${
                  card.status === 'active'
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                }`}
              >
                {card.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{card.status === 'active' ? 'Block Card' : 'Unblock Card'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
