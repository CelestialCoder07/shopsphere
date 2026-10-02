import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { createCheckoutSession } from "../api/payment";
import { fetchProduct } from "../api/products";
import { useAuth, useCart } from "../context/hooks";
import ProductImage from "../components/ProductImage";
import QuantityStepper from "../components/QuantityStepper";
import { Alert, EmptyState } from "../components/Feedback";
import { ArrowRightIcon, CartIcon, ShieldIcon, TrashIcon } from "../components/icons";
import { formatCurrency, formatStockLabel, pluralize } from "../utils/format";

// Refresh price and stock for everything in the cart so the
// totals shown here match what Stripe will charge.
function useCartSync() {
    const { cart, syncCart } = useCart();
    const idsKey = cart.map((item) => item._id).sort().join(",");

    useEffect(() => {
        if (!idsKey) return undefined;

        let cancelled = false;
        const ids = idsKey.split(",");

        Promise.allSettled(ids.map((id) => fetchProduct(id))).then((results) => {
            if (cancelled) return;

            const freshById = new Map();

            results.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    freshById.set(ids[index], result.value);
                } else if (result.reason?.status === 404 || result.reason?.status === 400) {
                    // Product was deleted: mark it for removal.
                    freshById.set(ids[index], null);
                }
                // Network errors leave the item untouched.
            });

            syncCart(freshById);
        });

        return () => {
            cancelled = true;
        };
    }, [idsKey, syncCart]);
}

function CartLine({ item }) {
    const { setQuantity, removeFromCart } = useCart();
    const href = `/products/${item._id}`;

    return (
        <li className="cart-line">
            <Link to={href} className="cart-line__media">
                <ProductImage src={item.image} alt={item.name} iconSize={24} />
            </Link>

            <div>
                <p className="eyebrow">{item.brand || item.category}</p>
                <Link to={href} className="cart-line__name">{item.name}</Link>
                <p className="cart-line__unit">
                    {formatCurrency(item.price)} each · {formatStockLabel(item.stock)}
                </p>
            </div>

            <div className="cart-line__controls">
                <span className="cart-line__total">
                    {formatCurrency(item.price * item.quantity)}
                </span>

                <div className="cluster">
                    <QuantityStepper
                        value={item.quantity}
                        min={1}
                        max={item.stock}
                        onChange={(quantity) => setQuantity(item._id, quantity)}
                        label={`Quantity of ${item.name}`}
                    />

                    <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => removeFromCart(item._id)}
                        aria-label={`Remove ${item.name}`}
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>
        </li>
    );
}

export default function Cart() {
    const { cart, itemCount, subtotal, savings } = useCart();
    const { isAuthenticated } = useAuth();

    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState("");

    useCartSync();

    const handleCheckout = async () => {
        setError("");
        setRedirecting(true);

        try {
            const { url } = await createCheckoutSession(cart);
            window.location.assign(url);
        } catch (err) {
            setError(err.message || "Unable to start checkout. Please try again.");
            setRedirecting(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="page cart">
                <div className="section-head">
                    <h1 className="display display--lg">Your cart</h1>
                </div>

                <EmptyState
                    icon={<CartIcon size={24} />}
                    title="Your cart is empty"
                    action={
                        <Link to="/" className="btn btn--primary">
                            Start shopping <ArrowRightIcon />
                        </Link>
                    }
                >
                    Browse the catalog and add something you love. It will
                    wait here for you.
                </EmptyState>
            </div>
        );
    }

    return (
        <div className="page cart">
            <div className="section-head">
                <h1 className="display display--lg">Your cart</h1>
                <span className="eyebrow">{pluralize(itemCount, "item")}</span>
            </div>

            <div className="cart__grid">
                <ul className="cart__lines">
                    {cart.map((item) => (
                        <CartLine key={item._id} item={item} />
                    ))}
                </ul>

                <aside className="summary">
                    <p className="eyebrow summary__eyebrow">Order summary</p>

                    <div className="summary__rows">
                        <div className="summary__row">
                            <span className="muted">Subtotal · {pluralize(itemCount, "item")}</span>
                            <span className="price">{formatCurrency(subtotal)}</span>
                        </div>
                        {savings > 0 && (
                            <div className="summary__row summary__row--save">
                                <span>Sale savings</span>
                                <span className="price">−{formatCurrency(savings)}</span>
                            </div>
                        )}
                        <div className="summary__row">
                            <span className="muted">Shipping</span>
                            <span>Free</span>
                        </div>
                    </div>

                    <div className="summary__total">
                        <span className="strong">Total</span>
                        <span className="summary__total-value">{formatCurrency(subtotal)}</span>
                    </div>

                    <Alert>{error}</Alert>

                    {isAuthenticated ? (
                        <button
                            type="button"
                            className="btn btn--accent btn--lg btn--block summary__cta"
                            onClick={handleCheckout}
                            disabled={redirecting}
                        >
                            {redirecting ? (
                                <>
                                    <span className="spinner spinner--light" /> Redirecting to Stripe…
                                </>
                            ) : (
                                <>
                                    Checkout <ArrowRightIcon />
                                </>
                            )}
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            state={{ from: { pathname: "/cart" } }}
                            className="btn btn--primary btn--lg btn--block summary__cta"
                        >
                            Sign in to checkout
                        </Link>
                    )}

                    <p className="summary__note">
                        <ShieldIcon size={14} />
                        You'll enter your delivery address and pay on Stripe's
                        secure checkout page. Prices are confirmed again at payment.
                    </p>
                </aside>
            </div>
        </div>
    );
}
