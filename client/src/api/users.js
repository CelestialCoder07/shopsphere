// =====================================================
// USER ENDPOINTS
// =====================================================

import { request } from "./client";

export const fetchWishlist = async () => {
    const data = await request({ method: "get", url: "/users/me/wishlist" });
    return Array.isArray(data.products) ? data.products : [];
};

// Both return the updated list of product ids.
export const addToWishlist = async (productId) => {
    const data = await request({ method: "put", url: `/users/me/wishlist/${productId}` });
    return data.wishlist;
};

export const removeFromWishlist = async (productId) => {
    const data = await request({ method: "delete", url: `/users/me/wishlist/${productId}` });
    return data.wishlist;
};
