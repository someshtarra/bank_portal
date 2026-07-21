const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

let pool = null;
let sqliteDb = null;
let isSqliteFallback = false;

// Initialize Database connection pool with SQLite fallback
const initDB = async () => {
    if (process.env.NODE_ENV === 'test' || process.env.USE_SQLITE === 'true') {
        return setupSqliteFallback();
    }

    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'rootpassword',
            database: process.env.DB_NAME || 'bank_portal_db',
            waitForConnections: true,
            connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
            queueLimit: 0
        });

        const connection = await pool.getConnection();
        console.log('✅ MySQL Database connected successfully.');
        connection.release();
        return pool;
    } catch (err) {
        console.warn('⚠️  MySQL connection failed:', err.message);
        console.log('🔄 Falling back to embedded in-memory database for seamless local execution...');
        return await setupSqliteFallback();
    }
};

// SQLite in-memory setup with synchronous seed
const setupSqliteFallback = () => {
    return new Promise((resolve, reject) => {
        isSqliteFallback = true;
        sqliteDb = new sqlite3.Database(':memory:', (err) => {
            if (err) return reject(err);

            const hashedPassword = bcrypt.hashSync('Password@123', 10);

            sqliteDb.serialize(() => {
                sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'customer',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                sqliteDb.run(`CREATE TABLE IF NOT EXISTS customers (
                    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    address TEXT NOT NULL,
                    dob TEXT NOT NULL,
                    aadhaar TEXT NOT NULL UNIQUE,
                    pan TEXT NOT NULL UNIQUE,
                    kyc_status TEXT DEFAULT 'pending',
                    avatar_url TEXT DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                sqliteDb.run(`CREATE TABLE IF NOT EXISTS accounts (
                    account_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    account_number TEXT NOT NULL UNIQUE,
                    account_type TEXT NOT NULL DEFAULT 'savings',
                    balance REAL NOT NULL DEFAULT 1000.00,
                    status TEXT NOT NULL DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                sqliteDb.run(`CREATE TABLE IF NOT EXISTS transactions (
                    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id INTEGER NOT NULL,
                    transaction_type TEXT NOT NULL,
                    amount REAL NOT NULL,
                    description TEXT NOT NULL,
                    reference_number TEXT NOT NULL UNIQUE,
                    sender_account TEXT DEFAULT NULL,
                    receiver_account TEXT DEFAULT NULL,
                    status TEXT DEFAULT 'success',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                sqliteDb.run(`CREATE TABLE IF NOT EXISTS loans (
                    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    loan_type TEXT NOT NULL DEFAULT 'Personal Loan',
                    amount REAL NOT NULL,
                    interest_rate REAL NOT NULL,
                    duration INTEGER NOT NULL,
                    status TEXT DEFAULT 'pending',
                    applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    approved_date DATETIME DEFAULT NULL
                )`);

                sqliteDb.run(`CREATE TABLE IF NOT EXISTS cards (
                    card_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    card_number TEXT NOT NULL UNIQUE,
                    card_holder TEXT NOT NULL,
                    expiry TEXT NOT NULL,
                    cvv TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'debit',
                    status TEXT NOT NULL DEFAULT 'active',
                    daily_limit REAL DEFAULT 50000.00,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                sqliteDb.run(`CREATE TABLE IF NOT EXISTS beneficiaries (
                    beneficiary_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    beneficiary_account TEXT NOT NULL,
                    beneficiary_name TEXT NOT NULL,
                    nickname TEXT DEFAULT NULL,
                    bank_name TEXT DEFAULT 'Antigravity National Bank',
                    ifsc_code TEXT DEFAULT 'AGNB0001024',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                sqliteDb.run(`CREATE TABLE IF NOT EXISTS audit_logs (
                    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER DEFAULT NULL,
                    action TEXT NOT NULL,
                    ip_address TEXT DEFAULT NULL,
                    details TEXT DEFAULT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Insert seed rows
                sqliteDb.run(`INSERT OR IGNORE INTO users (id, first_name, last_name, email, password, phone, role) VALUES
                    (1, 'System', 'Admin', 'admin@bankportal.com', '${hashedPassword}', '+91 9876543210', 'admin'),
                    (2, 'Sarah', 'Officer', 'employee@bankportal.com', '${hashedPassword}', '+91 9876543211', 'employee'),
                    (3, 'Rajesh', 'Kumar', 'rajesh.kumar@example.com', '${hashedPassword}', '+91 9876543212', 'customer'),
                    (4, 'Priya', 'Sharma', 'priya.sharma@example.com', '${hashedPassword}', '+91 9876543213', 'customer'),
                    (5, 'Amit', 'Verma', 'amit.verma@example.com', '${hashedPassword}', '+91 9876543214', 'customer')`);

                sqliteDb.run(`INSERT OR IGNORE INTO customers (customer_id, user_id, address, dob, aadhaar, pan, kyc_status) VALUES
                    (1, 3, '123 Park Avenue, MG Road, Bengaluru, KA 560001', '1990-05-15', '123456789012', 'ABCDE1234F', 'verified'),
                    (2, 4, '456 Cyber City, Sector 29, Gurugram, HR 122002', '1994-08-22', '987654321098', 'FGHIJ5678K', 'verified'),
                    (3, 5, '789 Jubilee Hills, Hyderabad, TS 500033', '1992-11-10', '456789123045', 'LMNOP9012Q', 'pending')`);

                sqliteDb.run(`INSERT OR IGNORE INTO accounts (account_id, customer_id, account_number, account_type, balance, status) VALUES
                    (1, 1, '100120240001', 'savings', 75000.00, 'active'),
                    (2, 1, '100120240002', 'checking', 25000.00, 'active'),
                    (3, 2, '100120240003', 'savings', 120000.00, 'active'),
                    (4, 3, '100120240004', 'savings', 5000.00, 'active')`);

                sqliteDb.run(`INSERT OR IGNORE INTO transactions (transaction_id, account_id, transaction_type, amount, description, reference_number, sender_account, receiver_account, status) VALUES
                    (1, 1, 'deposit', 50000.00, 'Initial Salary Credit', 'TXN1000000001', NULL, '100120240001', 'success'),
                    (2, 1, 'deposit', 30000.00, 'Online Transfer In', 'TXN1000000002', NULL, '100120240001', 'success'),
                    (3, 1, 'withdrawal', 5000.00, 'ATM Cash Withdrawal', 'TXN1000000003', '100120240001', NULL, 'success'),
                    (4, 1, 'transfer_debit', 10000.00, 'Transfer to Priya Sharma', 'TXN1000000004', '100120240001', '100120240003', 'success'),
                    (5, 3, 'transfer_credit', 10000.00, 'Received from Rajesh Kumar', 'TXN1000000004', '100120240001', '100120240003', 'success')`);

                sqliteDb.run(`INSERT OR IGNORE INTO loans (loan_id, customer_id, loan_type, amount, interest_rate, duration, status) VALUES
                    (1, 1, 'Personal Loan', 250000.00, 10.50, 24, 'approved'),
                    (2, 2, 'Home Loan', 1500000.00, 8.25, 120, 'pending')`);

                sqliteDb.run(`INSERT OR IGNORE INTO cards (card_id, customer_id, card_number, card_holder, expiry, cvv, type, status, daily_limit) VALUES
                    (1, 1, '4532-8912-3456-7890', 'RAJESH KUMAR', '12/2028', '${hashedPassword}', 'debit', 'active', 50000.00),
                    (2, 1, '5412-7512-9876-5432', 'RAJESH KUMAR', '08/2029', '${hashedPassword}', 'credit', 'active', 150000.00)`);

                sqliteDb.run(`INSERT OR IGNORE INTO audit_logs (log_id, user_id, action, ip_address, details) VALUES
                    (1, 1, 'SYSTEM_INITIALIZATION', '127.0.0.1', 'In-memory database seeded successfully')`, () => {
                    resolve();
                });
            });
        });
    });
};

const query = async (sql, params = []) => {
    if (!pool && !isSqliteFallback) {
        await initDB();
    }

    if (isSqliteFallback) {
        return new Promise((resolve, reject) => {
            let modifiedSql = sql.replace(/ON DUPLICATE KEY UPDATE/gi, '--');

            if (modifiedSql.trim().toUpperCase().startsWith('SELECT')) {
                sqliteDb.all(modifiedSql, params, (err, rows) => {
                    if (err) return reject(err);
                    resolve([rows]);
                });
            } else {
                sqliteDb.run(modifiedSql, params, function (err) {
                    if (err) return reject(err);
                    resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
                });
            }
        });
    }

    try {
        const [results] = await pool.query(sql, params);
        return [results];
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

const executeTransaction = async (callback) => {
    if (isSqliteFallback) {
        return new Promise((resolve, reject) => {
            sqliteDb.serialize(async () => {
                try {
                    sqliteDb.run('BEGIN TRANSACTION');
                    const result = await callback({ query });
                    sqliteDb.run('COMMIT');
                    resolve(result);
                } catch (err) {
                    sqliteDb.run('ROLLBACK');
                    reject(err);
                }
            });
        });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const customQuery = async (sql, params) => {
            const [rows] = await connection.query(sql, params);
            return [rows];
        };
        const result = await callback({ query: customQuery });
        await connection.commit();
        return result;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    initDB,
    query,
    executeTransaction
};
