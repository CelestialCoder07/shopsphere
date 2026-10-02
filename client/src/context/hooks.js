import { useContext } from "react";
import { AuthContext, CartContext, ToastContext } from "./contexts";

const useRequiredContext = (context, name) => {
    const value = useContext(context);

    if (value === null) {
        throw new Error(`${name} must be used inside its provider`);
    }

    return value;
};

export const useAuth = () => useRequiredContext(AuthContext, "useAuth");
export const useCart = () => useRequiredContext(CartContext, "useCart");
export const useToast = () => useRequiredContext(ToastContext, "useToast");
