// =====================================================
// FORMATTERS
// =====================================================

const CURRENCY = "INR";
const LOCALE = "en-IN";

const currencyFormatters = new Map();

const getCurrencyFormatter = (hasDecimals) => {
    const key = hasDecimals ? "decimals" : "whole";

    if (!currencyFormatters.has(key)) {
        currencyFormatters.set(
            key,
            new Intl.NumberFormat(LOCALE, {
                style: "currency",
                currency: CURRENCY,
                minimumFractionDigits: hasDecimals ? 2 : 0,
                maximumFractionDigits: 2
            })
        );
    }

    return currencyFormatters.get(key);
};

// ₹499 for whole amounts, ₹499.50 when there are paise.
export const formatCurrency = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "—";
    }

    return getCurrencyFormatter(!Number.isInteger(amount)).format(amount);
};

const parseDate = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value) => {
    const date = parseDate(value);

    if (!date) {
        return "—";
    }

    return date.toLocaleDateString(LOCALE, {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

export const formatDateTime = (value) => {
    const date = parseDate(value);

    if (!date) {
        return "—";
    }

    const time = date.toLocaleTimeString(LOCALE, {
        hour: "2-digit",
        minute: "2-digit"
    });

    return `${formatDate(date)} · ${time}`;
};

// Mongo ids are long; show the tail so they stay readable and
// never overflow their container.
export const shortId = (id) => {
    const value = String(id ?? "");
    return value ? `#${value.slice(-8).toUpperCase()}` : "—";
};

export const initials = (name) => {
    const parts = String(name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "?";
    }

    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

    return `${first}${last}`.toUpperCase();
};

export const pluralize = (count, singular, pluralForm) => {
    const plural = pluralForm === undefined ? `${singular}s` : pluralForm;
    return `${count} ${count === 1 ? singular : plural}`;
};

export const formatStockLabel = (stock) => {
    const count = Number(stock);

    if (!Number.isFinite(count) || count <= 0) {
        return "Out of stock";
    }

    if (count <= 5) {
        return `Only ${count} left`;
    }

    return `${count} in stock`;
};

// Whole-percent discount when a product is on sale, else 0.
export const discountPercent = (product) => {
    const price = Number(product?.price);
    const compareAtPrice = Number(product?.compareAtPrice);

    if (!compareAtPrice || compareAtPrice <= price) return 0;

    return Math.round((1 - price / compareAtPrice) * 100);
};
