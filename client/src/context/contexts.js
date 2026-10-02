// =====================================================
// CONTEXT OBJECTS
// =====================================================
// Kept apart from the provider components so fast refresh
// can hot-swap the providers without losing state.

import { createContext } from "react";

export const AuthContext = createContext(null);
export const CartContext = createContext(null);
export const ToastContext = createContext(null);
