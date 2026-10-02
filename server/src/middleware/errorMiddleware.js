// =====================================================
// CENTRALISED ERROR HANDLER
// =====================================================
// Every controller forwards errors here so responses keep
// a single, predictable shape:
//   { success: false, message: "..." }

const DUPLICATE_KEY_CODE = 11000;

const mapError = (error) => {
    // Invalid MongoDB ObjectId
    if (error.name === "CastError") {
        return {
            status: 400,
            message: `Invalid ${error.path}: ${error.value}`
        };
    }

    // Mongoose schema validation
    if (error.name === "ValidationError") {
        const message = Object.values(error.errors)
            .map((field) => field.message)
            .join(", ");

        return { status: 400, message };
    }

    // Unique index violation
    if (error.code === DUPLICATE_KEY_CODE) {
        const field = Object.keys(error.keyValue || {})[0] || "field";

        return {
            status: 409,
            message: `That ${field} is already in use`
        };
    }

    // Invalid JSON body
    if (error.type === "entity.parse.failed") {
        return { status: 400, message: "Malformed JSON body" };
    }

    return {
        status: error.statusCode || 500,
        message: error.message || "Something went wrong"
    };
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
    const { status, message } = mapError(error);

    if (status >= 500) {
        console.error("Unhandled error:", error);
    }

    res.status(status).json({
        success: false,
        message
    });
};

module.exports = errorHandler;
