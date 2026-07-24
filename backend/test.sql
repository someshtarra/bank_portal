-- ============================================================
-- Banking Portal Application - Database Schema (MySQL / 3NF)
-- ============================================================

CREATE DATABASE IF NOT EXISTS bank_portal_db;
USE bank_portal_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('customer', 'employee', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    dob DATE NOT NULL,
    aadhaar VARCHAR(12) NOT NULL UNIQUE,
    pan VARCHAR(10) NOT NULL UNIQUE,
    kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    avatar_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_customer_user (user_id),
    INDEX idx_customer_kyc (kyc_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    account_type ENUM('savings', 'checking', 'salary') NOT NULL DEFAULT 'savings',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 1000.00,
    status ENUM('active', 'frozen', 'closed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT chk_min_balance CHECK (balance >= 0),
    INDEX idx_account_number (account_number),
    INDEX idx_account_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    transaction_type ENUM('deposit', 'withdrawal', 'transfer_debit', 'transfer_credit') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    sender_account VARCHAR(20) DEFAULT NULL,
    receiver_account VARCHAR(20) DEFAULT NULL,
    status ENUM('success', 'failed', 'pending') DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
    CONSTRAINT chk_txn_amount CHECK (amount > 0),
    INDEX idx_txn_account (account_id),
    INDEX idx_txn_ref (reference_number),
    INDEX idx_txn_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Loans Table
CREATE TABLE IF NOT EXISTS loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    loan_type VARCHAR(50) NOT NULL DEFAULT 'Personal Loan',
    amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in months',
    status ENUM('pending', 'approved', 'rejected', 'closed') DEFAULT 'pending',
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_loan_customer (customer_id),
    INDEX idx_loan_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Cards Table
CREATE TABLE IF NOT EXISTS cards (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    card_number VARCHAR(19) NOT NULL UNIQUE,
    card_holder VARCHAR(100) NOT NULL,
    expiry VARCHAR(7) NOT NULL COMMENT 'MM/YYYY',
    cvv VARCHAR(255) NOT NULL COMMENT 'Encrypted CVV',
    type ENUM('debit', 'credit') NOT NULL DEFAULT 'debit',
    status ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
    daily_limit DECIMAL(12, 2) DEFAULT 50000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_card_number (card_number),
    INDEX idx_card_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Beneficiaries Table
CREATE TABLE IF NOT EXISTS beneficiaries (
    beneficiary_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    beneficiary_account VARCHAR(20) NOT NULL,
    beneficiary_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) DEFAULT NULL,
    bank_name VARCHAR(100) DEFAULT 'Apex National Bank',
    ifsc_code VARCHAR(11) DEFAULT 'AGNB0001024',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    UNIQUE KEY uk_cust_beneficiary (customer_id, beneficiary_account),
    INDEX idx_beneficiary_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    details TEXT DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Seed Sample Data (Pre-seeded Demo Accounts)
INSERT INTO users (id, first_name, last_name, email, password, phone, role) VALUES
(1, 'System', 'Admin', 'admin@bankportal.com', '$2a$10$H7dBsW7hysy4Lbesap7IHOJHc.Ed7soM/OOKbmNqsIPjTdtg/Jgp.', '+91 9876543210', 'admin'),
(2, 'Sarah', 'Officer', 'employee@bankportal.com', '$2a$10$H7dBsW7hysy4Lbesap7IHOJHc.Ed7soM/OOKbmNqsIPjTdtg/Jgp.', '+91 9876543211', 'employee'),
(3, 'Rajesh', 'Kumar', 'rajesh.kumar@example.com', '$2a$10$H7dBsW7hysy4Lbesap7IHOJHc.Ed7soM/OOKbmNqsIPjTdtg/Jgp.', '+91 9876543212', 'customer'),
(4, 'Priya', 'Sharma', 'priya.sharma@example.com', '$2a$10$H7dBsW7hysy4Lbesap7IHOJHc.Ed7soM/OOKbmNqsIPjTdtg/Jgp.', '+91 9876543213', 'customer'),
(5, 'Amit', 'Verma', 'amit.verma@example.com', '$2a$10$H7dBsW7hysy4Lbesap7IHOJHc.Ed7soM/OOKbmNqsIPjTdtg/Jgp.', '+91 9876543214', 'customer')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO customers (customer_id, user_id, address, dob, aadhaar, pan, kyc_status) VALUES
(1, 3, '123 Park Avenue, MG Road, Bengaluru, KA 560001', '1990-05-15', '123456789012', 'ABCDE1234F', 'verified'),
(2, 4, '456 Cyber City, Sector 29, Gurugram, HR 122002', '1994-08-22', '987654321098', 'FGHIJ5678K', 'verified'),
(3, 5, '789 Jubilee Hills, Hyderabad, TS 500033', '1992-11-10', '456789123045', 'LMNOP9012Q', 'pending')
ON DUPLICATE KEY UPDATE customer_id=customer_id;

INSERT INTO accounts (account_id, customer_id, account_number, account_type, balance, status) VALUES
(1, 1, '100120240001', 'savings', 75000.00, 'active'),
(2, 1, '100120240002', 'checking', 25000.00, 'active'),
(3, 2, '100120240003', 'savings', 120000.00, 'active'),
(4, 3, '100120240004', 'savings', 5000.00, 'active')
ON DUPLICATE KEY UPDATE account_id=account_id;

INSERT INTO transactions (transaction_id, account_id, transaction_type, amount, description, reference_number, sender_account, receiver_account, status) VALUES
(1, 1, 'deposit', 50000.00, 'Initial Salary Credit', 'TXN1000000001', NULL, '100120240001', 'success'),
(2, 1, 'deposit', 30000.00, 'Online Transfer In', 'TXN1000000002', NULL, '100120240001', 'success'),
(3, 1, 'withdrawal', 5000.00, 'ATM Cash Withdrawal', 'TXN1000000003', '100120240001', NULL, 'success'),
(4, 1, 'transfer_debit', 10000.00, 'Transfer to Priya Sharma', 'TXN1000000004', '100120240001', '100120240003', 'success'),
(5, 3, 'transfer_credit', 10000.00, 'Received from Rajesh Kumar', 'TXN1000000004', '100120240001', '100120240003', 'success')
ON DUPLICATE KEY UPDATE transaction_id=transaction_id;

INSERT INTO loans (loan_id, customer_id, loan_type, amount, interest_rate, duration, status) VALUES
(1, 1, 'Personal Loan', 250000.00, 10.50, 24, 'approved'),
(2, 2, 'Home Loan', 1500000.00, 8.25, 120, 'pending')
ON DUPLICATE KEY UPDATE loan_id=loan_id;

INSERT INTO cards (card_id, customer_id, card_number, card_holder, expiry, cvv, type, status, daily_limit) VALUES
(1, 1, '4532-8912-3456-7890', 'RAJESH KUMAR', '12/2028', '$2a$10$H7dBsW7hysy4Lbesap7IHOJHc.Ed7soM/OOKbmNqsIPjTdtg/Jgp.', 'debit', 'active', 50000.00),
(2, 1, '5412-7512-9876-5432', 'RAJESH KUMAR', '08/2029', '$2a$10$H7dBsW7hysy4Lbesap7IHOJHc.Ed7soM/OOKbmNqsIPjTdtg/Jgp.', 'credit', 'active', 150000.00)
ON DUPLICATE KEY UPDATE card_id=card_id;

