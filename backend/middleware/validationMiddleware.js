const { validationResult, body } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
        });
    }
    next();
};

// User Registration Rules
const registerValidationRules = [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('address').optional().trim(),
    body('dob').optional().isDate().withMessage('DOB must be a valid date YYYY-MM-DD'),
    body('aadhaar').optional().isLength({ min: 12, max: 12 }).withMessage('Aadhaar must be 12 digits'),
    body('pan').optional().isLength({ min: 10, max: 10 }).withMessage('PAN must be 10 characters')
];

// Login Rules
const loginValidationRules = [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

// Transaction Rules (Deposit / Withdraw)
const transactionValidationRules = [
    body('account_number').notEmpty().withMessage('Account number is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than zero')
];

// Transfer Rules
const transferValidationRules = [
    body('sender_account').notEmpty().withMessage('Sender account is required'),
    body('receiver_account').notEmpty().withMessage('Receiver account is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Transfer amount must be greater than zero'),
    body('description').optional().trim()
];

// Loan Application Rules
const loanValidationRules = [
    body('amount').isFloat({ min: 1000 }).withMessage('Loan amount must be at least ₹1000'),
    body('duration').isInt({ min: 3, max: 240 }).withMessage('Duration must be between 3 and 240 months')
];

module.exports = {
    validate,
    registerValidationRules,
    loginValidationRules,
    transactionValidationRules,
    transferValidationRules,
    loanValidationRules
};
