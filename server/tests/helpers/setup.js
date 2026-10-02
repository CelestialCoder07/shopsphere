// =====================================================
// TEST HARNESS
// =====================================================
// Boots the real Express app against the real database on an
// ephemeral port, and exposes a small fetch wrapper plus
// factories that register everything they create so it can be
// torn down afterwards.

const path = require("path");

// Disables the auth rate limiter, which the suite would trip.
process.env.NODE_ENV = "test";

require("dotenv").config({
    path: path.join(__dirname, "..", "..", ".env")
});

const mongoose = require("mongoose");

const connectDB = require("../../src/config/db");
const app = require("../../src/app");

const User = require("../../src/models/User");
const Product = require("../../src/models/Product");
const Order = require("../../src/models/Order");

let server = null;
let baseUrl = "";

const createdUserIds = [];
const createdProductIds = [];
const createdOrderIds = [];

// Unique per run so parallel/leftover data never collides.
const runId = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// -----------------------------------------------------
// Lifecycle
// -----------------------------------------------------

const startTestServer = async () => {
    await connectDB();

    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", () => {
            baseUrl = `http://127.0.0.1:${server.address().port}`;
            resolve();
        });
    });

    return baseUrl;
};

const stopTestServer = async () => {
    if (createdOrderIds.length > 0) {
        await Order.deleteMany({ _id: { $in: createdOrderIds } });
    }

    if (createdProductIds.length > 0) {
        await Product.deleteMany({ _id: { $in: createdProductIds } });
    }

    if (createdUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: createdUserIds } });
    }

    if (server) {
        await new Promise((resolve) => server.close(resolve));
        server = null;
    }

    await mongoose.disconnect();
};

// -----------------------------------------------------
// HTTP
// -----------------------------------------------------

const request = async (method, urlPath, options = {}) => {
    const { body, token } = options;

    const headers = {};

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${urlPath}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    const raw = await response.text();

    let parsed = null;

    try {
        parsed = raw ? JSON.parse(raw) : null;
    } catch {
        parsed = { raw };
    }

    return { status: response.status, body: parsed };
};

// -----------------------------------------------------
// Factories
// -----------------------------------------------------

let emailCounter = 0;

const uniqueEmail = (label) => {
    emailCounter += 1;
    return `${label}-${runId}-${emailCounter}@shopsphere.test`;
};

const createUser = async ({ role = "user", password = "password123" } = {}) => {
    const email = uniqueEmail(role);

    const user = await User.create({
        name: `Test ${role}`,
        email,
        password,
        role
    });

    createdUserIds.push(user._id);

    const login = await request("POST", "/api/auth/login", {
        body: { email, password }
    });

    if (login.status !== 200) {
        throw new Error(
            `Could not log in test ${role}: ${JSON.stringify(login.body)}`
        );
    }

    return {
        user,
        email,
        password,
        token: login.body.token
    };
};

const createProduct = async (overrides = {}) => {
    const product = await Product.create({
        name: `Test Product ${runId}`,
        description: "Created by the automated test suite",
        price: 499,
        category: "Electronics",
        image: "",
        stock: 10,
        ...overrides
    });

    createdProductIds.push(product._id);

    return product;
};

module.exports = {
    request,
    startTestServer,
    stopTestServer,
    createUser,
    createProduct,
    uniqueEmail,
    runId,
    User,
    Product,
    Order,
    trackUser: (id) => createdUserIds.push(id),
    trackProduct: (id) => createdProductIds.push(id),
    trackOrder: (id) => createdOrderIds.push(id)
};
