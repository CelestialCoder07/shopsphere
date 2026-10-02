const express = require("express");

const router = express.Router();

const {
    getProducts,
    getCategories,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    upsertReview,
    deleteReview
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

// Public routes. "/categories" must come before "/:id".
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProductById);

// Signed-in customers
router.post("/:id/reviews", protect, upsertReview);
router.delete("/:id/reviews", protect, deleteReview);

// Admin-protected routes
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
