const express = require('express');
const router = express.Router();
const { getCustomerCards, requestCard, toggleCardStatus } = require('../controllers/cardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my-cards', authorize('customer'), getCustomerCards);
router.post('/request', authorize('customer'), requestCard);
router.put('/:id/toggle-status', authorize('customer', 'admin'), toggleCardStatus);

module.exports = router;
