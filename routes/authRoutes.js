const express = require('express');
const router = express.Router();

const { 
    registerUser, 
    createPayPalOrder, 
    capturePayPalOrder,
    forgotPassword
} = require('../controllers/authController');

const { protect } = require('../controllers/authMiddleware');

// Inscription
router.post('/register', registerUser);

// PayPal
router.post('/paypal/order', protect, createPayPalOrder);
router.post('/paypal/capture', protect, capturePayPalOrder);

// Mot de passe oublié
router.post('/forgot-password', forgotPassword);

module.exports = router;



