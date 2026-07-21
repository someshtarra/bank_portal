-- ============================================================
-- Banking Portal Application - Seed Data
-- Demo passwords for all accounts: Password@123
-- ============================================================

USE bank_portal_db;

-- 1. Insert Users (Admin, Employee, Customers)
INSERT INTO users (id, first_name, last_name, email, password, phone, role) VALUES
(1, 'System', 'Admin', 'admin@bankportal.com', '$2b$10$e74Vjly/jE99Y0gN0u.aVu.9V0Tz2J77YV/Xl/q2gM2A1N3E4P5S6', '+91 9876543210', 'admin'),
(2, 'Sarah', 'Officer', 'employee@bankportal.com', '$2b$10$e74Vjly/jE99Y0gN0u.aVu.9V0Tz2J77YV/Xl/q2gM2A1N3E4P5S6', '+91 9876543211', 'employee'),
(3, 'Rajesh', 'Kumar', 'rajesh.kumar@example.com', '$2b$10$e74Vjly/jE99Y0gN0u.aVu.9V0Tz2J77YV/Xl/q2gM2A1N3E4P5S6', '+91 9876543212', 'customer'),
(4, 'Priya', 'Sharma', 'priya.sharma@example.com', '$2b$10$e74Vjly/jE99Y0gN0u.aVu.9V0Tz2J77YV/Xl/q2gM2A1N3E4P5S6', '+91 9876543213', 'customer'),
(5, 'Amit', 'Verma', 'amit.verma@example.com', '$2b$10$e74Vjly/jE99Y0gN0u.aVu.9V0Tz2J77YV/Xl/q2gM2A1N3E4P5S6', '+91 9876543214', 'customer')
ON DUPLICATE KEY UPDATE id=id;

-- 2. Insert Customers
INSERT INTO customers (customer_id, user_id, address, dob, aadhaar, pan, kyc_status) VALUES
(1, 3, '123 Park Avenue, MG Road, Bengaluru, KA 560001', '1990-05-15', '123456789012', 'ABCDE1234F', 'verified'),
(2, 4, '456 Cyber City, Sector 29, Gurugram, HR 122002', '1994-08-22', '987654321098', 'FGHIJ5678K', 'verified'),
(3, 5, '789 Jubilee Hills, Hyderabad, TS 500033', '1992-11-10', '456789123045', 'LMNOP9012Q', 'pending')
ON DUPLICATE KEY UPDATE customer_id=customer_id;

-- 3. Insert Accounts
INSERT INTO accounts (account_id, customer_id, account_number, account_type, balance, status) VALUES
(1, 1, '100120240001', 'savings', 75000.00, 'active'),
(2, 1, '100120240002', 'checking', 25000.00, 'active'),
(3, 2, '100120240003', 'savings', 120000.00, 'active'),
(4, 3, '100120240004', 'savings', 5000.00, 'active')
ON DUPLICATE KEY UPDATE account_id=account_id;

-- 4. Insert Transactions
INSERT INTO transactions (transaction_id, account_id, transaction_type, amount, description, reference_number, sender_account, receiver_account, status, created_at) VALUES
(1, 1, 'deposit', 50000.00, 'Initial Salary Credit', 'TXN1000000001', NULL, '100120240001', 'success', '2026-07-01 10:00:00'),
(2, 1, 'deposit', 30000.00, 'Online Transfer In', 'TXN1000000002', NULL, '100120240001', 'success', '2026-07-05 14:30:00'),
(3, 1, 'withdrawal', 5000.00, 'ATM Cash Withdrawal', 'TXN1000000003', '100120240001', NULL, 'success', '2026-07-10 16:15:00'),
(4, 1, 'transfer_debit', 10000.00, 'Transfer to Priya Sharma', 'TXN1000000004', '100120240001', '100120240003', 'success', '2026-07-15 11:20:00'),
(5, 3, 'transfer_credit', 10000.00, 'Received from Rajesh Kumar', 'TXN1000000004', '100120240001', '100120240003', 'success', '2026-07-15 11:20:00')
ON DUPLICATE KEY UPDATE transaction_id=transaction_id;

-- 5. Insert Loans
INSERT INTO loans (loan_id, customer_id, loan_type, amount, interest_rate, duration, status, applied_date) VALUES
(1, 1, 'Personal Loan', 250000.00, 10.50, 24, 'approved', '2026-06-01 00:00:00'),
(2, 2, 'Home Loan', 1500000.00, 8.25, 120, 'pending', '2026-07-10 00:00:00')
ON DUPLICATE KEY UPDATE loan_id=loan_id;

-- 6. Insert Cards
INSERT INTO cards (card_id, customer_id, card_number, card_holder, expiry, cvv, type, status, daily_limit) VALUES
(1, 1, '4532-8912-3456-7890', 'RAJESH KUMAR', '12/2028', '$2b$10$w857g0Tj9pQ5b.A6o3N42.S5KjA..k.M4w3J7/9a1/F.b9H5C2p2y', 'debit', 'active', 50000.00),
(2, 1, '5412-7512-9876-5432', 'RAJESH KUMAR', '08/2029', '$2b$10$w857g0Tj9pQ5b.A6o3N42.S5KjA..k.M4w3J7/9a1/F.b9H5C2p2y', 'credit', 'active', 150000.00)
ON DUPLICATE KEY UPDATE card_id=card_id;

-- 7. Insert Beneficiaries
INSERT INTO beneficiaries (beneficiary_id, customer_id, beneficiary_account, beneficiary_name, nickname) VALUES
(1, 1, '100120240003', 'Priya Sharma', 'Priya')
ON DUPLICATE KEY UPDATE beneficiary_id=beneficiary_id;

-- 8. Insert Audit Logs
INSERT INTO audit_logs (log_id, user_id, action, ip_address, details) VALUES
(1, 1, 'SYSTEM_INITIALIZATION', '127.0.0.1', 'Seed data loaded successfully')
ON DUPLICATE KEY UPDATE log_id=log_id;
