import React from 'react';
import { Landmark, Shield, Users, Award, CheckCircle2 } from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">About Apex National Bank</h1>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
          Pioneering modern financial technology with institutional security, transparent banking rules, and seamless 24x7 customer support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Vision & Commitment</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Founded with the mission to revolutionize retail and commercial banking, Apex National Bank provides instant account management, real-time transaction processing, and strict financial compliance.
          </p>
          <ul className="space-y-3 pt-2">
            {[
              'Minimum balance guarantee of ₹1,000 for customer safety',
              '256-bit AES end-to-end payload encryption',
              'Strict 3-Tier AWS Architecture with isolated database layer',
              'Full compliance with RBI and international banking standards'
            ].map((item, idx) => (
              <li key={idx} className="flex items-center space-x-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-blue-600 text-white rounded-2xl space-y-2">
            <Users className="w-8 h-8 opacity-80" />
            <h3 className="text-3xl font-bold">10M+</h3>
            <p className="text-xs text-blue-100 uppercase tracking-wider">Active Customers</p>
          </div>
          <div className="p-6 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl space-y-2">
            <Landmark className="w-8 h-8 text-blue-400" />
            <h3 className="text-3xl font-bold">500+</h3>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Branch Network</p>
          </div>
          <div className="p-6 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl space-y-2">
            <Shield className="w-8 h-8 text-emerald-400" />
            <h3 className="text-3xl font-bold">99.99%</h3>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Uptime SLA</p>
          </div>
          <div className="p-6 bg-emerald-600 text-white rounded-2xl space-y-2">
            <Award className="w-8 h-8 opacity-80" />
            <h3 className="text-3xl font-bold">#1</h3>
            <p className="text-xs text-emerald-100 uppercase tracking-wider">Digital Bank 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};
