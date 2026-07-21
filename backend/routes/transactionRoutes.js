const express = require('express');
const router = express.Router();
const { deposit, withdraw, transfer } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { validate, transactionValidationRules, transferValidationRules } = require('../middleware/validationMiddleware');

router.use(protect);

router.post('/deposit', transactionValidationRules, validate, deposit);
router.post('/withdraw', transactionValidationRules, validate, withdraw);
router.post('/transfer', transferValidationRules, validate, transfer);

module.exports = router;
