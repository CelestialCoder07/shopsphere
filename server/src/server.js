// =====================================================
// ENVIRONMENT
// =====================================================
// Load server/.env explicitly so the API boots the same way
// no matter which directory it is launched from. This must
// happen before anything reads process.env.

const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, "..", ".env")
});

const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

// =====================================================
// START
// =====================================================

const start = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

start().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
});
