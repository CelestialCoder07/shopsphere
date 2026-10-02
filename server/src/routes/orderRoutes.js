const express = require("express");

const {
    createOrder,
    cancelOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus
} = require("../controllers/orderController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Customer
router.post("/", protect, createOrder);

// NOTE: this must be registered before "/:id"
// otherwise "myorders" is parsed as an order id.
router.get("/myorders", protect, getMyOrders);

// Admin
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

// Owner
router.put("/:id/cancel", protect, cancelOrder);

// Owner or admin
router.get("/:id", protect, getOrderById);

module.exports = router;
