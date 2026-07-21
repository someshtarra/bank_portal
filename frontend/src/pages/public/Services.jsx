import React from 'react';
import { Wallet, ArrowRightLeft, CreditCard, BadgePercent, ShieldCheck, Headphones } from 'lucide-react';

export const Services = () => {
  const services = [
    { title: 'Savings Accounts', desc: 'High-interest rate savings accounts with digital onboarding and minimum balance requirement of ₹1000.', icon: Wallet },
    { title: 'Fund Transfers', desc: 'Instant NEFT, RTGS, and IMPS money transfers with zero hidden transaction charges.', icon: ArrowRightLeft },
    { title: 'Debit & Credit Cards', desc: 'Manage your virtual and physical debit/credit cards with instant block/unblock controls.', icon: CreditCard },
    { title: 'Personal & Home Loans', desc: 'Low-interest rates starting at 8.25% with instant digital KYC approval.', icon: BadgePercent },
    { title: 'Fraud Protection', desc: '24x7 automated fraud monitoring and real-time transaction SMS/email alerts.', icon: ShieldCheck },
    { title: 'Customer Helpdesk', desc: 'Dedicated 24x7 banking support via phone, email, and live branch assistance.', icon: Headphones },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">Our Banking Services</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Tailored financial solutions designed to help you save, invest, and manage money securely.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="p-3 w-fit bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
