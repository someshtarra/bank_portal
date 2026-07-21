const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateCardNumber, recordAuditLog } = require('../utils/helper');

const getCustomerCards = async (req, res, next) => {
    try {
        const customerId = req.user.customer_id;
        const [cards] = await query('SELECT card_id, card_number, card_holder, expiry, type, status, daily_limit, created_at FROM cards WHERE customer_id = ?', [customerId]);
        res.json({ success: true, cards: cards || [] });
    } catch (error) {
        next(error);
    }
};

const requestCard = async (req, res, next) => {
    try {
        const customerId = req.user.customer_id;
        const { type = 'debit' } = req.body;

        const cardNum = generateCardNumber();
        const holderName = `${req.user.first_name} ${req.user.last_name}`.toUpperCase();

        const futureYear = new Date().getFullYear() + 4;
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const expiry = `${month}/${futureYear}`;

        const cvvRaw = Math.floor(100 + Math.random() * 900).toString();
        const salt = await bcrypt.genSalt(10);
        const encryptedCvv = await bcrypt.hash(cvvRaw, salt);

        await query(
            `INSERT INTO cards (customer_id, card_number, card_holder, expiry, cvv, type, status, daily_limit)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [customerId, cardNum, holderName, expiry, encryptedCvv, type, 'active', type === 'credit' ? 150000.00 : 50000.00]
        );

        await recordAuditLog(req.user.id, 'CARD_ISSUED', req.ip, `Issued new ${type} card ${cardNum}`);

        res.status(201).json({
            success: true,
            message: `New ${type.toUpperCase()} Card issued successfully`,
            card: {
                card_number: cardNum,
                card_holder: holderName,
                expiry,
                type,
                status: 'active'
            }
        });
    } catch (error) {
        next(error);
    }
};

const toggleCardStatus = async (req, res, next) => {
    try {
        const cardId = req.params.id;
        const { status } = req.body;

        if (!['active', 'blocked'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be active or blocked' });
        }

        await query('UPDATE cards SET status = ? WHERE card_id = ?', [status, cardId]);
        await recordAuditLog(req.user.id, 'CARD_STATUS_CHANGE', req.ip, `Card ID ${cardId} status set to ${status}`);

        res.json({ success: true, message: `Card has been ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCustomerCards,
    requestCard,
    toggleCardStatus
};
