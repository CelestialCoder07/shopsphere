const mongoose = require("mongoose");

// =====================================================
// DATABASE CONNECTION
// =====================================================
// Cached so repeated calls (e.g. from tests) reuse the
// same connection instead of opening a new one.

let connectionPromise = null;

const connectDB = async () => {
    if (connectionPromise) {
        return connectionPromise;
    }

    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error(
            "MONGO_URI is missing. Copy server/.env.example " +
            "to server/.env and set it."
        );
    }

    mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected");
    });

    mongoose.connection.on("error", (error) => {
        console.error("MongoDB connection error:", error.message);
    });

    connectionPromise = mongoose
        .connect(uri, {
            // Fail fast rather than buffering forever when the
            // database is unreachable.
            serverSelectionTimeoutMS: 10000
        })
        .then((instance) => {
            console.log(
                `MongoDB connected: ${instance.connection.host}`
            );

            return instance;
        })
        .catch((error) => {
            connectionPromise = null;
            console.error(
                "MongoDB connection failed:",
                error.message
            );

            process.exit(1);
        });

    return connectionPromise;
};

module.exports = connectDB;
