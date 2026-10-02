// =====================================================
// EXPRESS APPLICATION
// =====================================================
// Pure app wiring with no side effects (no listen, no DB
// connect) so it can be imported directly by tests.
// `server.js` is responsible for bootstrapping.

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

// Behind a hosting proxy (Render, Railway, …) the client IP
// arrives in X-Forwarded-For; rate limiting needs the real one.
app.set("trust proxy", 1);

app.use(helmet());

const DEFAULT_CLIENT_URL = "http://localhost:5173";

// =====================================================
// CORS
// =====================================================

const allowedOrigins = (process.env.CLIENT_URL || DEFAULT_CLIENT_URL)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true
    })
);

// =====================================================
// STRIPE WEBHOOK
// =====================================================
// Stripe verifies its signature against the raw body, so this
// has to be registered before express.json() parses anything.

app.use(
    "/api/payment/webhook",
    express.raw({ type: "application/json" })
);

// =====================================================
// BODY PARSING
// =====================================================

app.use(express.json());

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ShopSphere API is running",
        version: "1.0.0"
    });
});

// =====================================================
// ROUTES
// =====================================================

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

// =====================================================
// 404 + ERROR HANDLING
// =====================================================

app.use(notFound);
app.use(errorHandler);

module.exports = app;
