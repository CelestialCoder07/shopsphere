const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
    startTestServer,
    stopTestServer,
    createUser,
    createProduct,
    Product,
    Order,
    trackOrder
} = require("./helpers/setup");

const { settleOrderAsPaid } = require("../src/controllers/paymentController");
const { extractShippingAddress } = require("../src/utils/shipping");

before(startTestServer);
after(stopTestServer);

const fakeSession = {
    customer_details: { email: "buyer@example.com", phone: "+911234567890", name: "Billing Name" },
    collected_information: {
        shipping_details: {
            name: "Asha Rao",
            address: {
                line1: "12 MG Road",
                line2: "Flat 4",
                city: "Bengaluru",
                state: "KA",
                postal_code: "560001",
                country: "IN"
            }
        }
    }
};

// -----------------------------------------------------
// Settling a payment
// -----------------------------------------------------

describe("settleOrderAsPaid", () => {
    test("is idempotent under concurrent calls (stock decremented once)", async () => {
        const { user } = await createUser();
        const product = await createProduct({ stock: 10 });

        const order = await Order.create({
            user: user._id,
            items: [{ product: product._id, name: product.name, price: product.price, quantity: 3 }],
            totalPrice: product.price * 3
        });
        trackOrder(order._id);

        // Webhook and browser verification arriving together.
        const results = await Promise.all([
            settleOrderAsPaid(order._id, fakeSession),
            settleOrderAsPaid(order._id, fakeSession),
            settleOrderAsPaid(order._id, fakeSession)
        ]);

        assert.equal(results.filter(Boolean).length, 1, "exactly one caller settles");

        const reloaded = await Product.findById(product._id);
        assert.equal(reloaded.stock, 7);

        const paid = await Order.findById(order._id);
        assert.equal(paid.paymentStatus, "Paid");
        assert.equal(paid.shippingAddress.city, "Bengaluru");
        assert.equal(paid.customerEmail, "buyer@example.com");
    });
});

// -----------------------------------------------------
// Shipping address extraction
// -----------------------------------------------------

describe("extractShippingAddress", () => {
    test("reads the current Stripe shape", () => {
        const address = extractShippingAddress(fakeSession);

        assert.equal(address.name, "Asha Rao");
        assert.equal(address.postalCode, "560001");
        assert.equal(address.phone, "+911234567890");
    });

    test("falls back to the legacy shape and billing address", () => {
        const legacy = extractShippingAddress({
            shipping_details: { name: "Old", address: { line1: "1 A St", country: "IN" } }
        });
        assert.equal(legacy.line1, "1 A St");

        const billing = extractShippingAddress({
            customer_details: { name: "Bill", address: { city: "Pune", country: "IN" } }
        });
        assert.equal(billing.city, "Pune");
        assert.equal(billing.name, "Bill");
    });

    test("returns null when there is no address", () => {
        assert.equal(extractShippingAddress({}), null);
        assert.equal(extractShippingAddress(null), null);
    });
});
