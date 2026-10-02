const express = require("express");

const {
    createCheckoutSession,
    handleStripeWebhook,
    verifyPayment
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// CREATE CHECKOUT SESSION
// =====================================================

router.post(
    "/create-checkout-session",
    protect,
    createCheckoutSession
);


// =====================================================
// VERIFY PAYMENT
// =====================================================

router.get(
    "/verify",
    protect,
    verifyPayment
);


// =====================================================
// STRIPE WEBHOOK
// =====================================================

router.post(
    "/webhook",
    handleStripeWebhook
);


module.exports = router;