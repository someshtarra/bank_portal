const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getAccounts,
    getTransactions,
    updatePassword,
    getBeneficiaries,
    addBeneficiary
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(authorize('customer', 'admin', 'employee'));

router.get('/profile', getProfile);
router.put('/profile', upload.single('avatar'), updateProfile);
router.get('/accounts', getAccounts);
router.get('/transactions', getTransactions);
router.put('/update-password', updatePassword);

router.get('/beneficiaries', getBeneficiaries);
router.post('/beneficiaries', addBeneficiary);

module.exports = router;
