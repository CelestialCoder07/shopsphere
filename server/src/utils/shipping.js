// =====================================================
// SHIPPING ADDRESS FROM STRIPE
// =====================================================
// Stripe Checkout collects the address. Newer API versions put
// it under `collected_information.shipping_details`; older ones
// used `shipping_details`. Fall back to the billing address.

const extractShippingAddress = (session) => {
    if (!session) return null;

    const shipping =
        session.collected_information?.shipping_details ||
        session.shipping_details ||
        null;

    const customer = session.customer_details || {};
    const address = shipping?.address || customer.address;

    if (!address) return null;

    return {
        name: shipping?.name || customer.name || "",
        phone: customer.phone || "",
        line1: address.line1 || "",
        line2: address.line2 || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postal_code || "",
        country: address.country || ""
    };
};

module.exports = { extractShippingAddress };
