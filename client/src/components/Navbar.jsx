import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth, useCart } from "../context/hooks";
import useSignOut from "../hooks/useSignOut";
import useWishlist from "../hooks/useWishlist";
import { initials } from "../utils/format";
import { CartIcon, CloseIcon, HeartIcon, LogoutIcon, MenuIcon } from "./icons";

const linkClass = ({ isActive }) => `nav__link${isActive ? " is-active" : ""}`;

export default function Navbar() {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const { itemCount } = useCart();
    const signOut = useSignOut();
    const { count: wishlistCount } = useWishlist();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const closeDrawer = () => setDrawerOpen(false);

    const handleLogout = () => {
        closeDrawer();
        signOut();
    };

    const links = (
        <>
            <NavLink to="/" end className={linkClass} onClick={closeDrawer}>
                Shop
            </NavLink>

            {isAuthenticated && (
                <NavLink to="/orders" className={linkClass} onClick={closeDrawer}>
                    Orders
                </NavLink>
            )}

            {isAdmin && (
                <NavLink to="/admin" className={linkClass} onClick={closeDrawer}>
                    Admin
                </NavLink>
            )}
        </>
    );

    return (
        <header className="nav">
            <div className="page">
                <div className="nav__inner">
                    <Link to="/" className="nav__brand" onClick={closeDrawer}>
                        <span className="nav__mark" aria-hidden="true">●</span>
                        <span className="nav__wordmark">ShopSphere</span>
                        <span className="nav__tag">Curated goods</span>
                    </Link>

                    <nav className="nav__links" aria-label="Main">
                        {links}
                    </nav>

                    <div className="nav__actions">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/profile"
                                    className="nav__identity"
                                    title="Your profile"
                                >
                                    <span className="nav__avatar">
                                        {initials(user?.name)}
                                    </span>
                                    <span className="nav__identity-name">
                                        {user?.name?.split(" ")[0] || "Account"}
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    className="btn btn--ghost nav__logout"
                                    onClick={handleLogout}
                                    title="Sign out"
                                    aria-label="Sign out"
                                >
                                    <LogoutIcon />
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="btn btn--ghost nav__signin">
                                Sign in
                            </Link>
                        )}

                        {isAuthenticated && (
                            <Link
                                to="/wishlist"
                                className="nav__wish"
                                aria-label={`Wishlist, ${wishlistCount} items`}
                                title="Wishlist"
                            >
                                <HeartIcon size={17} filled={wishlistCount > 0} />
                                {wishlistCount > 0 && <span className="nav__wish-count">{wishlistCount}</span>}
                            </Link>
                        )}

                        <Link
                            to="/cart"
                            className="nav__cart"
                            aria-label={`Cart, ${itemCount} items`}
                        >
                            <CartIcon size={16} />
                            <span className="nav__cart-label">Cart</span>
                            <span className="nav__cart-count">{itemCount}</span>
                        </Link>

                        <button
                            type="button"
                            className="nav__burger"
                            onClick={() => setDrawerOpen((open) => !open)}
                            aria-expanded={drawerOpen}
                            aria-label={drawerOpen ? "Close menu" : "Open menu"}
                        >
                            {drawerOpen ? <CloseIcon size={18} /> : <MenuIcon />}
                        </button>
                    </div>
                </div>

                <nav
                    className={`nav__drawer${drawerOpen ? " is-open" : ""}`}
                    aria-label="Mobile"
                >
                    {links}

                    {isAuthenticated ? (
                        <>
                            <NavLink to="/wishlist" className={linkClass} onClick={closeDrawer}>
                                Wishlist
                            </NavLink>
                            <NavLink to="/profile" className={linkClass} onClick={closeDrawer}>
                                Profile
                            </NavLink>
                            <button
                                type="button"
                                className="nav__link nav__drawer-button"
                                onClick={handleLogout}
                            >
                                Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className={linkClass} onClick={closeDrawer}>
                                Sign in
                            </NavLink>
                            <NavLink to="/register" className={linkClass} onClick={closeDrawer}>
                                Create account
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
