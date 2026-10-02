const Product = require("../models/Product");

// =====================================================
// CART RESOLUTION
// =====================================================
// Validate the cart against live product data and work out
// the authoritative prices. The client never dictates price,
// only product id + quantity.

const resolveCartItems = async (items) => {
    const resolved = [];
    let total = 0;

    for (const item of items) {
        const product = await Product.findById(item.product);

        if (!product) {
            return { error: "One of the products no longer exists" };
        }

        const quantity = Number(item.quantity);

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
            price: product.price,
            quantity
        });

        total += product.price * quantity;
    }

    return { items: resolved, total };
};

module.exports = { resolveCartItems };
