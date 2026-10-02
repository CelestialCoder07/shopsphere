// =====================================================
// SEED
// =====================================================
// Fills an empty database with the starter catalog (with
// reviews), an admin and a demo customer, so a fresh clone has
// something to look at.
//
//   npm run seed               add products only if there are none
//   npm run seed -- --reset    replace every product (orders kept)
//
// Accounts are created only if they don't already exist.
// Set SEED_ADMIN_PASSWORD before seeding anything public.

const crypto = require("crypto");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");

const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");
const User = require("../src/models/User");
const { PRODUCTS, REVIEWERS, REVIEW_LINES } = require("./catalog");

const ACCOUNTS = [
    {
        name: "Store Admin",
        email: process.env.SEED_ADMIN_EMAIL || "admin@shopsphere.dev",
        password: process.env.SEED_ADMIN_PASSWORD || "admin123",
        role: "admin"
    },
    {
        name: "Demo Shopper",
        email: "shopper@shopsphere.dev",
        password: "shopper123",
        role: "user"
    }
];

// Deterministic pseudo-random numbers so every seed produces
// the same ratings.
const seededRandom = (seed) => {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
};

const ensureAccount = async ({ name, email, password, role }) => {
    const existing = await User.findOne({ email });
    if (existing) return { user: existing, created: false };

    const user = await User.create({ name, email, password, role });
    return { user, created: true };
};

const buildReviews = (reviewers, random) => {
    const count = Math.floor(random() * (reviewers.length + 1));
    const shuffled = [...reviewers].sort(() => random() - 0.5).slice(0, count);

    return shuffled.map((reviewer) => {
        const roll = random();
        const rating = roll < 0.55 ? 5 : roll < 0.85 ? 4 : roll < 0.95 ? 3 : 2;
        const lines = REVIEW_LINES[rating];

        return {
            user: reviewer._id,
            name: reviewer.name,
            rating,
            comment: lines[Math.floor(random() * lines.length)],
            verifiedPurchase: random() < 0.7
        };
    });
};

const seedProducts = async (reset, reviewers) => {
    const existing = await Product.countDocuments();

    if (existing > 0 && !reset) {
        console.log(`Products: ${existing} already present, skipped (use --reset to replace).`);
        return;
    }

    if (reset) {
        await Product.deleteMany({});
    }

    const random = seededRandom(42);

    // Inserted oldest-first so the "newest" sort shows the list
    // top-down, with distinct timestamps.
    const base = Date.now() - PRODUCTS.length * 60_000;

    const docs = [...PRODUCTS].reverse().map((data, index) => {
        const product = new Product({
            ...data,
            reviews: buildReviews(reviewers, random),
            createdAt: new Date(base + index * 60_000)
        });
        product.recalculateRating();
        return product;
    });

    await Product.insertMany(docs);

    console.log(`Products: inserted ${docs.length}.`);
};

const run = async () => {
    const reset = process.argv.includes("--reset");

    await connectDB();

    for (const account of ACCOUNTS) {
        const { created } = await ensureAccount(account);
        console.log(
            created
                ? `Account: created ${account.role} ${account.email} / ${account.password}`
                : `Account: ${account.email} already exists, left unchanged.`
        );
    }

    // Reviewer accounts get random passwords: they exist only to
    // author the sample reviews and are never signed into.
    const reviewers = [];
    for (const name of REVIEWERS) {
        const slug = name.toLowerCase().replace(/[^a-z]+/g, ".");
        const { user } = await ensureAccount({
            name,
            email: `${slug}@reviewers.shopsphere.dev`,
            password: crypto.randomBytes(18).toString("base64url"),
            role: "user"
        });
        reviewers.push(user);
    }

    await seedProducts(reset, reviewers);
    await mongoose.disconnect();

    console.log("Done.");
};

run().catch(async (error) => {
    console.error("Seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
});
