const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");

// =====================================================
// HELPERS
// =====================================================

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const wishlistIds = (user) => (user?.wishlist || []).map(String);

// =====================================================
// GET /api/users/me/wishlist
// @access Private
// =====================================================

const getWishlist = async (req, res) => {
    const user = await User.findById(req.user.id).populate({
        path: "wishlist",
        select: "-reviews"
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    // Deleted products populate as null; skip them.
    const products = user.wishlist.filter(Boolean);

    res.status(200).json({
        success: true,
        count: products.length,
        products
    });
};

// =====================================================
// PUT /api/users/me/wishlist/:productId
// @access Private
// =====================================================
// Idempotent: adding twice leaves one entry ($addToSet).

const addToWishlist = async (req, res) => {
    const { productId } = req.params;

    if (!isObjectId(productId) || !(await Product.exists({ _id: productId }))) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { wishlist: productId } },
        { returnDocument: "after", projection: { wishlist: 1 } }
    );

    res.status(200).json({
        success: true,
        wishlist: wishlistIds(user)
    });
};

// =====================================================
// DELETE /api/users/me/wishlist/:productId
// @access Private
// =====================================================

const removeFromWishlist = async (req, res) => {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid product id"
        });
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $pull: { wishlist: productId } },
        { returnDocument: "after", projection: { wishlist: 1 } }
    );

    res.status(200).json({
        success: true,
        wishlist: wishlistIds(user)
    });
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
