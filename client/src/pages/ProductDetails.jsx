import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { deleteReview, fetchProduct, fetchProducts, submitReview } from "../api/products";
import { useAuth, useCart, useToast } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import Price from "../components/Price";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import QuantityStepper from "../components/QuantityStepper";
import { Stars, StarInput } from "../components/Stars";
import WishlistButton from "../components/WishlistButton";
import { Alert, EmptyState, ErrorState, Loading } from "../components/Feedback";
import {
    CartIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ShieldIcon,
    TruckIcon
} from "../components/icons";
import { LOW_STOCK_THRESHOLD } from "../utils/catalog";
import { discountPercent, formatCurrency, formatDate, formatStockLabel, initials, pluralize } from "../utils/format";

// -----------------------------------------------------
// Buy box
// -----------------------------------------------------

function BuyBox({ product }) {
    const { addToCart, quantityOf } = useCart();
    const { notify } = useToast();

    const inCart = quantityOf(product._id);
    const available = Math.max(0, product.stock - inCart);
    const [requested, setRequested] = useState(1);
    const quantity = Math.min(Math.max(requested, 1), Math.max(available, 1));

    const handleAdd = () => {
        addToCart(product, quantity);
        notify(`${quantity} × ${product.name} added to your cart`);
        setRequested(1);
    };

    return (
        <>
            <div className="detail__buy">
                {product.stock > 0 && (
                    <QuantityStepper
                        value={quantity}
                        max={Math.max(available, 1)}
                        onChange={setRequested}
                    />
                )}

                <button
                    type="button"
                    className="btn btn--accent btn--lg detail__add"
                    onClick={handleAdd}
                    disabled={product.stock <= 0 || available === 0}
                >
                    <CartIcon size={16} />
                    {product.stock <= 0
                        ? "Sold out"
                        : available === 0
                          ? "All stock in your cart"
                          : "Add to cart"}
                </button>

                <WishlistButton product={product} variant="button" />
            </div>

            {inCart > 0 && (
                <p className="detail__incart text-sm">
                    {inCart} in your cart ·{" "}
                    <Link to="/cart" className="link-underline">Go to cart</Link>
                </p>
            )}
        </>
    );
}

// -----------------------------------------------------
// Reviews
// -----------------------------------------------------

function RatingBreakdown({ reviews, rating, total }) {
    const counts = [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: reviews.filter((review) => review.rating === stars).length
    }));

    return (
        <div className="breakdown">
            <div className="breakdown__score">
                <span className="breakdown__value">{total > 0 ? rating.toFixed(1) : "—"}</span>
                <Stars rating={rating} size={16} />
                <span className="muted text-sm">{pluralize(total, "review")}</span>
            </div>

            <ul className="breakdown__bars">
                {counts.map(({ stars, count }) => (
                    <li key={stars} className="breakdown__row">
                        <span className="breakdown__label">{stars}★</span>
                        <span className="breakdown__track">
                            <span
                                className="breakdown__fill"
                                style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                            />
                        </span>
                        <span className="breakdown__count">{count}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ReviewForm({ productId, existing, onSaved }) {
    const { notify } = useToast();
    const [rating, setRating] = useState(existing?.rating ?? 0);
    const [comment, setComment] = useState(existing?.comment ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!rating) {
            setError("Pick a star rating first.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await submitReview(productId, { rating, comment });
            notify(existing ? "Your review was updated" : "Thanks for your review!");
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);

        try {
            await deleteReview(productId);
            notify("Your review was removed");
            onSaved();
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    return (
        <form className="review-form" onSubmit={handleSubmit}>
            <h3 className="review-form__title">{existing ? "Edit your review" : "Write a review"}</h3>

            <Alert>{error}</Alert>

            <StarInput value={rating} onChange={setRating} />

            <label className="field">
                <span className="field__label">Your thoughts (optional)</span>
                <textarea
                    className="textarea"
                    maxLength={1000}
                    placeholder="What did you like or dislike?"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                />
            </label>

            <div className="cluster">
                <button type="submit" className="btn btn--primary" disabled={saving}>
                    {saving ? "Saving…" : existing ? "Update review" : "Post review"}
                </button>
                {existing && (
                    <button type="button" className="btn btn--ghost" onClick={handleDelete} disabled={saving}>
                        Delete
                    </button>
                )}
            </div>
        </form>
    );
}

function Reviews({ product, onChanged }) {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();
    const reviews = product.reviews ?? [];
    const mine = user ? reviews.find((review) => String(review.user) === String(user.id)) : null;

    return (
        <section className="reviews" id="reviews">
            <div className="section-head">
                <h2 className="display display--sm">Customer reviews</h2>
            </div>

            <div className="reviews__grid">
                <aside className="reviews__side">
                    <RatingBreakdown reviews={reviews} rating={product.rating} total={product.numReviews} />

                    {isAuthenticated ? (
                        <ReviewForm
                            key={mine ? `${mine._id}-${mine.updatedAt}` : "new"}
                            productId={product._id}
                            existing={mine}
                            onSaved={onChanged}
                        />
                    ) : (
                        <p className="reviews__signin text-sm">
                            <Link to="/login" state={{ from: location }} className="link-underline">
                                Sign in
                            </Link>{" "}
                            to write a review.
                        </p>
                    )}
                </aside>

                <div>
                    {reviews.length === 0 ? (
                        <p className="muted">No reviews yet. Be the first to share what you think.</p>
                    ) : (
                        <ul className="review-list">
                            {reviews.map((review) => (
                                <li className="review" key={review._id}>
                                    <span className="review__avatar">{initials(review.name)}</span>
                                    <div className="review__body">
                                        <div className="review__head">
                                            <span className="strong">{review.name}</span>
                                            {review.verifiedPurchase && (
                                                <span className="review__verified">
                                                    <CheckCircleIcon size={13} /> Verified purchase
                                                </span>
                                            )}
                                        </div>
                                        <div className="review__meta">
                                            <Stars rating={review.rating} size={13} />
                                            <span className="muted text-xs">{formatDate(review.createdAt)}</span>
                                        </div>
                                        {review.comment && <p className="review__text">{review.comment}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}

// -----------------------------------------------------
// Related
// -----------------------------------------------------

function RelatedProducts({ product }) {
    const related = useAsync(
        () => fetchProducts({ category: product.category, sort: "rating", limit: 5 }),
        [product.category]
    );

    const items = (related.data?.products ?? [])
        .filter((item) => item._id !== product._id)
        .slice(0, 4);

    if (items.length === 0) return null;

    return (
        <section className="related">
            <div className="section-head">
                <h2 className="display display--sm">You may also like</h2>
                <Link to={`/?category=${encodeURIComponent(product.category)}`} className="link-underline text-sm">
                    More {product.category}
                </Link>
            </div>

            <div className="grid-auto">
                {items.map((item) => (
                    <ProductCard key={item._id} product={item} />
                ))}
            </div>
        </section>
    );
}

// -----------------------------------------------------
// Page
// -----------------------------------------------------

export default function ProductDetails() {
    const { id } = useParams();
    const { data: product, error, loading, reload } = useAsync(() => fetchProduct(id), [id]);

    if (error && !product) {
        const notFound = error.status === 404 || error.status === 400;

        return (
            <div className="page detail">
                {notFound ? (
                    <EmptyState
                        title="Product not found"
                        action={<Link to="/" className="btn btn--primary">Back to the shop</Link>}
                    >
                        This product may have been removed or the link is incorrect.
                    </EmptyState>
                ) : (
                    <ErrorState error={error} onRetry={reload} />
                )}
            </div>
        );
    }

    if (!product || (loading && product._id !== id)) {
        return (
            <div className="page detail">
                <Loading label="Loading product…" />
            </div>
        );
    }

    const lowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
    const off = discountPercent(product);

    return (
        <div className="page detail">
            <nav className="detail__crumbs" aria-label="Breadcrumb">
                <Link to="/">Shop</Link>
                <ChevronRightIcon size={12} />
                <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
                <ChevronRightIcon size={12} />
                <span className="clamp-1">{product.name}</span>
            </nav>

            <div className="detail__grid">
                <div className="detail__media">
                    <div className="detail__frame">
                        <ProductImage src={product.image} alt={product.name} iconSize={64} />
                        {off > 0 && <span className="badge badge--sale detail__sale">−{off}%</span>}
                    </div>
                </div>

                <div>
                    <p className="detail__brand">{product.brand || product.category}</p>
                    <h1 className="display detail__title">{product.name}</h1>

                    <a href="#reviews" className="detail__rating">
                        {product.numReviews > 0 ? (
                            <Stars rating={product.rating} count={product.numReviews} size={15} showValue />
                        ) : (
                            <span className="muted text-sm">No reviews yet</span>
                        )}
                    </a>

                    <div className="detail__price">
                        <Price product={product} size="lg" />
                        {off > 0 && (
                            <p className="detail__save">
                                You save {formatCurrency(product.compareAtPrice - product.price)}
                            </p>
                        )}
                        <p className="muted text-xs">Inclusive of all taxes</p>
                    </div>

                    <p className="detail__desc">{product.description}</p>

                    <p className={`detail__stock${product.stock <= 0 ? " is-out" : lowStock ? " is-low" : ""}`}>
                        <span className="detail__stock-dot" />
                        {formatStockLabel(product.stock)}
                    </p>

                    <BuyBox key={product._id} product={product} />

                    <ul className="detail__perks">
                        <li>
                            <TruckIcon />
                            <span>Free shipping on every order</span>
                        </li>
                        <li>
                            <ShieldIcon />
                            <span>Secure payment through Stripe Checkout</span>
                        </li>
                    </ul>

                    <dl className="detail__specs">
                        <div className="detail__spec">
                            <dt>Brand</dt>
                            <dd>{product.brand || "—"}</dd>
                        </div>
                        <div className="detail__spec">
                            <dt>Category</dt>
                            <dd>{product.category}</dd>
                        </div>
                        <div className="detail__spec">
                            <dt>Listed</dt>
                            <dd>{formatDate(product.createdAt)}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <Reviews product={product} onChanged={reload} />
            <RelatedProducts product={product} />
        </div>
    );
}
