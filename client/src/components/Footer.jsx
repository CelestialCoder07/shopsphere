import { Link } from "react-router-dom";

import useCategories from "../hooks/useCategories";

export default function Footer() {
    const year = new Date().getFullYear();
    const { names } = useCategories();

    return (
        <footer className="footer">
            <div className="page">
                <div className="footer__inner">
                    <div>
                        <p className="footer__title">ShopSphere</p>
                        <p className="muted text-sm footer__blurb">
                            A curated store for sneakers, tech, everyday
                            carry and home goods, with honest reviews and
                            secure checkout powered by Stripe.
                        </p>
                    </div>

                    <div>
                        <p className="eyebrow footer__heading">Shop</p>
                        <ul className="footer__list">
                            <li><Link to="/">All products</Link></li>
                            {names.map((category) => (
                                <li key={category}>
                                    <Link to={`/?category=${encodeURIComponent(category)}`}>
                                        {category}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="eyebrow footer__heading">Account</p>
                        <ul className="footer__list">
                            <li><Link to="/cart">Cart</Link></li>
                            <li><Link to="/wishlist">Wishlist</Link></li>
                            <li><Link to="/orders">Order history</Link></li>
                            <li><Link to="/profile">Profile</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="footer__bar">
                    <span>© {year} ShopSphere</span>
                    <span className="mono">Payments secured by Stripe</span>
                </div>
            </div>
        </footer>
    );
}
