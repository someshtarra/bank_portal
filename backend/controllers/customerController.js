const { query } = require('../config/db');
const { recordAuditLog } = require('../utils/helper');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [users] = await query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.created_at,
                    c.customer_id, c.address, c.dob, c.aadhaar, c.pan, c.kyc_status, c.avatar_url
             FROM users u
             LEFT JOIN customers c ON u.id = c.user_id
             WHERE u.id = ?`,
            [userId]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }

        const profile = users[0];

        const [accounts] = await query(
            `SELECT account_id, account_number, account_type, balance, status, created_at
             FROM accounts WHERE customer_id = ?`,
            [profile.customer_id]
        );

        res.json({
            success: true,
            profile,
            accounts: accounts || []
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { phone, address } = req.body;

        if (phone) {
            await query('UPDATE users SET phone = ? WHERE id = ?', [phone, userId]);
        }

        if (address && req.user.customer_id) {
            await query('UPDATE customers SET address = ? WHERE customer_id = ?', [address, req.user.customer_id]);
        }

        if (req.file && req.user.customer_id) {
            const avatarUrl = `/uploads/${req.file.filename}`;
            await query('UPDATE customers SET avatar_url = ? WHERE customer_id = ?', [avatarUrl, req.user.customer_id]);
        }

        await recordAuditLog(userId, 'UPDATE_PROFILE', req.ip, 'Customer profile updated');

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getAccounts = async (req, res, next) => {
    try {
        if (!req.user.customer_id) {
            return res.status(400).json({ success: false, message: 'User is not linked to a customer record' });
        }

        const [accounts] = await query(
            `SELECT account_id, account_number, account_type, balance, status, created_at
             FROM accounts WHERE customer_id = ?`,
            [req.user.customer_id]
        );

        res.json({
            success: true,
            accounts: accounts || []
        });
    } catch (error) {
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const customerId = req.user.customer_id;
        const { account_id, transaction_type, start_date, end_date, search, page = 1, limit = 10 } = req.query;

        const [userAccounts] = await query('SELECT account_id FROM accounts WHERE customer_id = ?', [customerId]);
        if (!userAccounts || userAccounts.length === 0) {
            return res.json({ success: true, transactions: [], total: 0, page: 1, totalPages: 0 });
        }

        const accountIds = userAccounts.map(a => a.account_id);
        let whereConditions = [`t.account_id IN (${accountIds.join(',')})` ];
        let params = [];

        if (account_id) {
            whereConditions.push('t.account_id = ?');
            params.push(account_id);
        }

        if (transaction_type) {
            whereConditions.push('t.transaction_type = ?');
            params.push(transaction_type);
        }

        if (start_date) {
            whereConditions.push('t.created_at >= ?');
            params.push(`${start_date} 00:00:00`);
        }

        if (end_date) {
            whereConditions.push('t.created_at <= ?');
            params.push(`${end_date} 23:59:59`);
        }

        if (search) {
            whereConditions.push('(t.reference_number LIKE ? OR t.description LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const [countResult] = await query(`SELECT COUNT(*) as total FROM transactions t ${whereClause}`, params);
        const total = countResult[0] ? countResult[0].total : 0;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const querySql = `
            SELECT t.transaction_id, t.account_id, a.account_number, t.transaction_type,
                   t.amount, t.description, t.reference_number, t.sender_account,
                   t.receiver_account, t.status, t.created_at
            FROM transactions t
            JOIN accounts a ON t.account_id = a.account_id
            ${whereClause}
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [transactions] = await query(querySql, [...params, parseInt(limit), offset]);

        res.json({
            success: true,
            transactions: transactions || [],
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        next(error);
    }
};

const updatePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.id;

        const [users] = await query('SELECT password FROM users WHERE id = ?', [userId]);
        const isMatch = await bcrypt.compare(current_password, users[0].password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        await recordAuditLog(userId, 'PASSWORD_CHANGED', req.ip, 'User changed password');

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

const getBeneficiaries = async (req, res, next) => {
    try {
        const [beneficiaries] = await query(
            'SELECT * FROM beneficiaries WHERE customer_id = ? ORDER BY created_at DESC',
            [req.user.customer_id]
        );
        res.json({ success: true, beneficiaries: beneficiaries || [] });
    } catch (error) {
        next(error);
    }
};

const addBeneficiary = async (req, res, next) => {
    try {
        const { beneficiary_account, beneficiary_name, nickname, bank_name, ifsc_code } = req.body;
        const customerId = req.user.customer_id;

        await query(
            `INSERT INTO beneficiaries (customer_id, beneficiary_account, beneficiary_name, nickname, bank_name, ifsc_code)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [customerId, beneficiary_account, beneficiary_name, nickname || beneficiary_name, bank_name || 'Apex National Bank', ifsc_code || 'APEX0001024']
        );

        await recordAuditLog(req.user.id, 'ADD_BENEFICIARY', req.ip, `Added beneficiary ${beneficiary_name} (${beneficiary_account})`);

        res.status(201).json({ success: true, message: 'Beneficiary added successfully' });
    } catch (error) {
        if (error.message.includes('uk_cust_beneficiary') || error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ success: false, message: 'Beneficiary account already added' });
        }
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getAccounts,
    getTransactions,
    updatePassword,
    getBeneficiaries,
    addBeneficiary
};
