const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const {
    request,
    startTestServer,
    stopTestServer,
    createUser,
    createProduct,
    runId,
    Product
} = require("./helpers/setup");

before(startTestServer);
after(stopTestServer);

const MISSING_ID = () => new mongoose.Types.ObjectId().toString();

// -----------------------------------------------------
// Listing
// -----------------------------------------------------

describe("GET /api/products", () => {
    test("returns a paginated envelope", async () => {
        await createProduct();

        const res = await request("GET", "/api/products");

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.products));
        assert.equal(typeof res.body.total, "number");
        assert.equal(res.body.page, 1);
    });

    test("filters by search term", async () => {
        const marker = `Zebra${runId}`;

        await createProduct({ name: `${marker} Sneaker` });

        const res = await request(
            "GET",
            `/api/products?search=${marker}`
        );

        assert.equal(res.status, 200);
        assert.ok(res.body.products.length >= 1);
        assert.ok(
            res.body.products.every((p) => p.name.includes(marker))
        );
    });

    test("treats regex characters in search as literals", async () => {
        const res = await request(
            "GET",
            "/api/products?search=.*"
        );

        assert.equal(res.status, 200);
        assert.equal(res.body.total, 0);
    });

    test("filters by category", async () => {
        await createProduct({ category: "Shoes" });

        const res = await request(
            "GET",
            "/api/products?category=Shoes"
        );

        assert.equal(res.status, 200);
        assert.ok(
            res.body.products.every((p) => p.category === "Shoes")
        );
    });

    test("sorts by price ascending", async () => {
        const res = await request(
            "GET",
            "/api/products?sort=price-asc&limit=60"
        );

        const prices = res.body.products.map((p) => p.price);

        assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
    });

    test("caps the page size", async () => {
        const res = await request(
            "GET",
            "/api/products?limit=9999"
        );

        assert.equal(res.status, 200);
        assert.ok(res.body.products.length <= 60);
    });
});

// -----------------------------------------------------
// Single product
// -----------------------------------------------------

describe("GET /api/products/:id", () => {
    test("returns the product nested under `product`", async () => {
        const created = await createProduct();

        const res = await request(
            "GET",
            `/api/products/${created._id}`
        );

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.product._id, String(created._id));
        assert.equal(res.body.product.name, created.name);
    });

    test("returns 404 for a well-formed but unknown id", async () => {
        const res = await request(
            "GET",
            `/api/products/${MISSING_ID()}`
        );

        assert.equal(res.status, 404);
        assert.equal(res.body.success, false);
    });

    test("returns 400 for a malformed id", async () => {
        const res = await request("GET", "/api/products/not-an-id");

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
    });
});

// -----------------------------------------------------
// Create
// -----------------------------------------------------

describe("POST /api/products", () => {
    test("rejects an anonymous request", async () => {
        const res = await request("POST", "/api/products", {
            body: {
                name: "Anon",
                description: "nope",
                price: 10,
                category: "Shoes",
                stock: 1
            }
        });

        assert.equal(res.status, 401);
    });

    test("rejects a non-admin user", async () => {
        const { token } = await createUser();

        const res = await request("POST", "/api/products", {
            token,
            body: {
                name: "Not Allowed",
                description: "nope",
                price: 10,
                category: "Shoes",
                stock: 1
            }
        });

        assert.equal(res.status, 403);
        assert.equal(res.body.success, false);
    });

    test("creates a product as admin", async () => {
        const { token } = await createUser({ role: "admin" });

        const res = await request("POST", "/api/products", {
            token,
            body: {
                name: "Admin Made",
                description: "Created through the API",
                price: 1299,
                category: "Accessories",
                image: "",
                stock: 7
            }
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.product.price, 1299);

        await Product.deleteOne({ _id: res.body.product._id });
    });

    test("rejects a negative price", async () => {
        const { token } = await createUser({ role: "admin" });

        const res = await request("POST", "/api/products", {
            token,
            body: {
                name: "Bad Price",
                description: "nope",
                price: -5,
                category: "Shoes",
                stock: 1
            }
        });

        assert.equal(res.status, 400);
    });

    test("rejects a missing required field", async () => {
        const { token } = await createUser({ role: "admin" });

        const res = await request("POST", "/api/products", {
            token,
            body: { name: "Incomplete", price: 10 }
        });

        assert.equal(res.status, 400);
    });
});

// -----------------------------------------------------
// Update
// -----------------------------------------------------

describe("PUT /api/products/:id", () => {
    test("updates a product as admin", async () => {
        const { token } = await createUser({ role: "admin" });
        const product = await createProduct({ price: 100 });

        const res = await request(
            "PUT",
            `/api/products/${product._id}`,
            {
                token,
                body: { price: 250, stock: 3 }
            }
        );

        assert.equal(res.status, 200);
        assert.equal(res.body.product.price, 250);
        assert.equal(res.body.product.stock, 3);
        // Untouched fields survive a partial update.
        assert.equal(res.body.product.name, product.name);
    });

    test("returns 404 for an unknown product", async () => {
        const { token } = await createUser({ role: "admin" });

        const res = await request(
            "PUT",
            `/api/products/${MISSING_ID()}`,
            { token, body: { price: 5 } }
        );

        assert.equal(res.status, 404);
    });

    test("rejects a non-admin user", async () => {
        const { token } = await createUser();
        const product = await createProduct();

        const res = await request(
            "PUT",
            `/api/products/${product._id}`,
            { token, body: { price: 5 } }
        );

        assert.equal(res.status, 403);
    });
});

// -----------------------------------------------------
// Delete
// -----------------------------------------------------

describe("DELETE /api/products/:id", () => {
    test("deletes a product as admin", async () => {
        const { token } = await createUser({ role: "admin" });
        const product = await createProduct();

        const res = await request(
            "DELETE",
            `/api/products/${product._id}`,
            { token }
        );

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);

        const stillThere = await Product.findById(product._id);
        assert.equal(stillThere, null);
    });

    test("returns 404 for an unknown product", async () => {
        const { token } = await createUser({ role: "admin" });

        const res = await request(
            "DELETE",
            `/api/products/${MISSING_ID()}`,
            { token }
        );

        assert.equal(res.status, 404);
    });

    test("rejects a non-admin user", async () => {
        const { token } = await createUser();
        const product = await createProduct();

        const res = await request(
            "DELETE",
            `/api/products/${product._id}`,
            { token }
        );

        assert.equal(res.status, 403);
    });
});
