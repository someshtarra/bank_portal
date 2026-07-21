const { query } = require('../config/db');

// Generate unique transaction reference number
const generateReferenceNumber = () => {
    const prefix = 'TXN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${timestamp}${random}`;
};

// Generate unique account number
const generateAccountNumber = () => {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    return `1001${year}${randomDigits}`;
};

// Generate unique card number (Visa format 4532...)
const generateCardNumber = () => {
    const prefix = '4532';
    const group1 = Math.floor(1000 + Math.random() * 9000);
    const group2 = Math.floor(1000 + Math.random() * 9000);
    const group3 = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${group1}-${group2}-${group3}`;
};

// Record Audit Log entry
const recordAuditLog = async (userId, action, ipAddress, details) => {
    try {
        const sql = `INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)`;
        const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
        await query(sql, [userId || null, action, ipAddress || '127.0.0.1', detailsStr || '']);
    } catch (error) {
        console.error('Audit Log Error:', error.message);
    }
};

module.exports = {
    generateReferenceNumber,
    generateAccountNumber,
    generateCardNumber,
    recordAuditLog
};
