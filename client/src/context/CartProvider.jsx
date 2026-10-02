import { useCallback, useEffect, useMemo, useState } from "react";

import { CartContext } from "./contexts";
import { STORAGE_KEYS, readJson, writeJson } from "../utils/storage";

// Only the fields the cart UI needs are kept, so the stored
// cart stays small and never carries stale extras.
const toCartItem = (product, quantity) => ({
    _id: product._id,
    name: product.name,
    brand: product.brand || "",
    price: product.price,
    compareAtPrice: product.compareAtPrice || null,
    image: product.image || "",
    category: product.category,
    stock: product.stock,
    quantity
});

const readStoredCart = () => {
    const stored = readJson(STORAGE_KEYS.cart, []);

    return Array.isArray(stored)
        ? stored.filter((item) => item && item._id && item.quantity > 0)
        : [];
};

export default function CartProvider({ children }) {
    const [cart, setCart] = useState(readStoredCart);

    useEffect(() => {
        writeJson(STORAGE_KEYS.cart, cart);
    }, [cart]);

    const addToCart = useCallback((product, quantity = 1) => {
        setCart((current) => {
            const existing = current.find((item) => item._id === product._id);
            const inCart = existing ? existing.quantity : 0;
            const next = Math.min(inCart + quantity, product.stock);

            if (next <= inCart) {
                return current;
            }

            if (existing) {
                return current.map((item) =>
                    item._id === product._id
                        ? toCartItem(product, next)
                        : item
                );
            }

            return [...current, toCartItem(product, next)];
        });
    }, []);

    const setQuantity = useCallback((productId, quantity) => {
        setCart((current) =>
            current
                .map((item) =>
                    item._id === productId
                        ? {
                              ...item,
                              quantity: Math.min(quantity, item.stock)
                          }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCart((current) =>
            current.filter((item) => item._id !== productId)
        );
    }, []);

    // Returning the same array when already empty avoids a
    // pointless re-render for every consumer.
    const clearCart = useCallback(() => {
        setCart((current) => (current.length === 0 ? current : []));
    }, []);

    // Reconcile the stored cart with live product data: refresh
    // prices and stock, clamp quantities, drop deleted products.
    const syncCart = useCallback((freshById) => {
        setCart((current) => {
            let changed = false;

            const next = current.flatMap((item) => {
                if (!freshById.has(item._id)) {
                    return [item];
                }

                const fresh = freshById.get(item._id);

                if (!fresh || fresh.stock <= 0) {
                    changed = true;
                    return [];
                }

                const quantity = Math.min(item.quantity, fresh.stock);
                const updated = toCartItem(fresh, quantity);

                if (
                    updated.price !== item.price ||
                    updated.compareAtPrice !== item.compareAtPrice ||
                    updated.stock !== item.stock ||
                    updated.quantity !== item.quantity ||
                    updated.name !== item.name ||
                    updated.image !== item.image
                ) {
                    changed = true;
                }

                return [updated];
            });

            return changed ? next : current;
        });
    }, []);

    const value = useMemo(() => {
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const savings = cart.reduce(
            (sum, item) =>
                item.compareAtPrice > item.price
                    ? sum + (item.compareAtPrice - item.price) * item.quantity
                    : sum,
            0
        );

        return {
            cart,
            itemCount,
            subtotal,
            savings,
            quantityOf: (productId) =>
                cart.find((item) => item._id === productId)?.quantity ?? 0,
            addToCart,
            setQuantity,
            removeFromCart,
            clearCart,
            syncCart
        };
    }, [cart, addToCart, setQuantity, removeFromCart, clearCart, syncCart]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}
