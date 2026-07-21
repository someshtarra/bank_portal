import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Lock, CreditCard, ArrowRight, TrendingUp, Users, Award, Building2 } from 'lucide-react';

export const Home = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <Zap className="w-4 h-4" />
              <span>Next-Gen Enterprise Banking Portal</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Banking Built for the <span className="text-gradient">Digital Era</span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Experience instant transfers, high-yield savings accounts, instant digital cards, and institutional-grade 256-bit AES encryption.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/register"
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center space-x-2 transition-all"
              >
                <span>Open Savings Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Sign In to NetBanking
              </Link>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
              <div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">₹1000</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Min. Balance</p>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-blue-600 dark:text-blue-400">7.25%</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Fixed Deposit P.A.</p>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Instant</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">NEFT / RTGS / IMPS</p>
              </div>
            </div>
          </div>

          {/* Hero Card Visual */}
          <div className="relative flex justify-center">
            <div className="w-full max-w-md p-8 rounded-3xl bank-card-bg text-white shadow-2xl space-y-8 transform hover:rotate-1 transition-transform">
              <div className="flex justify-between items-center">
                <span className="font-extrabold tracking-widest text-lg">ANTIGRAVITY</span>
                <CreditCard className="w-8 h-8 opacity-80" />
              </div>
              
              <div className="py-4">
                <p className="text-xs text-slate-300 uppercase tracking-widest mb-1">Account Balance</p>
                <h3 className="text-3xl font-mono font-bold tracking-tight">₹ 1,25,450.00</h3>
              </div>

              <div className="flex justify-between items-end text-xs tracking-wider">
                <div>
                  <p className="text-slate-400 uppercase text-[10px]">Card Holder</p>
                  <p className="font-semibold uppercase">RAJESH KUMAR</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[10px]">Expires</p>
                  <p className="font-semibold">12/28</p>
                </div>
                <div className="text-lg font-bold italic tracking-tighter opacity-90">VISA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banking Services Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Complete Digital Banking Suite</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your money effortlessly with our feature-rich mobile and web portal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="p-3 w-fit bg-blue-500/10 text-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Savings & Checking</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Open an account in minutes with zero paperwork and enjoy competitive interest rates.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="p-3 w-fit bg-emerald-500/10 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Instant Money Transfers</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Transfer money 24x7 to any bank account with instant SMS & email confirmation alerts.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="p-3 w-fit bg-purple-500/10 text-purple-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Low Interest Loans</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Pre-approved personal, home, and vehicle loans with flexible EMI tenure options.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
