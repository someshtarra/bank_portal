const express = require('express');
const router = express.Router();
const { getPendingKyc, verifyKyc, getEmployeeDashboard } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('employee', 'admin'));

router.get('/dashboard', getEmployeeDashboard);
router.get('/kyc/pending', getPendingKyc);
router.put('/kyc/verify/:id', verifyKyc);

module.exports = router;
