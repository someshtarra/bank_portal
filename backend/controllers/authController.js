const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { generateAccountNumber, recordAuditLog } = require('../utils/helper');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Generate JWT Token helper
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET || 'super_secret_jwt_key_banking_portal_2026_antigravity',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// @desc    Register a new user / customer
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password, phone, role, address, dob, aadhaar, pan } = req.body;

        // Check if user already exists
        const [existingUser] = await query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser && existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email address is already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const assignedRole = role && ['admin', 'employee', 'customer'].includes(role) ? role : 'customer';

        // Insert into Users table
        const [userResult] = await query(
            'INSERT INTO users (first_name, last_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword, phone, assignedRole]
        );

        const userId = userResult.insertId;
        let customerId = null;

        // If customer role, create Customer profile & primary Savings Account
        if (assignedRole === 'customer') {
            const defaultAddress = address || 'Standard Address';
            const defaultDob = dob || '1995-01-01';
            const defaultAadhaar = aadhaar || Math.floor(100000000000 + Math.random() * 900000000000).toString();
            const defaultPan = pan || 'PAN' + Math.floor(100000 + Math.random() * 900000).toString();

            const [custResult] = await query(
                'INSERT INTO customers (user_id, address, dob, aadhaar, pan, kyc_status) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, defaultAddress, defaultDob, defaultAadhaar, defaultPan, 'verified']
            );

            customerId = custResult.insertId;

            // Automatically create initial savings account with ₹5,000 opening balance
            const accNum = generateAccountNumber();
            await query(
                'INSERT INTO accounts (customer_id, account_number, account_type, balance, status) VALUES (?, ?, ?, ?, ?)',
                [customerId, accNum, 'savings', 5000.00, 'active']
            );
        }

        await recordAuditLog(userId, 'USER_REGISTERED', req.ip, `Registered new ${assignedRole}: ${email}`);

        const token = generateToken(userId, assignedRole);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: userId,
                first_name,
                last_name,
                email,
                phone,
                role: assignedRole,
                customer_id: customerId
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Fetch user from DB
        const [users] = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (!users || users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await recordAuditLog(user.id, 'LOGIN_FAILED', req.ip, `Failed login attempt for email ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        let customerData = null;
        if (user.role === 'customer') {
            const [customers] = await query('SELECT customer_id, kyc_status, avatar_url FROM customers WHERE user_id = ?', [user.id]);
            if (customers && customers.length > 0) {
                customerData = customers[0];
            }
        }

        await recordAuditLog(user.id, 'LOGIN_SUCCESS', req.ip, `Successful login by ${user.role}`);

        const token = generateToken(user.id, user.role);

        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                customer_id: customerData ? customerData.customer_id : null,
                kyc_status: customerData ? customerData.kyc_status : null,
                avatar_url: customerData ? customerData.avatar_url : null
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user (Audit logging)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
    try {
        await recordAuditLog(req.user.id, 'LOGOUT', req.ip, 'User logged out');
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot Password - Request Reset Link/Token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const [users] = await query('SELECT id, first_name, email FROM users WHERE email = ?', [email]);

        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'No user account found with that email address' });
        }

        const user = users[0];
        const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'super_secret_jwt_key_banking_portal_2026_antigravity', { expiresIn: '1h' });

        await sendPasswordResetEmail(user.email, resetToken);
        await recordAuditLog(user.id, 'FORGOT_PASSWORD_REQUESTED', req.ip, `Reset token generated`);

        res.json({
            success: true,
            message: 'Password reset instructions sent to your email address',
            resetToken
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset Password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { token, new_password } = req.body;

        if (!token || !new_password) {
            return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_banking_portal_2026_antigravity');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);
        await recordAuditLog(decoded.id, 'PASSWORD_RESET_SUCCESS', req.ip, 'Password successfully reset via token');

        res.json({ success: true, message: 'Password has been successfully updated' });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }
};

module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword
};
