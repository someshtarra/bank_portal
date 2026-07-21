const express = require('express');
const router = express.Router();
const {
    getDashboardAnalytics,
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleAccountStatus,
    getEmployees,
    createEmployee,
    getAuditLogs
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Analytics Dashboard
router.get('/dashboard', authorize('admin', 'employee'), getDashboardAnalytics);

// Customer Management
router.get('/customers', authorize('admin', 'employee'), getCustomers);
router.post('/customers', authorize('admin'), createCustomer);
router.put('/customers/:id', authorize('admin'), updateCustomer);
router.delete('/customers/:id', authorize('admin'), deleteCustomer);

// Account Status Management (Freeze / Activate)
router.put('/accounts/:id/status', authorize('admin', 'employee'), toggleAccountStatus);

// Employee Management
router.get('/employees', authorize('admin'), getEmployees);
router.post('/employees', authorize('admin'), createEmployee);

// System Audit Logs
router.get('/audit-logs', authorize('admin'), getAuditLogs);

module.exports = router;
