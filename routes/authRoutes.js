const express = require('express');
const router = express.Router();
const { registerUser, createPayPalOrder, capturePayPalOrder } = require('../controllers/authController');
const { protect } = require('../controllers/authMiddleware');


router.post('/register', registerUser);
router.post('/paypal/order', protect, createPayPalOrder);
router.post('/paypal/capture', protect, capturePayPalOrder);

module.exports = router;


