import { Link } from "react-router-dom";

import { CATEGORIES } from "../utils/catalog";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="page">
                <div className="footer__inner">
                    <div>
                        <p className="footer__title">ShopSphere</p>
                        <p className="muted text-sm footer__blurb">
                            A small, carefully chosen catalog of shoes,
                            electronics and accessories, with secure
                            checkout powered by Stripe.
                        </p>
                    </div>

                    <div>
                        <p className="eyebrow footer__heading">Shop</p>
                        <ul className="footer__list">
                            <li><Link to="/">All products</Link></li>
                            {CATEGORIES.map((category) => (
                                <li key={category}>
                                    <Link to={`/?category=${category}`}>
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
