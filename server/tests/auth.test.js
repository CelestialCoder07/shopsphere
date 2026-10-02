const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
    request,
    startTestServer,
    stopTestServer,
    createUser,
    uniqueEmail,
    User,
    trackUser
} = require("./helpers/setup");

before(startTestServer);
after(stopTestServer);

// -----------------------------------------------------
// Health
// -----------------------------------------------------

describe("GET /", () => {
    test("reports the API is running", async () => {
        const res = await request("GET", "/");

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.match(res.body.message, /ShopSphere API/);
    });

    test("unknown routes return a structured 404", async () => {
        const res = await request("GET", "/api/definitely-not-a-route");

        assert.equal(res.status, 404);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /Route not found/);
    });
});

// -----------------------------------------------------
// Registration
// -----------------------------------------------------

describe("POST /api/auth/register", () => {
    test("creates a user and never returns the password", async () => {
        const email = uniqueEmail("register");

        const res = await request("POST", "/api/auth/register", {
            body: {
                name: "New Shopper",
                email,
                password: "password123"
            }
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.user.email, email);
        assert.equal(res.body.user.role, "user");
        assert.equal(res.body.user.password, undefined);

        const created = await User.findOne({ email });
        trackUser(created._id);
    });

    test("hashes the password before storing it", async () => {
        const email = uniqueEmail("hashed");

        await request("POST", "/api/auth/register", {
            body: { name: "Hash Test", email, password: "password123" }
        });

        // password is select:false, so read it back explicitly.
        const stored = await User.findOne({ email }).select("+password");
        trackUser(stored._id);

        assert.notEqual(stored.password, "password123");
        assert.match(stored.password, /^\$2[aby]\$/);
    });

    test("normalises the email to lowercase", async () => {
        const email = uniqueEmail("MiXeD");

        const res = await request("POST", "/api/auth/register", {
            body: { name: "Mixed", email, password: "password123" }
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.user.email, email.toLowerCase());

        const created = await User.findOne({
            email: email.toLowerCase()
        });
        trackUser(created._id);
    });

    test("rejects a duplicate email with 409", async () => {
        const email = uniqueEmail("dupe");

        const first = await request("POST", "/api/auth/register", {
            body: { name: "First", email, password: "password123" }
        });

        assert.equal(first.status, 201);

        const second = await request("POST", "/api/auth/register", {
            body: { name: "Second", email, password: "password123" }
        });

        assert.equal(second.status, 409);
        assert.equal(second.body.success, false);

        const created = await User.findOne({ email });
        trackUser(created._id);
    });

    test("rejects a missing field with 400", async () => {
        const res = await request("POST", "/api/auth/register", {
            body: { email: uniqueEmail("nofields") }
        });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
    });

    test("rejects a short password with 400", async () => {
        const res = await request("POST", "/api/auth/register", {
            body: {
                name: "Short",
                email: uniqueEmail("short"),
                password: "123"
            }
        });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
    });
});

// -----------------------------------------------------
// Login
// -----------------------------------------------------

describe("POST /api/auth/login", () => {
    test("returns a token for valid credentials", async () => {
        const { email, password, token } = await createUser();

        assert.ok(token);

        const res = await request("POST", "/api/auth/login", {
            body: { email, password }
        });

        assert.equal(res.status, 200);
        assert.ok(res.body.token);
        assert.equal(res.body.user.email, email);
    });

    test("accepts a differently-cased email", async () => {
        const { email, password } = await createUser();

        const res = await request("POST", "/api/auth/login", {
            body: { email: email.toUpperCase(), password }
        });

        assert.equal(res.status, 200);
    });

    test("rejects a wrong password with 401", async () => {
        const { email } = await createUser();

        const res = await request("POST", "/api/auth/login", {
            body: { email, password: "totally-wrong" }
        });

        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);
    });

    test("rejects an unknown email with 401", async () => {
        const res = await request("POST", "/api/auth/login", {
            body: {
                email: uniqueEmail("ghost"),
                password: "password123"
            }
        });

        assert.equal(res.status, 401);
    });

    test("rejects a missing password with 400", async () => {
        const res = await request("POST", "/api/auth/login", {
            body: { email: uniqueEmail("nopass") }
        });

        assert.equal(res.status, 400);
    });
});

// -----------------------------------------------------
// Profile
// -----------------------------------------------------

describe("GET /api/auth/profile", () => {
    test("returns the signed-in user", async () => {
        const { email, token } = await createUser();

        const res = await request("GET", "/api/auth/profile", { token });

        assert.equal(res.status, 200);
        assert.equal(res.body.user.email, email);
        assert.equal(res.body.user.password, undefined);
    });

    test("rejects a request with no token", async () => {
        const res = await request("GET", "/api/auth/profile");

        assert.equal(res.status, 401);
    });

    test("rejects a malformed token", async () => {
        const res = await request("GET", "/api/auth/profile", {
            token: "not-a-real-jwt"
        });

        assert.equal(res.status, 401);
    });
});
