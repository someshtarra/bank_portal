import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  FileText,
  CreditCard,
  UserCheck,
  Users,
  UserPlus,
  ShieldAlert,
  Settings,
  User,
  BadgePercent
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const customerNav = [
    { name: 'Dashboard', path: '/customer-dashboard', icon: LayoutDashboard },
    { name: 'Accounts', path: '/accounts', icon: Wallet },
    { name: 'Transfer Money', path: '/transfer', icon: ArrowRightLeft },
    { name: 'Deposit', path: '/deposit', icon: ArrowDownCircle },
    { name: 'Withdraw', path: '/withdraw', icon: ArrowUpCircle },
    { name: 'Transactions', path: '/transactions', icon: History },
    { name: 'Loans', path: '/loans', icon: BadgePercent },
    { name: 'Cards', path: '/cards', icon: CreditCard },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminNav = [
    { name: 'Dashboard Analytics', path: '/admin-dashboard', icon: LayoutDashboard },
    { name: 'Manage Customers', path: '/admin/customers', icon: Users },
    { name: 'Manage Employees', path: '/admin/employees', icon: UserPlus },
    { name: 'All Transactions', path: '/admin/transactions', icon: History },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
  ];

  const employeeNav = [
    { name: 'Employee Dashboard', path: '/employee-dashboard', icon: LayoutDashboard },
    { name: 'KYC Verifications', path: '/employee/kyc', icon: UserCheck },
    { name: 'All Customers', path: '/admin/customers', icon: Users },
    { name: 'Loan Applications', path: '/loans', icon: BadgePercent },
  ];

  const navItems = role === 'admin' ? adminNav : role === 'employee' ? employeeNav : customerNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full py-4 px-3 overflow-y-auto">
          <div className="px-3 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {role.toUpperCase()} MENU
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
