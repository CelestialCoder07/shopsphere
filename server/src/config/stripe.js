const Stripe = require("stripe");

// =====================================================
// STRIPE CLIENT
// =====================================================
// Constructed once and shared. Fail loudly and early if the
// key is missing rather than throwing deep inside a request.

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
    throw new Error(
        "STRIPE_SECRET_KEY is missing. Copy server/.env.example " +
        "to server/.env and set it."
    );
}

// No explicit apiVersion: use whatever version this SDK
// release pins, so upgrades never desync the two.
const stripe = new Stripe(secretKey);

module.exports = stripe;
