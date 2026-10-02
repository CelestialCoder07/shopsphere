const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
    request,
    startTestServer,
    stopTestServer,
    createUser,
    createProduct,
    runId,
    Product,
    Order,
    trackOrder
} = require("./helpers/setup");

before(startTestServer);
after(stopTestServer);

// -----------------------------------------------------
// Categories
// -----------------------------------------------------

describe("GET /api/products/categories", () => {
    test("derives categories with counts from the catalog", async () => {
        const category = `Cat-${runId}`;

        await createProduct({ category, image: "https://example.com/a.jpg" });
        await createProduct({ category });

        const res = await request("GET", "/api/products/categories");

        assert.equal(res.status, 200);

        const found = res.body.categories.find((c) => c.name === category);

        assert.ok(found, "new category is listed");
        assert.equal(found.count, 2);
        assert.ok("image" in found);
    });
});

// -----------------------------------------------------
// Listing filters
// -----------------------------------------------------

describe("GET /api/products filters", () => {
    test("onSale returns only discounted products", async () => {
        const category = `Sale-${runId}`;

        await createProduct({ category, price: 800, compareAtPrice: 1000 });
        await createProduct({ category, price: 800 });

        const res = await request(
            "GET",
            `/api/products?category=${category}&onSale=true`
        );

        assert.equal(res.status, 200);
        assert.equal(res.body.total, 1);
        assert.equal(res.body.products[0].compareAtPrice, 1000);
    });

    test("featured returns only featured products", async () => {
        const category = `Feat-${runId}`;

        await createProduct({ category, featured: true });
        await createProduct({ category, featured: false });

        const res = await request(
            "GET",
            `/api/products?category=${category}&featured=true`
        );

        assert.equal(res.body.total, 1);
        assert.equal(res.body.products[0].featured, true);
    });

    test("search matches brand as well as name", async () => {
        const brand = `Brand${runId}`;

        await createProduct({ brand });

        const res = await request("GET", `/api/products?search=${brand}`);

        assert.ok(res.body.products.length >= 1);
        assert.ok(res.body.products.every((p) => p.brand === brand));
    });

    test("listings omit review bodies", async () => {
        const res = await request("GET", "/api/products?limit=5");

        assert.ok(res.body.products.every((p) => p.reviews === undefined));
    });
});

// -----------------------------------------------------
// Admin product fields
// -----------------------------------------------------

describe("Admin product fields", () => {
    test("rejects a compare-at price below the price", async () => {
        const { token } = await createUser({ role: "admin" });

        const res = await request("POST", "/api/products", {
            token,
            body: {
                name: "Bad Sale",
                description: "x",
                price: 500,
                compareAtPrice: 400,
                category: "Shoes",
                stock: 1
            }
        });

        assert.equal(res.status, 400);
    });

    test("ignores attempts to set the rating directly", async () => {
        const { token } = await createUser({ role: "admin" });
        const product = await createProduct();

        const res = await request("PUT", `/api/products/${product._id}`, {
            token,
            body: { rating: 5, numReviews: 999, brand: "Acme" }
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.product.rating, 0);
        assert.equal(res.body.product.numReviews, 0);
        assert.equal(res.body.product.brand, "Acme");
    });

    test("clearing compare-at price ends the sale", async () => {
        const { token } = await createUser({ role: "admin" });
        const product = await createProduct({ price: 100, compareAtPrice: 150 });

        const res = await request("PUT", `/api/products/${product._id}`, {
            token,
            body: { compareAtPrice: "" }
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.product.compareAtPrice, null);
    });
});

// -----------------------------------------------------
// Reviews
// -----------------------------------------------------

describe("Reviews", () => {
    test("adds a review and updates the product rating", async () => {
        const first = await createUser();
        const second = await createUser();
        const product = await createProduct();
        const url = `/api/products/${product._id}/reviews`;

        const a = await request("POST", url, {
            token: first.token,
            body: { rating: 5, comment: "Great" }
        });
        const b = await request("POST", url, {
            token: second.token,
            body: { rating: 4, comment: "Good" }
        });

        assert.equal(a.status, 201);
        assert.equal(b.status, 201);
        assert.equal(b.body.numReviews, 2);
        assert.equal(b.body.rating, 4.5);

        const detail = await request("GET", `/api/products/${product._id}`);
        assert.equal(detail.body.product.reviews.length, 2);
        assert.equal(detail.body.product.rating, 4.5);
    });

    test("posting again replaces the caller's review", async () => {
        const { token } = await createUser();
        const product = await createProduct();
        const url = `/api/products/${product._id}/reviews`;

        await request("POST", url, { token, body: { rating: 2 } });
        const res = await request("POST", url, { token, body: { rating: 5 } });

        assert.equal(res.status, 200);
        assert.equal(res.body.numReviews, 1);
        assert.equal(res.body.rating, 5);
    });

    test("rejects an out-of-range rating", async () => {
        const { token } = await createUser();
        const product = await createProduct();

        for (const rating of [0, 6, 3.5, "abc"]) {
            const res = await request("POST", `/api/products/${product._id}/reviews`, {
                token,
                body: { rating }
            });

            assert.equal(res.status, 400, `rating ${rating}`);
        }
    });

    test("requires sign-in", async () => {
        const product = await createProduct();

        const res = await request("POST", `/api/products/${product._id}/reviews`, {
            body: { rating: 5 }
        });

        assert.equal(res.status, 401);
    });

    test("marks reviews from paying customers as verified", async () => {
        const buyer = await createUser();
        const product = await createProduct();

        const order = await Order.create({
            user: buyer.user._id,
            items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
            totalPrice: product.price,
            paymentStatus: "Paid"
        });
        trackOrder(order._id);

        const res = await request("POST", `/api/products/${product._id}/reviews`, {
            token: buyer.token,
            body: { rating: 5 }
        });

        assert.equal(res.body.review.verifiedPurchase, true);
    });

    test("lets a customer delete their own review", async () => {
        const { token } = await createUser();
        const product = await createProduct();
        const url = `/api/products/${product._id}/reviews`;

        await request("POST", url, { token, body: { rating: 3 } });
        const res = await request("DELETE", url, { token });

        assert.equal(res.status, 200);
        assert.equal(res.body.numReviews, 0);
        assert.equal(res.body.rating, 0);

        const again = await request("DELETE", url, { token });
        assert.equal(again.status, 404);
    });
});

// -----------------------------------------------------
// Wishlist
// -----------------------------------------------------

describe("Wishlist", () => {
    test("adds, lists and removes products idempotently", async () => {
        const { token } = await createUser();
        const product = await createProduct();
        const url = `/api/users/me/wishlist/${product._id}`;

        const first = await request("PUT", url, { token });
        const second = await request("PUT", url, { token });

        assert.equal(first.status, 200);
        assert.deepEqual(second.body.wishlist, [String(product._id)]);

        const list = await request("GET", "/api/users/me/wishlist", { token });
        assert.equal(list.body.count, 1);
        assert.equal(list.body.products[0]._id, String(product._id));

        const removed = await request("DELETE", url, { token });
        assert.deepEqual(removed.body.wishlist, []);
    });

    test("skips products that were deleted", async () => {
        const { token } = await createUser();
        const product = await createProduct();

        await request("PUT", `/api/users/me/wishlist/${product._id}`, { token });
        await Product.deleteOne({ _id: product._id });

        const list = await request("GET", "/api/users/me/wishlist", { token });
        assert.equal(list.body.count, 0);
    });

    test("returns 404 for an unknown product", async () => {
        const { token } = await createUser();

        const res = await request(
            "PUT",
            "/api/users/me/wishlist/000000000000000000000000",
            { token }
        );

        assert.equal(res.status, 404);
    });

    test("requires sign-in", async () => {
        const res = await request("GET", "/api/users/me/wishlist");
        assert.equal(res.status, 401);
    });

    test("login returns the saved wishlist", async () => {
        const account = await createUser();
        const product = await createProduct();

        await request("PUT", `/api/users/me/wishlist/${product._id}`, {
            token: account.token
        });

        const login = await request("POST", "/api/auth/login", {
            body: { email: account.email, password: account.password }
        });

        assert.deepEqual(login.body.user.wishlist, [String(product._id)]);
    });
});

// -----------------------------------------------------
// Cart merging
// -----------------------------------------------------

describe("Cart validation", () => {
    test("merges duplicate lines before checking stock", async () => {
        const { token } = await createUser();
        const product = await createProduct({ stock: 4 });

        const res = await request("POST", "/api/orders", {
            token,
            body: {
                items: [
                    { product: String(product._id), quantity: 3 },
                    { product: String(product._id), quantity: 3 }
                ]
            }
        });

        assert.equal(res.status, 400);
        assert.match(res.body.message, /Not enough stock/);
    });

    test("stores an image snapshot on order items", async () => {
        const { token } = await createUser();
        const product = await createProduct({ image: "https://example.com/p.jpg" });

        const res = await request("POST", "/api/orders", {
            token,
            body: { items: [{ product: String(product._id), quantity: 1 }] }
        });

        trackOrder(res.body.order._id);

        assert.equal(res.status, 201);
        assert.equal(res.body.order.items[0].image, "https://example.com/p.jpg");
    });
});
