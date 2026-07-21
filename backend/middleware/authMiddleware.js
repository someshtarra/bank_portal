const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Verify JWT Authentication Token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_banking_portal_2026_antigravity');

            // Fetch user from DB
            const [users] = await query('SELECT id, first_name, last_name, email, phone, role FROM users WHERE id = ?', [decoded.id]);

            if (!users || users.length === 0) {
                return res.status(401).json({ success: false, message: 'User account no longer exists' });
            }

            req.user = users[0];

            // If user is a customer, fetch customer_id as well
            if (req.user.role === 'customer') {
                const [customers] = await query('SELECT customer_id, kyc_status FROM customers WHERE user_id = ?', [req.user.id]);
                if (customers && customers.length > 0) {
                    req.user.customer_id = customers[0].customer_id;
                    req.user.kyc_status = customers[0].kyc_status;
                }
            }

            next();
        } catch (error) {
            console.error('Auth Protection Error:', error.message);
            return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }
};

// Role-Based Access Control Middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource`
            });
        }
        next();
    };
};

module.exports = {
    protect,
    authorize
};
