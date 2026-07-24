import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, User, Shield, Menu, X, Landmark } from 'lucide-react';
import { Badge } from './Badge';

export const Navbar = ({ toggleSidebar }) => {
  const { user, logoutUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Left: Brand Logo & Sidebar Toggle */}
        <div className="flex items-center space-x-3">
          {user && (
            <button
              onClick={toggleSidebar}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to={user ? `/${user.role}-dashboard` : '/'} className="flex items-center space-x-2.5 group">
            <div className="p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl shadow-md group-hover:scale-105 transition-transform">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                APEX <span className="text-blue-600 dark:text-blue-400">BANK</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
                National Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Toggle Dark / Light Mode"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    `${user.first_name[0]}${user.last_name[0]}`
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {user.first_name} {user.last_name}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <Badge status={user.role} text={user.role.toUpperCase()} />
                  </div>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>

                  {user.role === 'customer' && (
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2.5 text-slate-400" />
                      View Profile
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Open Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
