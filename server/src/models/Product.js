const mongoose = require("mongoose");

// =====================================================
// REVIEW (embedded)
// =====================================================
// Reviews live inside the product document: they are always
// read together with it and a product has a bounded number of
// them. The aggregate (rating, numReviews) is denormalised onto
// the product so listings never have to scan reviews.

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        comment: {
            type: String,
            trim: true,
            maxlength: [1000, "Reviews can be at most 1000 characters"],
            default: ""
        },

        // True when the reviewer has a paid order containing
        // this product at the time of reviewing.
        verifiedPurchase: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// =====================================================
// PRODUCT
// =====================================================

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        brand: {
            type: String,
            trim: true,
            default: ""
        },

        description: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        // The "was" price shown struck through when on sale.
        compareAtPrice: {
            type: Number,
            default: null,
            validate: {
                validator: function (value) {
                    return value === null || value === undefined || value > this.price;
                },
                message: "Compare-at price must be higher than the price"
            }
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        image: {
            type: String,
            default: ""
        },

        stock: {
            type: Number,
            required: true,
            min: 0
        },

        featured: {
            type: Boolean,
            default: false
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        numReviews: {
            type: Number,
            default: 0,
            min: 0
        },

        reviews: [reviewSchema]
    },
    {
        timestamps: true
    }
);

// Indexes back the catalog's filter + sort combinations so
// listing stays an index scan as the catalog grows.
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1, createdAt: -1 });
productSchema.index({ rating: -1, numReviews: -1 });

// Recompute the denormalised rating from the embedded reviews.
productSchema.methods.recalculateRating = function () {
    this.numReviews = this.reviews.length;
    this.rating = this.numReviews === 0
        ? 0
        : Math.round(
            (this.reviews.reduce((sum, review) => sum + review.rating, 0) /
                this.numReviews) * 10
        ) / 10;
};

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
