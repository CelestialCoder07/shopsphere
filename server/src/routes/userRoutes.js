const express = require("express");

const {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me/wishlist", protect, getWishlist);
router.put("/me/wishlist/:productId", protect, addToWishlist);
router.delete("/me/wishlist/:productId", protect, removeFromWishlist);

module.exports = router;
