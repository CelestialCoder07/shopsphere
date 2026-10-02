const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [
                MIN_PASSWORD_LENGTH,
                `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
            ],
            // Never send the hash to the client by default.
            select: false
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        // Saved products. Stored as references; updated with
        // atomic $addToSet / $pull so concurrent taps never
        // duplicate or lose entries.
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        ]
    },
    {
        timestamps: true
    }
);

// Compare a plain-text password with the stored hash.
userSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

// Hash the password whenever it is set or changed.
// NOTE: Mongoose 9 does not pass `next` to async middleware,
// so this hook must simply await and let the promise settle.
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
