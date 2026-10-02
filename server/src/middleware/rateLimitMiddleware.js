const rateLimit = require("express-rate-limit");

// =====================================================
// RATE LIMITING
// =====================================================
// Slows down password guessing on the auth endpoints. The
// test suite logs in dozens of times, so it is exempt.

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const authLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: {
        success: false,
        message: "Too many attempts. Please wait a few minutes and try again."
    }
});

module.exports = { authLimiter };
