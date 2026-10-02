// =====================================================
// AUTH ENDPOINTS
// =====================================================

import { request } from "./client";

// Signs in and returns { token, user }.
export const login = async ({ email, password }) => {
    return request({
        method: "post",
        url: "/auth/login",
        data: { email, password }
    });
};

// Creates an account. The API does not return a token here,
// so the caller sends the user to the login screen next.
export const register = async ({ name, email, password }) => {
    return request({
        method: "post",
        url: "/auth/register",
        data: { name, email, password }
    });
};

export const fetchProfile = async () => {
    const data = await request({
        method: "get",
        url: "/auth/profile"
    });

    return data.user;
};
