// =====================================================
// SEED
// =====================================================
// Fills an empty database with a starter catalog plus an
// admin and a demo customer, so a fresh clone has something
// to look at.
//
//   npm run seed           add products only if there are none
//   npm run seed -- --reset   replace every product (orders kept)
//
// Accounts are created only if they don't already exist.
// Set SEED_ADMIN_PASSWORD before seeding anything public.

const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");

const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");
const User = require("../src/models/User");

const image = (id) =>
    `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;

const PRODUCTS = [
    {
        name: "Studio Headphones",
        category: "Electronics",
        price: 8999,
        stock: 14,
        image: image("photo-1505740420928-5e560c06d30e"),
        description: "Over-ear wireless headphones with active noise cancelling, a 40-hour battery and warm, detailed sound."
    },
    {
        name: "Mechanical Keyboard",
        category: "Electronics",
        price: 5599,
        stock: 9,
        image: image("photo-1587829741301-dc798b83add3"),
        description: "Hot-swappable tactile switches, a solid aluminium case and per-key RGB backlighting."
    },
    {
        name: "Instant Camera",
        category: "Electronics",
        price: 7499,
        stock: 4,
        image: image("photo-1526170375885-4d8ecf77b99f"),
        description: "Point, shoot and hold a real print in seconds. Built-in flash and a selfie mirror."
    },
    {
        name: "Smart Watch",
        category: "Electronics",
        price: 12999,
        stock: 6,
        image: image("photo-1546868871-7041f2a55e12"),
        description: "Always-on AMOLED display, heart-rate and sleep tracking, and up to seven days per charge."
    },
    {
        name: "Crimson Runner",
        category: "Shoes",
        price: 4999,
        stock: 18,
        image: image("photo-1542291026-7eec264c27ff"),
        description: "A lightweight daily trainer with a responsive foam midsole and a breathable knit upper."
    },
    {
        name: "Court Classic",
        category: "Shoes",
        price: 3799,
        stock: 20,
        image: image("photo-1460353581641-37baddab0fa2"),
        description: "Low-top sneaker with a cushioned insole and a grippy rubber cup sole for everyday wear."
    },
    {
        name: "Street High-Top",
        category: "Shoes",
        price: 5499,
        stock: 3,
        image: image("photo-1600185365483-26d7a4cc7519"),
        description: "Padded high-top silhouette in premium suede with a vulcanised sole."
    },
    {
        name: "Minimal Watch",
        category: "Accessories",
        price: 6499,
        stock: 11,
        image: image("photo-1523275335684-37898b6baf30"),
        description: "A clean dial, sapphire glass and a soft leather strap that ages beautifully."
    },
    {
        name: "Round Sunglasses",
        category: "Accessories",
        price: 1999,
        stock: 25,
        image: image("photo-1572635196237-14b3f281503f"),
        description: "Polarised lenses in a featherweight frame with full UV400 protection."
    },
    {
        name: "Canvas Backpack",
        category: "Accessories",
        price: 3299,
        stock: 2,
        image: image("photo-1553062407-98eeb64c6a62"),
        description: "Water-resistant waxed canvas with a padded 15-inch laptop sleeve and quick-access pockets."
    }
];

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

const seedProducts = async (reset) => {
    const existing = await Product.countDocuments();

    if (existing > 0 && !reset) {
        console.log(`Products: ${existing} already present, skipped (use --reset to replace).`);
        return;
    }

    if (reset) {
        await Product.deleteMany({});
    }

    // Created one by one so "newest" sorting follows list order.
    for (const product of [...PRODUCTS].reverse()) {
        await Product.create(product);
    }

    console.log(`Products: inserted ${PRODUCTS.length}.`);
};

const seedAccounts = async () => {
    for (const account of ACCOUNTS) {
        const found = await User.findOne({ email: account.email });

        if (found) {
            console.log(`Account: ${account.email} already exists, left unchanged.`);
            continue;
        }

        await User.create(account);
        console.log(`Account: created ${account.role} ${account.email} / ${account.password}`);
    }
};

const run = async () => {
    const reset = process.argv.includes("--reset");

    await connectDB();
    await seedProducts(reset);
    await seedAccounts();
    await mongoose.disconnect();

    console.log("Done.");
};

run().catch(async (error) => {
    console.error("Seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
});
