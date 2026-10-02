const Product = require("../models/Product");

// =====================================================
// CART RESOLUTION
// =====================================================
// Validate the cart against live product data and work out
// the authoritative prices. The client never dictates price,
// only product id + quantity.
//
// All products are fetched in one query (no N+1), and repeated
// lines for the same product are merged so the stock check
// sees the real total.

const mergeLines = (items) => {
    const merged = new Map();

    for (const item of items) {
        const id = String(item?.product ?? "");
        const quantity = Number(item?.quantity);

        if (!merged.has(id)) {
            merged.set(id, { product: id, quantity: 0 });
        }

        merged.get(id).quantity += quantity;
    }

    return [...merged.values()];
};

const resolveCartItems = async (items) => {
    const lines = mergeLines(items);

    // An invalid id makes this throw a CastError → 400.
    const products = await Product.find({
        _id: { $in: lines.map((line) => line.product) }
    }).select("-reviews");

    const byId = new Map(products.map((product) => [String(product._id), product]));

    const resolved = [];
    let total = 0;

    for (const line of lines) {
        const product = byId.get(line.product);

        if (!product) {
            return { error: "One of the products no longer exists" };
        }

        const { quantity } = line;

        if (!Number.isInteger(quantity) || quantity < 1) {
            return { error: `Invalid quantity for ${product.name}` };
        }

        if (product.stock < quantity) {
            return {
                error:
                    `Not enough stock for ${product.name}. ` +
                    `Available: ${product.stock}`
            };
        }

        resolved.push({
            product: product._id,
            name: product.name,
            image: product.image,
            price: product.price,
            quantity
        });

        total += product.price * quantity;
    }

    return { items: resolved, total };
};

module.exports = { resolveCartItems };
