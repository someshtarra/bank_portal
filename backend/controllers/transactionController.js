const { query, executeTransaction } = require('../config/db');
const { generateReferenceNumber, recordAuditLog } = require('../utils/helper');
const { sendTransactionNotification } = require('../utils/emailService');

const MINIMUM_BALANCE = 1000.00;

const deposit = async (req, res, next) => {
    try {
        const { account_number, amount, description } = req.body;
        const depositAmount = parseFloat(amount);

        if (isNaN(depositAmount) || depositAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Deposit amount must be a positive number' });
        }

        const [accounts] = await query('SELECT account_id, customer_id, balance, status FROM accounts WHERE account_number = ?', [account_number]);
        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ success: false, message: 'Account number not found' });
        }

        const account = accounts[0];

        if (account.status === 'frozen') {
            return res.status(400).json({ success: false, message: 'Account is frozen. Transactions are disabled.' });
        }

        const refNo = generateReferenceNumber();
        const desc = description || 'Cash / Online Deposit';

        await query('UPDATE accounts SET balance = balance + ? WHERE account_id = ?', [depositAmount, account.account_id]);

        await query(
            `INSERT INTO transactions (account_id, transaction_type, amount, description, reference_number, receiver_account, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [account.account_id, 'deposit', depositAmount, desc, refNo, account_number, 'success']
        );

        const [updatedAccounts] = await query('SELECT balance FROM accounts WHERE account_id = ?', [account.account_id]);
        const newBalance = updatedAccounts[0].balance;

        await recordAuditLog(req.user.id, 'DEPOSIT_SUCCESS', req.ip, `Deposited ₹${depositAmount} into account ${account_number}`);

        const [users] = await query('SELECT u.email, u.first_name FROM users u JOIN customers c ON u.id = c.user_id WHERE c.customer_id = ?', [account.customer_id]);
        if (users && users.length > 0) {
            sendTransactionNotification(users[0].email, users[0].first_name, {
                transaction_type: 'deposit',
                amount: depositAmount,
                reference_number: refNo,
                description: desc
            });
        }

        res.json({
            success: true,
            message: `Successfully deposited ₹${depositAmount}`,
            reference_number: refNo,
            account_number,
            new_balance: newBalance
        });
    } catch (error) {
        next(error);
    }
};

const withdraw = async (req, res, next) => {
    try {
        const { account_number, amount, description } = req.body;
        const withdrawAmount = parseFloat(amount);

        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Withdrawal amount must be a positive number' });
        }

        const [accounts] = await query('SELECT account_id, customer_id, balance, status FROM accounts WHERE account_number = ?', [account_number]);
        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ success: false, message: 'Account number not found' });
        }

        const account = accounts[0];

        if (account.status === 'frozen') {
            return res.status(400).json({ success: false, message: 'Account is frozen. Transactions are disabled.' });
        }

        const currentBalance = parseFloat(account.balance);
        if (currentBalance - withdrawAmount < MINIMUM_BALANCE) {
            return res.status(400).json({
                success: false,
                message: `Insufficient funds. Minimum required balance is ₹${MINIMUM_BALANCE}. Your current balance is ₹${currentBalance}. Maximum withdrawable amount is ₹${Math.max(0, currentBalance - MINIMUM_BALANCE)}.`
            });
        }

        const refNo = generateReferenceNumber();
        const desc = description || 'Cash Withdrawal';

        const [updateResult] = await query(
            'UPDATE accounts SET balance = balance - ? WHERE account_id = ? AND balance - ? >= ?',
            [withdrawAmount, account.account_id, withdrawAmount, MINIMUM_BALANCE]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Withdrawal failed due to insufficient available balance.' });
        }

        await query(
            `INSERT INTO transactions (account_id, transaction_type, amount, description, reference_number, sender_account, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [account.account_id, 'withdrawal', withdrawAmount, desc, refNo, account_number, 'success']
        );

        const [updatedAccounts] = await query('SELECT balance FROM accounts WHERE account_id = ?', [account.account_id]);
        const newBalance = updatedAccounts[0].balance;

        await recordAuditLog(req.user.id, 'WITHDRAWAL_SUCCESS', req.ip, `Withdrew ₹${withdrawAmount} from account ${account_number}`);

        const [users] = await query('SELECT u.email, u.first_name FROM users u JOIN customers c ON u.id = c.user_id WHERE c.customer_id = ?', [account.customer_id]);
        if (users && users.length > 0) {
            sendTransactionNotification(users[0].email, users[0].first_name, {
                transaction_type: 'withdrawal',
                amount: withdrawAmount,
                reference_number: refNo,
                description: desc
            });
        }

        res.json({
            success: true,
            message: `Successfully withdrew ₹${withdrawAmount}`,
            reference_number: refNo,
            account_number,
            new_balance: newBalance
        });
    } catch (error) {
        next(error);
    }
};

const transfer = async (req, res, next) => {
    try {
        const { sender_account, receiver_account, amount, description } = req.body;
        const transferAmount = parseFloat(amount);

        if (isNaN(transferAmount) || transferAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Transfer amount must be greater than zero' });
        }

        if (sender_account === receiver_account) {
            return res.status(400).json({ success: false, message: 'Sender and receiver accounts cannot be identical' });
        }

        const [senders] = await query('SELECT account_id, customer_id, balance, status FROM accounts WHERE account_number = ?', [sender_account]);
        if (!senders || senders.length === 0) {
            return res.status(404).json({ success: false, message: 'Sender account number not found' });
        }
        const sender = senders[0];

        if (sender.status === 'frozen') {
            return res.status(400).json({ success: false, message: 'Sender account is frozen.' });
        }

        const [receivers] = await query('SELECT account_id, customer_id, balance, status FROM accounts WHERE account_number = ?', [receiver_account]);
        if (!receivers || receivers.length === 0) {
            return res.status(404).json({ success: false, message: 'Receiver account number not found' });
        }
        const receiver = receivers[0];

        if (receiver.status === 'frozen') {
            return res.status(400).json({ success: false, message: 'Receiver account is frozen.' });
        }

        const senderBalance = parseFloat(sender.balance);
        if (senderBalance - transferAmount < MINIMUM_BALANCE) {
            return res.status(400).json({
                success: false,
                message: `Transfer rejected. Minimum required balance is ₹${MINIMUM_BALANCE}. Current balance: ₹${senderBalance}. Max transferrable amount: ₹${Math.max(0, senderBalance - MINIMUM_BALANCE)}.`
            });
        }

        const refNo = generateReferenceNumber();
        const desc = description || `Fund transfer to ${receiver_account}`;

        await query('UPDATE accounts SET balance = balance - ? WHERE account_id = ?', [transferAmount, sender.account_id]);
        await query('UPDATE accounts SET balance = balance + ? WHERE account_id = ?', [transferAmount, receiver.account_id]);

        await query(
            `INSERT INTO transactions (account_id, transaction_type, amount, description, reference_number, sender_account, receiver_account, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [sender.account_id, 'transfer_debit', transferAmount, `Transfer to Acc ${receiver_account} - ${desc}`, refNo, sender_account, receiver_account, 'success']
        );

        await query(
            `INSERT INTO transactions (account_id, transaction_type, amount, description, reference_number, sender_account, receiver_account, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [receiver.account_id, 'transfer_credit', transferAmount, `Received from Acc ${sender_account} - ${desc}`, refNo, sender_account, receiver_account, 'success']
        );

        const [updatedSenders] = await query('SELECT balance FROM accounts WHERE account_id = ?', [sender.account_id]);

        await recordAuditLog(req.user.id, 'TRANSFER_SUCCESS', req.ip, `Transferred ₹${transferAmount} from ${sender_account} to ${receiver_account}`);

        res.json({
            success: true,
            message: `Successfully transferred ₹${transferAmount} to Account ${receiver_account}`,
            reference_number: refNo,
            sender_account,
            receiver_account,
            new_balance: updatedSenders[0].balance
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    deposit,
    withdraw,
    transfer
};
