const Product = require("../models/Product");

const MAX_PAGE_SIZE = 60;
const DEFAULT_PAGE_SIZE = 24;

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

// =====================================================
// GET /api/products
// @access Public
// =====================================================

const getProducts = async (req, res) => {
    const { search, category, sort } = req.query;

    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(
        toPositiveInt(req.query.limit, DEFAULT_PAGE_SIZE),
        MAX_PAGE_SIZE
    );

    const filter = {};

    if (search && search.trim()) {
        filter.name = {
            $regex: escapeRegex(search.trim()),
            $options: "i"
        };
    }

    if (category && category !== "All") {
        filter.category = category;
    }

    const sortOptions = {
        newest: { createdAt: -1 },
        "price-asc": { price: 1 },
        "price-desc": { price: -1 },
        name: { name: 1 }
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;

    const [products, total] = await Promise.all([
        Product.find(filter)
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
// GET /api/products/:id
// @access Public
// =====================================================

const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

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
    const { name, description, price, category, image, stock } = req.body;

    if (!isValidPrice(price)) {
        return res.status(400).json({
            success: false,
            message: "Price must be a number greater than or equal to 0"
        });
    }

    const product = await Product.create({
        name,
        description,
        price,
        category,
        image,
        stock
    });

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
    const { name, description, price, category, image, stock } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (image !== undefined) product.image = image;
    if (stock !== undefined) product.stock = stock;

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

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
