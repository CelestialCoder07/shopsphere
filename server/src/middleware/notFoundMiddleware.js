// =====================================================
// 404 HANDLER
// =====================================================
// Reached when no route matched the request.

const notFound = (req, res, next) => {
    const error = new Error(
        `Route not found: ${req.method} ${req.originalUrl}`
    );

    error.statusCode = 404;

    next(error);
};

module.exports = notFound;
