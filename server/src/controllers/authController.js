const User = require("../models/User");
const jwt = require("jsonwebtoken");

const TOKEN_LIFETIME = "7d";

// =====================================================
// HELPERS
// =====================================================

const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_LIFETIME }
    );
};

const toPublicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
});

// =====================================================
// REGISTER
// @route  POST /api/auth/register
// @access Public
// =====================================================

const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email and password are all required"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: "An account with that email already exists"
        });
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password
    });

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: toPublicUser(user)
    });
};

// =====================================================
// LOGIN
// @route  POST /api/auth/login
// @access Public
// =====================================================

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    // `password` is `select: false`, so ask for it explicitly.
    const user = await User.findOne({
        email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: toPublicUser(user)
    });
};

// =====================================================
// PROFILE
// @route  GET /api/auth/profile
// @access Private
// =====================================================

const getProfile = async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    res.status(200).json({
        success: true,
        user: toPublicUser(user)
    });
};

module.exports = {
    register,
    login,
    getProfile
};
