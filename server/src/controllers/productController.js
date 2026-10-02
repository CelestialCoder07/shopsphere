const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

const MAX_PAGE_SIZE = 60;
const DEFAULT_PAGE_SIZE = 24;
const MAX_REVIEWS_RETURNED = 50;

// Fields an admin may set. Ratings are derived, never written.
const EDITABLE_FIELDS = [
    "name",
    "brand",
    "description",
    "price",
    "compareAtPrice",
    "category",
    "image",
    "stock",
    "featured"
];

// =====================================================
// HELPERS
// =====================================================

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isValidPrice = (value) => {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
};

// Pick the editable fields present in the body; an empty
// compare-at price clears the sale.
const pickEditable = (body) => {
    const fields = {};

    for (const key of EDITABLE_FIELDS) {
        if (body[key] !== undefined) {
            fields[key] = body[key];
        }
    }

    if (fields.compareAtPrice === "" || fields.compareAtPrice === 0) {
        fields.compareAtPrice = null;
    }

    return fields;
};

const SORT_OPTIONS = {
    newest: { createdAt: -1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    rating: { rating: -1, numReviews: -1 },
    name: { name: 1 }
};

// =====================================================
// GET /api/products
// @access Public
// =====================================================
// Query: search, category, sort, page, limit, onSale, featured

const getProducts = async (req, res) => {
    const { search, category, sort, onSale, featured } = req.query;

    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(
        toPositiveInt(req.query.limit, DEFAULT_PAGE_SIZE),
        MAX_PAGE_SIZE
    );

    const filter = {};

    if (search && search.trim()) {
        const pattern = { $regex: escapeRegex(search.trim()), $options: "i" };
        filter.$or = [{ name: pattern }, { brand: pattern }];
    }

    if (category && category !== "All") {
        filter.category = category;
    }

    if (featured === "true") {
        filter.featured = true;
    }

    if (onSale === "true") {
        filter.compareAtPrice = { $ne: null };
        filter.$expr = { $gt: ["$compareAtPrice", "$price"] };
    }

    const sortBy = { ...(SORT_OPTIONS[sort] || SORT_OPTIONS.newest), _id: 1 };

    const [products, total] = await Promise.all([
        Product.find(filter)
            // Listings never need the review bodies.
            .select("-reviews")
            .sort(sortBy)
            .skip((page - 1) * limit)
            .limit(limit),
        Product.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        count: products.length,
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        products
    });
};

// =====================================================
// GET /api/products/categories
// @access Public
// =====================================================
// Categories are derived from the catalog itself, with a
// product count and a cover image for each. One aggregation:
// $group does the counting inside MongoDB.

const getCategories = async (req, res) => {
    const categories = await Product.aggregate([
        // Cover image: the best-reviewed product that has a photo.
        {
            $addFields: {
                hasImage: { $gt: [{ $strLenCP: { $ifNull: ["$image", ""] } }, 0] }
            }
        },
        { $sort: { hasImage: -1, numReviews: -1, rating: -1, createdAt: -1 } },
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 },
                image: { $first: "$image" }
            }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, name: "$_id", count: 1, image: 1 } }
    ]);

    res.status(200).json({
        success: true,
        categories
    });
};

// =====================================================
// GET /api/products/:id
// @access Public
// =====================================================

const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    product.reviews = (product.reviews || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, MAX_REVIEWS_RETURNED);

    res.status(200).json({
        success: true,
        product
    });
};

// =====================================================
// POST /api/products
// @access Private/Admin
// =====================================================

const createProduct = async (req, res) => {
    const fields = pickEditable(req.body);

    if (!isValidPrice(fields.price)) {
        return res.status(400).json({
            success: false,
            message: "Price must be a number greater than or equal to 0"
        });
    }

    const product = await Product.create(fields);

    res.status(201).json({
        success: true,
        message: "Product created",
        product
    });
};

// =====================================================
// PUT /api/products/:id
// @access Private/Admin
// =====================================================

const updateProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    product.set(pickEditable(req.body));

    const updatedProduct = await product.save();

    res.status(200).json({
        success: true,
        message: "Product updated",
        product: updatedProduct
    });
};

// =====================================================
// DELETE /api/products/:id
// @access Private/Admin
// =====================================================

const deleteProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product removed successfully"
    });
};

// =====================================================
// POST /api/products/:id/reviews
// @access Private
// =====================================================
// One review per customer: posting again replaces it.

const upsertReview = async (req, res) => {
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: "Rating must be a whole number from 1 to 5"
        });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const verifiedPurchase = Boolean(
        await Order.exists({
            user: req.user.id,
            paymentStatus: "Paid",
            "items.product": product._id
        })
    );

    const existing = product.reviews.find(
        (review) => String(review.user) === String(req.user.id)
    );

    if (existing) {
        existing.rating = rating;
        existing.comment = comment;
        existing.verifiedPurchase = verifiedPurchase;
    } else {
        const author = await User.findById(req.user.id).select("name");

        product.reviews.push({
            user: req.user.id,
            name: author?.name || "Customer",
            rating,
            comment,
            verifiedPurchase
        });
    }

    product.recalculateRating();

    // Concurrent writes to the same product raise a VersionError
    // (optimistic concurrency), mapped to 409 by the error handler.
    await product.save();

    res.status(existing ? 200 : 201).json({
        success: true,
        message: existing ? "Review updated" : "Review added",
        rating: product.rating,
        numReviews: product.numReviews,
        review: product.reviews.find(
            (review) => String(review.user) === String(req.user.id)
        )
    });
};

// =====================================================
// DELETE /api/products/:id/reviews
// @access Private (removes the caller's own review)
// =====================================================

const deleteReview = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const before = product.reviews.length;

    product.reviews = product.reviews.filter(
        (review) => String(review.user) !== String(req.user.id)
    );

    if (product.reviews.length === before) {
        return res.status(404).json({
            success: false,
            message: "You haven't reviewed this product"
        });
    }

    product.recalculateRating();
    await product.save();

    res.status(200).json({
        success: true,
        message: "Review removed",
        rating: product.rating,
        numReviews: product.numReviews
    });
};

module.exports = {
    getProducts,
    getCategories,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    upsertReview,
    deleteReview
};
