const { query } = require('../config/db');
const { recordAuditLog } = require('../utils/helper');

const applyLoan = async (req, res, next) => {
    try {
        const customerId = req.user.customer_id;
        const { loan_type = 'Personal Loan', amount, duration } = req.body;

        const loanAmount = parseFloat(amount);
        const loanDuration = parseInt(duration);

        if (isNaN(loanAmount) || loanAmount < 1000) {
            return res.status(400).json({ success: false, message: 'Minimum loan amount is ₹1,000' });
        }

        let interestRate = 10.50;
        if (loan_type.toLowerCase().includes('home')) interestRate = 8.25;
        if (loan_type.toLowerCase().includes('auto') || loan_type.toLowerCase().includes('car')) interestRate = 9.00;
        if (loan_type.toLowerCase().includes('education')) interestRate = 7.50;

        await query(
            `INSERT INTO loans (customer_id, loan_type, amount, interest_rate, duration, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [customerId, loan_type, loanAmount, interestRate, loanDuration, 'pending']
        );

        await recordAuditLog(req.user.id, 'LOAN_APPLICATION_SUBMITTED', req.ip, `Applied for ${loan_type} of ₹${loanAmount}`);

        res.status(201).json({
            success: true,
            message: 'Loan application submitted successfully and is pending officer approval',
            interest_rate: interestRate
        });
    } catch (error) {
        next(error);
    }
};

const getCustomerLoans = async (req, res, next) => {
    try {
        const customerId = req.user.customer_id;
        const [loans] = await query('SELECT * FROM loans WHERE customer_id = ? ORDER BY applied_date DESC', [customerId]);
        res.json({ success: true, loans: loans || [] });
    } catch (error) {
        next(error);
    }
};

const getAllLoans = async (req, res, next) => {
    try {
        const [loans] = await query(`
            SELECT l.*, u.first_name, u.last_name, u.email, u.phone
            FROM loans l
            JOIN customers c ON l.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.id
            ORDER BY l.applied_date DESC
        `);
        res.json({ success: true, loans: loans || [] });
    } catch (error) {
        next(error);
    }
};

const updateLoanStatus = async (req, res, next) => {
    try {
        const loanId = req.params.id;
        const { status } = req.body;

        if (!['approved', 'rejected', 'closed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid loan status' });
        }

        const approvedDate = status === 'approved' ? new Date() : null;

        await query('UPDATE loans SET status = ?, approved_date = ? WHERE loan_id = ?', [status, approvedDate, loanId]);
        await recordAuditLog(req.user.id, 'LOAN_STATUS_UPDATE', req.ip, `Loan ID ${loanId} status updated to ${status}`);

        res.json({ success: true, message: `Loan status has been updated to ${status}` });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    applyLoan,
    getCustomerLoans,
    getAllLoans,
    updateLoanStatus
};
