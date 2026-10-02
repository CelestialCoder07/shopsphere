const stripe = require("../config/stripe");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { resolveCartItems } = require("../utils/cart");
const { extractShippingAddress } = require("../utils/shipping");

const CURRENCY = "inr";
// CLIENT_URL may list several origins for CORS; Stripe redirects
// go to the first one.
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");

// =====================================================
// HELPERS
// =====================================================

// Prices are stored in rupees; Stripe wants the
// smallest currency unit (paise), so multiply by 100.
const toStripeAmount = (rupees) => Math.round(rupees * 100);

const buildLineItems = (items) => {
    return items.map((item) => ({
        price_data: {
            currency: CURRENCY,
            product_data: {
                name: item.name,
                // Stripe only accepts absolute https image URLs.
                ...(item.image?.startsWith("https://") ? { images: [item.image] } : {})
            },
            unit_amount: toStripeAmount(item.price)
        },
        quantity: item.quantity
    }));
};

// Decrement stock for every line item. Runs at most once per
// order because the caller guards on paymentStatus.
const decrementStock = async (items) => {
    for (const item of items) {
        const updated = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { returnDocument: "after" }
        );

        if (!updated) {
            console.error(
                "Stock could not be decremented for product:",
                String(item.product)
            );
        }
    }
};

// Mark an order paid exactly once. The webhook and the browser's
// verify call can arrive at the same moment, so the transition is
// a single atomic conditional update: only the caller that flips
// Pending → Paid gets the document back and decrements stock.
const settleOrderAsPaid = async (orderId, session) => {
    const update = {
        paymentStatus: "Paid",
        paidAt: new Date()
    };

    const shippingAddress = extractShippingAddress(session);
    if (shippingAddress) update.shippingAddress = shippingAddress;

    const email = session?.customer_details?.email;
    if (email) update.customerEmail = email;

    const order = await Order.findOneAndUpdate(
        { _id: orderId, paymentStatus: { $ne: "Paid" } },
        { $set: update },
        { returnDocument: "after" }
    );

    if (!order) {
        return null;
    }

    await decrementStock(order.items);

    return order;
};

// =====================================================
// POST /api/payment/create-checkout-session
// @access Private
// =====================================================

const createCheckoutSession = async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Your cart is empty"
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
        totalPrice: total,
        status: "Pending",
        paymentStatus: "Pending"
    });

    const customer = await User.findById(req.user.id).select("email");

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: buildLineItems(resolvedItems),
        mode: "payment",
        customer_email: customer?.email,
        shipping_address_collection: { allowed_countries: ["IN"] },
        phone_number_collection: { enabled: true },
        success_url:
            `${CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT_URL}/cart`,
        metadata: {
            orderId: order._id.toString(),
            userId: String(req.user.id)
        }
    });

    order.stripeSessionId = session.id;
    await order.save();

    res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url
    });
};

// =====================================================
// POST /api/payment/webhook
// @access Public (verified by Stripe signature)
// =====================================================

const handleStripeWebhook = async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
        return res.status(400).json({
            success: false,
            message: "Missing Stripe signature"
        });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Stripe webhook signature error:", error.message);

        return res.status(400).json({
            success: false,
            message: `Webhook Error: ${error.message}`
        });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
            console.error("No orderId found in Stripe metadata");

            return res.status(400).json({
                success: false,
                message: "Order ID missing from session metadata"
            });
        }

        if (!(await Order.exists({ _id: orderId }))) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // "completed" means the checkout finished; with delayed
        // payment methods the money may not have moved yet.
        const settled = session.payment_status === "paid"
            ? await settleOrderAsPaid(orderId, session)
            : null;

        console.log(
            settled
                ? `Payment confirmed for order ${orderId}`
                : `Order ${orderId} not settled (already paid or payment pending)`
        );
    }

    // An abandoned checkout times out (24h by default): retire
    // the order so it stops showing as awaiting payment.
    if (event.type === "checkout.session.expired") {
        const orderId = event.data.object.metadata?.orderId;
        const order = orderId ? await Order.findById(orderId) : null;

        if (order && order.paymentStatus !== "Paid" && order.status === "Pending") {
            order.status = "Cancelled";
            order.paymentStatus = "Failed";
            await order.save();
        }
    }

    res.json({ received: true });
};

// =====================================================
// GET /api/payment/verify?sessionId=...
// @access Private
// =====================================================

const verifyPayment = async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: "Session ID is required"
        });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;

    let order = orderId ? await Order.findById(orderId) : null;

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    // An order may only be read by the account that placed it.
    if (String(order.user) !== String(req.user.id)) {
        return res.status(403).json({
            success: false,
            message: "This order does not belong to your account"
        });
    }

    // Local development has no public URL for Stripe to POST the
    // webhook to, so reconcile here when Stripe already has the money.
    if (session.payment_status === "paid" && order.paymentStatus !== "Paid") {
        order = (await settleOrderAsPaid(order._id, session)) ||
            (await Order.findById(order._id));
    }

    res.status(200).json({
        success: true,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        orderId: order._id
    });
};

module.exports = {
    createCheckoutSession,
    handleStripeWebhook,
    verifyPayment,
    // Exported for the concurrency test.
    settleOrderAsPaid
};
