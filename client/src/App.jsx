import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import { MainLayout } from './components/layout/MainLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Services } from './pages/public/Services';
import { Contact } from './pages/public/Contact';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { ResetPassword } from './pages/public/ResetPassword';
import { NotFound } from './pages/public/NotFound';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { Profile } from './pages/customer/Profile';
import { Accounts } from './pages/customer/Accounts';
import { Transfer } from './pages/customer/Transfer';
import { Deposit } from './pages/customer/Deposit';
import { Withdraw } from './pages/customer/Withdraw';
import { Transactions } from './pages/customer/Transactions';
import { Loans } from './pages/customer/Loans';
import { Cards } from './pages/customer/Cards';
import { Settings } from './pages/customer/Settings';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageCustomers } from './pages/admin/ManageCustomers';
import { ManageEmployees } from './pages/admin/ManageEmployees';
import { AllTransactions } from './pages/admin/AllTransactions';
import { AuditLogs } from './pages/admin/AuditLogs';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { KycVerification } from './pages/employee/KycVerification';

// Protected Route Component
const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}-dashboard`} replace />;
  }
  return <DashboardLayout />;
};

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Customer Dashboard Routes */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Admin Dashboard Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/customers" element={<ManageCustomers />} />
        <Route path="/admin/employees" element={<ManageEmployees />} />
        <Route path="/admin/transactions" element={<AllTransactions />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Employee Dashboard Routes */}
      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/kyc" element={<KycVerification />} />
      </Route>
    </Routes>
  );
}
