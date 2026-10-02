// =====================================================
// ORDER ENDPOINTS
// =====================================================

import { request } from "./client";

const asOrderList = (data) => {
    return Array.isArray(data?.orders) ? data.orders : [];
};

export const fetchMyOrders = async () => {
    const data = await request({
        method: "get",
        url: "/orders/myorders"
    });

    return asOrderList(data);
};

export const fetchAllOrders = async () => {
    const data = await request({
        method: "get",
        url: "/orders"
    });

    return asOrderList(data);
};

export const updateOrderStatus = async (orderId, status) => {
    const data = await request({
        method: "put",
        url: `/orders/${orderId}/status`,
        data: { status }
    });

    return data.order;
};

// Customers can drop an order they never paid for.
export const cancelOrder = async (orderId) => {
    const data = await request({
        method: "put",
        url: `/orders/${orderId}/cancel`
    });

    return data.order;
};
