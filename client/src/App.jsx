import { Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import PaymentSuccess from "./pages/PaymentSuccess";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";

const signedIn = (element) => <ProtectedRoute>{element}</ProtectedRoute>;
const adminOnly = (element) => <ProtectedRoute adminOnly>{element}</ProtectedRoute>;

export default function App() {
    return (
        <div className="app-shell">
            <ScrollToTop />
            <Navbar />

            <main className="page__body">
                <Routes>
                    {/* Storefront */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Signed-in customers */}
                    <Route path="/orders" element={signedIn(<Orders />)} />
                    <Route path="/profile" element={signedIn(<Profile />)} />
                    <Route path="/wishlist" element={signedIn(<Wishlist />)} />
                    <Route path="/payment-success" element={signedIn(<PaymentSuccess />)} />

                    {/* Admin */}
                    <Route path="/admin" element={adminOnly(<AdminDashboard />)} />
                    <Route path="/admin/products" element={adminOnly(<AdminProducts />)} />
                    <Route path="/admin/orders" element={adminOnly(<AdminOrders />)} />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>

            <Footer />
        </div>
    );
}
