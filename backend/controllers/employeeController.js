const { query } = require('../config/db');
const { recordAuditLog } = require('../utils/helper');

const getPendingKyc = async (req, res, next) => {
    try {
        const [pendingCustomers] = await query(`
            SELECT c.customer_id, u.id as user_id, u.first_name, u.last_name, u.email, u.phone,
                   c.address, c.dob, c.aadhaar, c.pan, c.kyc_status, c.created_at
            FROM customers c
            JOIN users u ON c.user_id = u.id
            WHERE c.kyc_status = 'pending'
            ORDER BY c.created_at ASC
        `);
        res.json({ success: true, pendingCustomers: pendingCustomers || [] });
    } catch (error) {
        next(error);
    }
};

const verifyKyc = async (req, res, next) => {
    try {
        const customerId = req.params.id;
        const { status } = req.body;

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be verified or rejected' });
        }

        await query('UPDATE customers SET kyc_status = ? WHERE customer_id = ?', [status, customerId]);
        await recordAuditLog(req.user.id, 'KYC_VERIFICATION', req.ip, `Customer ID ${customerId} KYC set to ${status}`);

        res.json({
            success: true,
            message: `Customer KYC status has been updated to ${status}`
        });
    } catch (error) {
        next(error);
    }
};

const getEmployeeDashboard = async (req, res, next) => {
    try {
        const [kycCount] = await query('SELECT COUNT(*) as pending_kyc FROM customers WHERE kyc_status = "pending"');
        const [loanCount] = await query('SELECT COUNT(*) as pending_loans FROM loans WHERE status = "pending"');
        const [recentCustomers] = await query(`
            SELECT c.customer_id, u.first_name, u.last_name, u.email, c.kyc_status, c.created_at
            FROM customers c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            dashboard: {
                pendingKyc: kycCount[0] ? kycCount[0].pending_kyc : 0,
                pendingLoans: loanCount[0] ? loanCount[0].pending_loans : 0,
                recentCustomers: recentCustomers || []
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPendingKyc,
    verifyKyc,
    getEmployeeDashboard
};
