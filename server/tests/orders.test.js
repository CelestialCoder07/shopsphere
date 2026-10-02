const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
    request,
    startTestServer,
    stopTestServer,
    createUser,
    createProduct,
    trackOrder,
    Product,
    Order
} = require("./helpers/setup");

before(startTestServer);
after(stopTestServer);

// Creates an order through the API and registers it for cleanup.
const placeOrder = async (token, product, quantity = 1) => {
    const res = await request("POST", "/api/orders", {
        token,
        body: {
            items: [{ product: String(product._id), quantity }]
        }
    });

    if (res.status === 201) {
        trackOrder(res.body.order._id);
    }

    return res;
};

// -----------------------------------------------------
// Create
// -----------------------------------------------------

describe("POST /api/orders", () => {
    test("rejects an anonymous request", async () => {
        const product = await createProduct();

        const res = await request("POST", "/api/orders", {
            body: {
                items: [{ product: String(product._id), quantity: 1 }]
            }
        });

        assert.equal(res.status, 401);
    });

    test("rejects an empty cart", async () => {
        const { token } = await createUser();

        const res = await request("POST", "/api/orders", {
            token,
            body: { items: [] }
        });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
    });

    test("creates an order priced from the database", async () => {
        const { token } = await createUser();
        const product = await createProduct({ price: 250, stock: 5 });

        const res = await placeOrder(token, product, 2);

        assert.equal(res.status, 201);
        assert.equal(res.body.order.totalPrice, 500);
        assert.equal(res.body.order.items[0].price, 250);
        assert.equal(res.body.order.items[0].quantity, 2);
        assert.equal(res.body.order.status, "Pending");
        assert.equal(res.body.order.paymentStatus, "Pending");
    });

    test("ignores a price supplied by the client", async () => {
        const { token } = await createUser();
        const product = await createProduct({ price: 400, stock: 5 });

        const res = await request("POST", "/api/orders", {
            token,
            body: {
                items: [
                    {
                        product: String(product._id),
                        quantity: 1,
                        price: 1
                    }
                ]
            }
        });

        trackOrder(res.body.order._id);

        assert.equal(res.status, 201);
        assert.equal(res.body.order.totalPrice, 400);
    });

    test("rejects a quantity above available stock", async () => {
        const { token } = await createUser();
        const product = await createProduct({ stock: 2 });

        const res = await placeOrder(token, product, 99);

        assert.equal(res.status, 400);
        assert.match(res.body.message, /Not enough stock/);
    });

    test("rejects a zero quantity", async () => {
        const { token } = await createUser();
        const product = await createProduct();

        const res = await placeOrder(token, product, 0);

        assert.equal(res.status, 400);
    });

    test("does not decrement stock before payment settles", async () => {
        const { token } = await createUser();
        const product = await createProduct({ stock: 8 });

        await placeOrder(token, product, 3);

        const reloaded = await Product.findById(product._id);

        assert.equal(reloaded.stock, 8);
    });
});

// -----------------------------------------------------
// Customer order history
// -----------------------------------------------------

describe("GET /api/orders/myorders", () => {
    test("returns only the caller's orders", async () => {
        const { token } = await createUser();
        const product = await createProduct({ stock: 20 });

        await placeOrder(token, product, 1);

        const res = await request("GET", "/api/orders/myorders", {
            token
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.orders));
        assert.ok(res.body.orders.length >= 1);
    });

    test("returns an empty list for a brand new account", async () => {
        const { token } = await createUser();

        const res = await request("GET", "/api/orders/myorders", {
            token
        });

        assert.equal(res.status, 200);
        assert.deepEqual(res.body.orders, []);
    });

    test("rejects an anonymous request", async () => {
        const res = await request("GET", "/api/orders/myorders");

        assert.equal(res.status, 401);
    });
});

// -----------------------------------------------------
// Admin listing
// -----------------------------------------------------

describe("GET /api/orders", () => {
    test("allows an admin to list every order", async () => {
        const { token } = await createUser({ role: "admin" });

        const res = await request("GET", "/api/orders", { token });

        assert.equal(res.status, 200);
        assert.ok(Array.isArray(res.body.orders));
    });

    test("rejects a non-admin user", async () => {
        const { token } = await createUser();

        const res = await request("GET", "/api/orders", { token });

        assert.equal(res.status, 403);
    });
});

// -----------------------------------------------------
// Single order access control
// -----------------------------------------------------

describe("GET /api/orders/:id", () => {
    test("lets the owner read their own order", async () => {
        const { token } = await createUser();
        const product = await createProduct({ stock: 5 });

        const created = await placeOrder(token, product, 1);

        const res = await request(
            "GET",
            `/api/orders/${created.body.order._id}`,
            { token }
        );

        assert.equal(res.status, 200);
        assert.equal(res.body.order._id, created.body.order._id);
    });

    test("refuses a different customer", async () => {
        const owner = await createUser();
        const intruder = await createUser();
        const product = await createProduct({ stock: 5 });

        const created = await placeOrder(owner.token, product, 1);

        const res = await request(
            "GET",
            `/api/orders/${created.body.order._id}`,
            { token: intruder.token }
        );

        assert.equal(res.status, 403);
    });
});

// -----------------------------------------------------
// Status updates
// -----------------------------------------------------

describe("PUT /api/orders/:id/status", () => {
    test("lets an admin advance the status", async () => {
        const { token } = await createUser({ role: "admin" });
        const customer = await createUser();
        const product = await createProduct({ stock: 5 });

        const created = await placeOrder(customer.token, product, 1);

        const res = await request(
            "PUT",
            `/api/orders/${created.body.order._id}/status`,
            { token, body: { status: "Shipped" } }
        );

        assert.equal(res.status, 200);
        assert.equal(res.body.order.status, "Shipped");
    });

    test("rejects an unknown status", async () => {
        const { token } = await createUser({ role: "admin" });
        const customer = await createUser();
        const product = await createProduct({ stock: 5 });

        const created = await placeOrder(customer.token, product, 1);

        const res = await request(
            "PUT",
            `/api/orders/${created.body.order._id}/status`,
            { token, body: { status: "Teleported" } }
        );

        assert.equal(res.status, 400);
    });

    test("rejects a non-admin user", async () => {
        const { token } = await createUser();
        const product = await createProduct({ stock: 5 });

        const created = await placeOrder(token, product, 1);

        const res = await request(
            "PUT",
            `/api/orders/${created.body.order._id}/status`,
            { token, body: { status: "Shipped" } }
        );

        assert.equal(res.status, 403);
    });
});

// -----------------------------------------------------
// Customer cancellation
// -----------------------------------------------------

describe("PUT /api/orders/:id/cancel", () => {
    test("lets the owner cancel an unpaid order", async () => {
        const { token } = await createUser();
        const product = await createProduct({ stock: 5 });

        const created = await placeOrder(token, product, 1);

        const res = await request(
            "PUT",
            `/api/orders/${created.body.order._id}/cancel`,
            { token }
        );

        assert.equal(res.status, 200);
        assert.equal(res.body.order.status, "Cancelled");
    });

    test("refuses to cancel twice", async () => {
        const { token } = await createUser();
        const product = await createProduct({ stock: 5 });

        const created = await placeOrder(token, product, 1);
        const url = `/api/orders/${created.body.order._id}/cancel`;

        await request("PUT", url, { token });
        const res = await request("PUT", url, { token });

        assert.equal(res.status, 400);
    });

    test("refuses to cancel a paid order", async () => {
        const { token } = await createUser();
        const product = await createProduct({ stock: 5 });

        const created = await placeOrder(token, product, 1);

        await Order.updateOne(
            { _id: created.body.order._id },
            { paymentStatus: "Paid" }
        );

        const res = await request(
            "PUT",
            `/api/orders/${created.body.order._id}/cancel`,
            { token }
        );

        assert.equal(res.status, 400);
    });

    test("refuses a different customer", async () => {
        const owner = await createUser();
        const intruder = await createUser();
        const product = await createProduct({ stock: 5 });

        const created = await placeOrder(owner.token, product, 1);

        const res = await request(
            "PUT",
            `/api/orders/${created.body.order._id}/cancel`,
            { token: intruder.token }
        );

        assert.equal(res.status, 403);
    });
});

// -----------------------------------------------------
// Payment verification guards
// -----------------------------------------------------

describe("GET /api/payment/verify", () => {
    test("requires a session id", async () => {
        const { token } = await createUser();

        const res = await request("GET", "/api/payment/verify", {
            token
        });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
    });

    test("requires authentication", async () => {
        const res = await request(
            "GET",
            "/api/payment/verify?sessionId=cs_test_fake"
        );

        assert.equal(res.status, 401);
    });
});
