const stripe = require("../config/stripe");
const Order = require("../models/Order");
const { resolveCartItems } = require("../utils/cart");

const ORDER_STATUSES = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
];

// =====================================================
// POST /api/orders
// @access Private
// =====================================================
// Creates an unpaid order. Stock is deliberately NOT touched
// here — it is decremented once, when payment settles.

const createOrder = async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No order items provided"
        });
    }

    const { items: resolvedItems, total, error } =
        await resolveCartItems(items);

    if (error) {
        return res.status(400).json({
            success: false,
            message: error
        });
    }

    const order = await Order.create({
        user: req.user.id,
        items: resolvedItems,
        totalPrice: total
    });

    res.status(201).json({
        success: true,
        order
    });
};

// =====================================================
// GET /api/orders/myorders
// @access Private
// =====================================================

const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user.id })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: orders.length,
        orders
    });
};

// =====================================================
// GET /api/orders
// @access Private/Admin
// =====================================================

const getAllOrders = async (req, res) => {
    const orders = await Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: orders.length,
        orders
    });
};

// =====================================================
// GET /api/orders/:id
// @access Private (owner or admin)
// =====================================================

const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    const isOwner = String(order.user?._id || order.user) ===
        String(req.user.id);

    if (!isOwner && req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "This order does not belong to your account"
        });
    }

    res.status(200).json({
        success: true,
        order
    });
};

// =====================================================
// PUT /api/orders/:id/status
// @access Private/Admin
// =====================================================

const updateOrderStatus = async (req, res) => {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status must be one of: ${ORDER_STATUSES.join(", ")}`
        });
    }

    const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { returnDocument: "after", runValidators: true }
    );

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    res.status(200).json({
        success: true,
        order
    });
};

// =====================================================
// PUT /api/orders/:id/cancel
// @access Private (owner)
// =====================================================
// Lets a customer drop an order they never paid for, e.g. one
// left behind by an abandoned Stripe checkout.

const cancelOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    if (String(order.user) !== String(req.user.id)) {
        return res.status(403).json({
            success: false,
            message: "This order does not belong to your account"
        });
    }

    if (order.paymentStatus === "Paid" || order.status !== "Pending") {
        return res.status(400).json({
            success: false,
            message: "Only unpaid, pending orders can be cancelled"
        });
    }

    // Close the Stripe checkout so it can no longer be paid. If
    // Stripe says it is already complete, the money is in flight
    // and the webhook will settle it, so refuse to cancel.
    if (order.stripeSessionId) {
        try {
            await stripe.checkout.sessions.expire(order.stripeSessionId);
        } catch (error) {
            const session = await stripe.checkout.sessions
                .retrieve(order.stripeSessionId)
                .catch(() => null);

            if (!session || session.status === "complete") {
                return res.status(409).json({
                    success: false,
                    message: "This order has already been paid and can't be cancelled"
                });
            }
        }
    }

    order.status = "Cancelled";
    await order.save();

    res.status(200).json({
        success: true,
        order
    });
};

module.exports = {
    createOrder,
    cancelOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus
};
