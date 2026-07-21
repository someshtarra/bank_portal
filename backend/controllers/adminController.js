const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateAccountNumber, recordAuditLog } = require('../utils/helper');

const getDashboardAnalytics = async (req, res, next) => {
    try {
        const [custCount] = await query('SELECT COUNT(*) as total FROM customers');
        const totalCustomers = custCount[0] ? custCount[0].total : 0;

        const [accCount] = await query('SELECT COUNT(*) as total FROM accounts');
        const totalAccounts = accCount[0] ? accCount[0].total : 0;

        const [balanceSum] = await query('SELECT SUM(balance) as total_balance FROM accounts');
        const totalBalance = balanceSum[0] && balanceSum[0].total_balance ? parseFloat(balanceSum[0].total_balance) : 0;

        const [dailyTxn] = await query(
            "SELECT COUNT(*) as count, SUM(amount) as total_amount FROM transactions"
        );
        const dailyTransactionsCount = dailyTxn[0] ? dailyTxn[0].count : 0;
        const dailyTransactionsVolume = dailyTxn[0] && dailyTxn[0].total_amount ? parseFloat(dailyTxn[0].total_amount) : 0;

        const [loanStats] = await query('SELECT COUNT(*) as total, SUM(amount) as total_amount FROM loans WHERE status = "approved"');
        const activeLoansCount = loanStats[0] ? loanStats[0].total : 0;
        const activeLoansVolume = loanStats[0] && loanStats[0].total_amount ? parseFloat(loanStats[0].total_amount) : 0;

        const [recentAudits] = await query(`
            SELECT a.log_id, a.action, a.ip_address, a.details, a.timestamp, u.email, u.role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            analytics: {
                totalCustomers,
                totalAccounts,
                totalBalance,
                dailyTransactionsCount,
                dailyTransactionsVolume,
                activeLoansCount,
                activeLoansVolume,
                chartData: [
                    { month: 'May 2026', total_deposits: 45000, total_withdrawals: 15000 },
                    { month: 'Jun 2026', total_deposits: 80000, total_withdrawals: 25000 },
                    { month: 'Jul 2026', total_deposits: 120000, total_withdrawals: 30000 }
                ],
                recentAudits: recentAudits || []
            }
        });
    } catch (error) {
        next(error);
    }
};

const getCustomers = async (req, res, next) => {
    try {
        const { search, kyc_status, page = 1, limit = 10 } = req.query;
        let whereConditions = [];
        let params = [];

        if (search) {
            whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR c.aadhaar LIKE ? OR c.pan LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (kyc_status) {
            whereConditions.push('c.kyc_status = ?');
            params.push(kyc_status);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const [countRes] = await query(
            `SELECT COUNT(*) as total FROM customers c JOIN users u ON c.user_id = u.id ${whereClause}`,
            params
        );
        const total = countRes[0] ? countRes[0].total : 0;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const sql = `
            SELECT c.customer_id, u.id as user_id, u.first_name, u.last_name, u.email, u.phone,
                   c.address, c.dob, c.aadhaar, c.pan, c.kyc_status, u.created_at,
                   (SELECT COUNT(*) FROM accounts a WHERE a.customer_id = c.customer_id) as account_count,
                   (SELECT COALESCE(SUM(balance), 0) FROM accounts a WHERE a.customer_id = c.customer_id) as total_balance
            FROM customers c
            JOIN users u ON c.user_id = u.id
            ${whereClause}
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [customers] = await query(sql, [...params, parseInt(limit), offset]);

        res.json({
            success: true,
            customers: customers || [],
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        next(error);
    }
};

const createCustomer = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password, phone, address, dob, aadhaar, pan, account_type = 'savings', initial_deposit = 5000 } = req.body;

        const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing && existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email address already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'Password@123', salt);

        const [userResult] = await query(
            'INSERT INTO users (first_name, last_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword, phone, 'customer']
        );
        const userId = userResult.insertId;

        const [custResult] = await query(
            'INSERT INTO customers (user_id, address, dob, aadhaar, pan, kyc_status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, address || 'Default Address', dob || '1995-01-01', aadhaar || '123456789012', pan || 'PAN1234567', 'verified']
        );
        const customerId = custResult.insertId;

        const accNum = generateAccountNumber();
        await query(
            'INSERT INTO accounts (customer_id, account_number, account_type, balance, status) VALUES (?, ?, ?, ?, ?)',
            [customerId, accNum, account_type, parseFloat(initial_deposit), 'active']
        );

        await recordAuditLog(req.user.id, 'ADMIN_CREATE_CUSTOMER', req.ip, `Created customer ${email} with account ${accNum}`);

        res.status(201).json({
            success: true,
            message: 'Customer and Account created successfully',
            account_number: accNum
        });
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        const customerId = req.params.id;
        const { first_name, last_name, phone, address, kyc_status } = req.body;

        const [customers] = await query('SELECT user_id FROM customers WHERE customer_id = ?', [customerId]);
        if (!customers || customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        const userId = customers[0].user_id;

        if (first_name || last_name || phone) {
            await query(
                'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone) WHERE id = ?',
                [first_name, last_name, phone, userId]
            );
        }

        if (address || kyc_status) {
            await query(
                'UPDATE customers SET address = COALESCE(?, address), kyc_status = COALESCE(?, kyc_status) WHERE customer_id = ?',
                [address, kyc_status, customerId]
            );
        }

        await recordAuditLog(req.user.id, 'ADMIN_UPDATE_CUSTOMER', req.ip, `Updated customer ID ${customerId}`);

        res.json({ success: true, message: 'Customer details updated successfully' });
    } catch (error) {
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        const customerId = req.params.id;
        const [customers] = await query('SELECT user_id FROM customers WHERE customer_id = ?', [customerId]);
        if (!customers || customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        await query('DELETE FROM users WHERE id = ?', [customers[0].user_id]);
        await recordAuditLog(req.user.id, 'ADMIN_DELETE_CUSTOMER', req.ip, `Deleted customer ID ${customerId}`);

        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const toggleAccountStatus = async (req, res, next) => {
    try {
        const accountId = req.params.id;
        const { status } = req.body;

        if (!['active', 'frozen', 'closed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        await query('UPDATE accounts SET status = ? WHERE account_id = ?', [status, accountId]);
        await recordAuditLog(req.user.id, 'ACCOUNT_STATUS_CHANGE', req.ip, `Account ID ${accountId} status set to ${status}`);

        res.json({ success: true, message: `Account status updated to ${status}` });
    } catch (error) {
        next(error);
    }
};

const getEmployees = async (req, res, next) => {
    try {
        const [employees] = await query('SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE role = "employee"');
        res.json({ success: true, employees: employees || [] });
    } catch (error) {
        next(error);
    }
};

const createEmployee = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'Password@123', salt);

        await query(
            'INSERT INTO users (first_name, last_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword, phone, 'employee']
        );

        await recordAuditLog(req.user.id, 'CREATE_EMPLOYEE', req.ip, `Created employee ${email}`);

        res.status(201).json({ success: true, message: 'Employee user created successfully' });
    } catch (error) {
        next(error);
    }
};

const getAuditLogs = async (req, res, next) => {
    try {
        const [logs] = await query(`
            SELECT a.log_id, a.action, a.ip_address, a.details, a.timestamp, u.email, u.role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
            LIMIT 100
        `);
        res.json({ success: true, logs: logs || [] });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardAnalytics,
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleAccountStatus,
    getEmployees,
    createEmployee,
    getAuditLogs
};
