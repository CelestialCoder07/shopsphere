// =====================================================
// STARTER CATALOG
// =====================================================
// Photos are from Unsplash (free to use under the Unsplash
// License). `photo` is the Unsplash photo id.

const image = (photo) =>
    `https://images.unsplash.com/photo-${photo}?w=1000&h=1000&fit=crop&q=75&auto=format`;

const PRODUCTS = [
    // ---------------- Shoes ----------------
    {
        name: "Free Run Flyknit",
        brand: "Nike",
        category: "Shoes",
        price: 7495,
        compareAtPrice: 9995,
        stock: 18,
        featured: true,
        photo: "1542291026-7eec264c27ff",
        description: "A sock-like Flyknit upper and a flexible, low-profile sole that moves with your foot. Built for easy daily miles and all-day wear."
    },
    {
        name: "Air Max 1 Sunrise",
        brand: "Nike",
        category: "Shoes",
        price: 10795,
        stock: 9,
        photo: "1600185365483-26d7a4cc7519",
        description: "The icon that put Air on display. Suede and mesh upper, visible Max Air cushioning and a warm orange colourway."
    },
    {
        name: "Court Classic Leather",
        brand: "Puma",
        category: "Shoes",
        price: 4999,
        compareAtPrice: 6499,
        stock: 22,
        photo: "1608231387042-66d1773070a5",
        description: "Clean white full-grain leather, a perforated toe box and a cushioned SoftFoam+ insole. Goes with literally everything."
    },
    {
        name: "Old Skool Burgundy",
        brand: "Vans",
        category: "Shoes",
        price: 5499,
        stock: 14,
        photo: "1525966222134-fcfa99b8ae77",
        description: "The classic skate shoe in rich burgundy canvas and suede with the signature side stripe and a waffle rubber outsole."
    },
    {
        name: "247 Olive Runner",
        brand: "New Balance",
        category: "Shoes",
        price: 8999,
        stock: 6,
        photo: "1539185441755-769473a23570",
        description: "A lifestyle runner with a sleek knit upper and REVlite foam for lightweight, responsive comfort from morning to night."
    },
    {
        name: "Trailhead Leather Boot",
        brand: "Woodland",
        category: "Shoes",
        price: 6995,
        stock: 4,
        photo: "1520639888713-7851133b1ed0",
        description: "Waterproof nubuck leather, padded collar and a lugged rubber outsole for grip on wet rock and loose trails."
    },
    {
        name: "Air Force 1 '07",
        brand: "Nike",
        category: "Shoes",
        price: 7495,
        stock: 25,
        featured: true,
        photo: "1600269452121-4f2416e55c28",
        description: "Crisp triple-white leather and the Air-cushioned sole that made a basketball shoe into a streetwear legend."
    },

    // ---------------- Electronics ----------------
    {
        name: "Studio Wireless Headphones",
        brand: "Auralis",
        category: "Electronics",
        price: 8999,
        compareAtPrice: 12999,
        stock: 16,
        featured: true,
        photo: "1505740420928-5e560c06d30e",
        description: "Over-ear headphones with hybrid active noise cancelling, a 40-hour battery and plush memory-foam cushions."
    },
    {
        name: "Smartwatch Series 9",
        brand: "Apple",
        category: "Electronics",
        price: 41900,
        stock: 7,
        featured: true,
        photo: "1546868871-7041f2a55e12",
        description: "Always-on Retina display, heart-rate and sleep tracking, crash detection and all-day battery life in an aluminium case."
    },
    {
        name: "OneStep+ Instant Camera",
        brand: "Polaroid",
        category: "Electronics",
        price: 12999,
        stock: 0,
        photo: "1526170375885-4d8ecf77b99f",
        description: "Point, shoot and hold a real print in seconds. Two lenses, a self-timer and Bluetooth for creative app-controlled modes."
    },
    {
        name: "AirPods Pro (2nd gen)",
        brand: "Apple",
        category: "Electronics",
        price: 22900,
        compareAtPrice: 26900,
        stock: 12,
        photo: "1572569511254-d8f925fe2cbb",
        description: "Up to 2x more active noise cancellation, adaptive transparency and personalised spatial audio in a MagSafe case."
    },
    {
        name: "MacBook Pro 14\"",
        brand: "Apple",
        category: "Electronics",
        price: 169900,
        stock: 5,
        featured: true,
        photo: "1517336714731-489689fd1ca8",
        description: "A Liquid Retina XDR display, all-day battery and pro-level performance in a thin aluminium unibody."
    },
    {
        name: "Flip 6 Portable Speaker",
        brand: "JBL",
        category: "Electronics",
        price: 9999,
        compareAtPrice: 13999,
        stock: 20,
        photo: "1608043152269-423dbba4e7e1",
        description: "Bold JBL sound, IP67 dust and water resistance and 12 hours of playtime in a speaker that fits in a bottle holder."
    },
    {
        name: "EOS 1500D DSLR Kit",
        brand: "Canon",
        category: "Electronics",
        price: 38995,
        stock: 3,
        photo: "1502920917128-1aa500764cbd",
        description: "24.1MP APS-C sensor, Full HD video and built-in Wi-Fi, bundled with an 18–55mm lens. A great first DSLR."
    },
    {
        name: "Low-Profile Wireless Keyboard",
        brand: "Keystone",
        category: "Electronics",
        price: 4499,
        stock: 15,
        photo: "1587829741301-dc798b83add3",
        description: "Quiet scissor switches, a slim aluminium frame and multi-device Bluetooth pairing. Charges over USB-C."
    },

    // ---------------- Accessories ----------------
    {
        name: "Wayfarer Classic Sunglasses",
        brand: "Ray-Ban",
        category: "Accessories",
        price: 8490,
        stock: 18,
        featured: true,
        photo: "1572635196237-14b3f281503f",
        description: "The most recognisable sunglasses ever made. Polished black acetate with G-15 lenses and 100% UV protection."
    },
    {
        name: "Chronograph Leather Watch",
        brand: "Fossil",
        category: "Accessories",
        price: 11995,
        compareAtPrice: 14995,
        stock: 8,
        photo: "1542496658-e33a6d0d50f6",
        description: "A 44mm stainless steel case, a tachymeter bezel and a brown leather strap. Water resistant to 100m."
    },
    {
        name: "Round Metal Sunglasses",
        brand: "Lumen",
        category: "Accessories",
        price: 2999,
        stock: 24,
        photo: "1511499767150-a48a237f0083",
        description: "Featherweight gold-tone frames with polarised green lenses. A timeless round shape that suits most faces."
    },
    {
        name: "Commuter Backpack 22L",
        brand: "Nomad",
        category: "Accessories",
        price: 3499,
        stock: 30,
        photo: "1553062407-98eeb64c6a62",
        description: "Water-resistant fabric, a padded 15-inch laptop sleeve and a hidden back pocket for your passport and cards."
    },
    {
        name: "Bifold Leather Wallet",
        brand: "Nomad",
        category: "Accessories",
        price: 1499,
        compareAtPrice: 1999,
        stock: 40,
        photo: "1627123424574-724758594e93",
        description: "Full-grain vegetable-tanned leather that darkens beautifully with use. Six card slots and RFID blocking."
    },
    {
        name: "Wicker Top-Handle Bag",
        brand: "Maison Rue",
        category: "Accessories",
        price: 5999,
        stock: 5,
        photo: "1590874103328-eac38a683ce7",
        description: "Hand-woven rattan with a tan leather flap and top handle. The bag that makes every summer outfit."
    },

    // ---------------- Apparel ----------------
    {
        name: "Essential Heavyweight Tee",
        brand: "Basecamp",
        category: "Apparel",
        price: 1299,
        stock: 50,
        photo: "1618354691373-d851c5c3a990",
        description: "240gsm combed cotton with a relaxed fit and a ribbed crew neck that keeps its shape wash after wash."
    },
    {
        name: "Classic White Crew Tee",
        brand: "Basecamp",
        category: "Apparel",
        price: 999,
        compareAtPrice: 1299,
        stock: 60,
        photo: "1521572163474-6864f9cf17ab",
        description: "Soft, breathable organic cotton in a clean regular fit. The white tee you'll reach for every day."
    },
    {
        name: "Biker Leather Jacket",
        brand: "Ironhide",
        category: "Apparel",
        price: 14999,
        stock: 6,
        featured: true,
        photo: "1551028719-00167b16eac5",
        description: "Supple lambskin leather, an asymmetric zip and quilted lining. Gets better every year you wear it."
    },
    {
        name: "Rust Bomber Jacket",
        brand: "Basecamp",
        category: "Apparel",
        price: 4499,
        compareAtPrice: 5999,
        stock: 12,
        photo: "1591047139829-d91aecb6caea",
        description: "A lightweight nylon bomber with ribbed cuffs, a utility sleeve pocket and a satin-smooth lining."
    },
    {
        name: "501 Original Jeans",
        brand: "Levi's",
        category: "Apparel",
        price: 3999,
        stock: 28,
        photo: "1542272604-787c3835535d",
        description: "The original straight-leg jean with a button fly, made from durable rigid denim that breaks in to fit you."
    },
    {
        name: "Everyday Crewneck Sweatshirt",
        brand: "Basecamp",
        category: "Apparel",
        price: 2499,
        stock: 20,
        photo: "1620799140408-edc6dcb6d633",
        description: "Brushed-back fleece that's soft inside and smooth outside, with a relaxed fit for layering."
    },

    // ---------------- Home ----------------
    {
        name: "Velvet 3-Seater Sofa",
        brand: "Oakline",
        category: "Home",
        price: 54999,
        compareAtPrice: 69999,
        stock: 3,
        featured: true,
        photo: "1555041469-a586c61ea9bc",
        description: "Deep emerald velvet, high-resilience foam cushions and solid wood legs. Seats three, invites naps."
    },
    {
        name: "Arc Floor Lamp",
        brand: "Oakline",
        category: "Home",
        price: 6999,
        stock: 9,
        photo: "1507473885765-e6ed057f782c",
        description: "A matte steel shade on an adjustable arm. Point it at your reading chair or bounce it off the ceiling."
    },
    {
        name: "Stoneware Coffee Mug",
        brand: "Kiln & Co.",
        category: "Home",
        price: 699,
        stock: 45,
        photo: "1514228742587-6b1558fcca3d",
        description: "A generous 350ml mug in glazed stoneware. Microwave and dishwasher safe, comfortable in the hand."
    },
    {
        name: "Insulated Steel Bottle 750ml",
        brand: "Trailmate",
        category: "Home",
        price: 1299,
        compareAtPrice: 1599,
        stock: 35,
        photo: "1602143407151-7111542de6e8",
        description: "Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12. Leak-proof and BPA-free."
    },
    {
        name: "Speckled Ceramic Cup Set",
        brand: "Kiln & Co.",
        category: "Home",
        price: 1899,
        stock: 14,
        photo: "1610701596007-11502861dcfa",
        description: "Four hand-thrown cups with a speckled matte glaze and raw clay bases. Every set is slightly different."
    },
    {
        name: "Oak Bar Stool",
        brand: "Oakline",
        category: "Home",
        price: 4999,
        stock: 10,
        photo: "1503602642458-232111445657",
        description: "Solid oak with a hand-sanded seat and footrest. A sturdy, simple stool for your kitchen counter."
    }
].map(({ photo, ...product }) => ({ ...product, image: image(photo) }));

// Reviewer accounts used only to give the catalog some ratings.
const REVIEWERS = [
    "Aarav Mehta",
    "Diya Kapoor",
    "Rohan Iyer",
    "Sneha Reddy",
    "Kabir Singh",
    "Ananya Nair"
];

const REVIEW_LINES = {
    5: [
        "Absolutely love it. Exactly as pictured and the quality is excellent.",
        "Worth every rupee. Fast delivery and well packed.",
        "Best purchase I've made this year. Highly recommend.",
        "Premium feel, great finish. Would buy again."
    ],
    4: [
        "Really good overall. Minor nitpicks but very happy with it.",
        "Great value for the price. Does exactly what I needed.",
        "Solid quality, looks great. Took a day longer to arrive than expected."
    ],
    3: [
        "It's okay. Does the job but I expected a bit more for the price.",
        "Decent, though the colour is slightly different from the photos."
    ],
    2: [
        "Not quite what I expected. Customer support was helpful though."
    ]
};

module.exports = { PRODUCTS, REVIEWERS, REVIEW_LINES };
