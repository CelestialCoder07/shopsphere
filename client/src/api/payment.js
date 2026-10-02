// =====================================================
// PAYMENT ENDPOINTS
// =====================================================

import { request } from "./client";

/**
 * Creates a Stripe Checkout Session for the given cart.
 * Only product ids and quantities are sent — the server
 * looks up the authoritative prices.
 */
export const createCheckoutSession = async (cartItems) => {
    const items = cartItems.map((item) => ({
        product: item._id,
        quantity: item.quantity
    }));

    return request({
        method: "post",
        url: "/payment/create-checkout-session",
        data: { items }
    });
};

export const verifyPayment = async (sessionId) => {
    return request({
        method: "get",
        url: "/payment/verify",
        params: { sessionId }
    });
};
