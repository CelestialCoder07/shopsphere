// =====================================================
// CATALOG CONSTANTS
// =====================================================

export const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "rating", label: "Top rated" },
    { value: "price-asc", label: "Price: low to high" },
    { value: "price-desc", label: "Price: high to low" },
    { value: "name", label: "Name: A–Z" }
];

export const ORDER_STATUSES = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
];

export const LOW_STOCK_THRESHOLD = 5;

export const statusClass = (status) =>
    `status status--${String(status || "pending").toLowerCase()}`;

export const paymentBadgeClass = (paymentStatus) => {
    if (paymentStatus === "Paid") return "badge badge--moss";
    if (paymentStatus === "Failed") return "badge badge--danger";
    return "badge badge--amber";
};
