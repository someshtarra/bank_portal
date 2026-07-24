import React from 'react';
import { Landmark, Shield, Lock, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-slate-900 dark:text-white">SOMESH NATIONAL BANK</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enterprise 3-Tier Digital Banking Portal with end-to-end encryption, real-time transaction processing, and automated audit security.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">Quick Links</h5>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li><a href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</a></li>
              <li><a href="/services" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Banking Services</a></li>
              <li><a href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Customer Support</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">Security Standards</h5>
            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-Bit SSL Encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>RBI & ISO 27001 Certified</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">24x7 Helpline</h5>
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
              <Phone className="w-4 h-4" />
              <span>1800-123-4567</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Toll-free customer care line</p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Somesh National Bank. All rights reserved. Production 3-Tier AWS Ready Architecture.
        </div>
      </div>
    </footer>
  );
};
