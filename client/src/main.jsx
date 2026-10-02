import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import AuthProvider from "./context/AuthProvider";
import CartProvider from "./context/CartProvider";
import ToastProvider from "./context/ToastProvider";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <ToastProvider>
                        <App />
                    </ToastProvider>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
