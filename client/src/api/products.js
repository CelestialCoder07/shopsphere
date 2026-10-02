// =====================================================
// PRODUCT ENDPOINTS
// =====================================================

import { request } from "./client";

const MAX_LIMIT = 60;

/**
 * List products with optional search, category filter and sort.
 * Returns a normalised envelope so callers never guard for
 * missing fields.
 */
export const fetchProducts = async (options = {}) => {
    const { search, category, sort, page, limit } = options;

    const params = {};

    if (search && search.trim()) {
        params.search = search.trim();
    }

    if (category && category !== "All") {
        params.category = category;
    }

    if (sort) {
        params.sort = sort;
    }

    if (page) {
        params.page = page;
    }

    params.limit = Math.min(limit || MAX_LIMIT, MAX_LIMIT);

    const data = await request({
        method: "get",
        url: "/products",
        params
    });

    return {
        products: Array.isArray(data.products) ? data.products : [],
        total: Number(data.total) || 0,
        page: Number(data.page) || 1,
        pages: Number(data.pages) || 1
    };
};

// Walks every page so admin screens see the full catalog,
// not just the first page.
export const fetchAllProducts = async () => {
    const first = await fetchProducts({ page: 1, limit: MAX_LIMIT });
    const products = [...first.products];

    for (let page = 2; page <= first.pages; page += 1) {
        const next = await fetchProducts({ page, limit: MAX_LIMIT });
        products.push(...next.products);
    }

    return products;
};

export const fetchProduct = async (id) => {
    const data = await request({
        method: "get",
        url: `/products/${id}`
    });

    return data.product;
};

export const createProduct = async (payload) => {
    const data = await request({
        method: "post",
        url: "/products",
        data: payload
    });

    return data.product;
};

export const updateProduct = async (id, payload) => {
    const data = await request({
        method: "put",
        url: `/products/${id}`,
        data: payload
    });

    return data.product;
};

export const deleteProduct = async (id) => {
    return request({
        method: "delete",
        url: `/products/${id}`
    });
};
