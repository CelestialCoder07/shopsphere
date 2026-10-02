const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                name: {
                    type: String,
                    required: true
                },

                // Snapshot of the product at purchase time, so the
                // order stays accurate if the product later changes.
                image: {
                    type: String,
                    default: ""
                },

                price: {
                    type: Number,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                }
            }
        ],

        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },

        // Order fulfillment status
        status: {
            type: String,
            enum: [
                "Pending",
                "Processing",
                "Shipped",
                "Delivered",
                "Cancelled"
            ],
            default: "Pending"
        },

        // Payment status
        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid",
                "Failed"
            ],
            default: "Pending"
        },

        // Collected by Stripe Checkout, saved when payment settles
        shippingAddress: {
            name: { type: String, default: "" },
            phone: { type: String, default: "" },
            line1: { type: String, default: "" },
            line2: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            postalCode: { type: String, default: "" },
            country: { type: String, default: "" }
        },

        customerEmail: {
            type: String,
            default: ""
        },

        // Stripe Checkout Session ID
        stripeSessionId: {
            type: String,
            default: null
        },

        // When Stripe confirms payment
        paidAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// "My orders" and the admin list are both newest-first.
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;