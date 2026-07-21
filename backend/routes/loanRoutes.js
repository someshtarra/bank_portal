const express = require('express');
const router = express.Router();
const { applyLoan, getCustomerLoans, getAllLoans, updateLoanStatus } = require('../controllers/loanController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, loanValidationRules } = require('../middleware/validationMiddleware');

router.use(protect);

router.post('/apply', authorize('customer'), loanValidationRules, validate, applyLoan);
router.get('/my-loans', authorize('customer'), getCustomerLoans);
router.get('/all', authorize('admin', 'employee'), getAllLoans);
router.put('/:id/status', authorize('admin', 'employee'), updateLoanStatus);

module.exports = router;
