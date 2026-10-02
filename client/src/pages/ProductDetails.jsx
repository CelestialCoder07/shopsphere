import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { fetchProduct, fetchProducts } from "../api/products";
import { useCart, useToast } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import QuantityStepper from "../components/QuantityStepper";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import {
    CartIcon,
    ChevronRightIcon,
    ShieldIcon,
    TruckIcon
} from "../components/icons";
import { LOW_STOCK_THRESHOLD } from "../utils/catalog";
import { formatCurrency, formatDate, formatStockLabel, shortId } from "../utils/format";

function RelatedProducts({ product }) {
    const related = useAsync(
        () => fetchProducts({ category: product.category, limit: 5 }),
        [product.category]
    );

    const items = (related.data?.products ?? [])
        .filter((item) => item._id !== product._id)
        .slice(0, 4);

    if (items.length === 0) return null;

    return (
        <section className="related">
            <div className="section-head">
                <h2 className="display display--sm">More in {product.category}</h2>
                <Link to={`/?category=${product.category}`} className="link-underline text-sm">
                    View all
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

    if (product.stock <= 0) {
        return (
            <div className="detail__buy">
                <button type="button" className="btn btn--primary btn--lg" disabled>
                    Sold out
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="detail__buy">
                <QuantityStepper
                    value={quantity}
                    max={Math.max(available, 1)}
                    onChange={setRequested}
                />

                <button
                    type="button"
                    className="btn btn--accent btn--lg"
                    onClick={handleAdd}
                    disabled={available === 0}
                >
                    <CartIcon size={16} />
                    {available === 0 ? "All stock in your cart" : "Add to cart"}
                </button>
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

export default function ProductDetails() {
    const { id } = useParams();
    const { data: product, error, loading, reload } = useAsync(() => fetchProduct(id), [id]);

    if (error) {
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

    if (loading || !product) {
        return (
            <div className="page detail">
                <Loading label="Loading product…" />
            </div>
        );
    }

    const lowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;

    return (
        <div className="page detail">
            <nav className="detail__crumbs" aria-label="Breadcrumb">
                <Link to="/">Shop</Link>
                <ChevronRightIcon size={12} />
                <Link to={`/?category=${product.category}`}>{product.category}</Link>
                <ChevronRightIcon size={12} />
                <span className="clamp-1">{product.name}</span>
            </nav>

            <div className="detail__grid">
                <div className="detail__media">
                    <div className="detail__frame">
                        <ProductImage src={product.image} alt={product.name} iconSize={64} />
                    </div>
                </div>

                <div>
                    <div className="cluster">
                        <span className="badge">{product.category}</span>
                        {product.stock <= 0 && <span className="badge badge--danger">Sold out</span>}
                        {lowStock && <span className="badge badge--amber">Low stock</span>}
                    </div>

                    <h1 className="display detail__title">{product.name}</h1>
                    <p className="detail__price">{formatCurrency(product.price)}</p>
                    <p className="detail__desc">{product.description}</p>

                    <p className={`detail__stock${product.stock <= 0 ? " is-out" : lowStock ? " is-low" : ""}`}>
                        <span className="detail__stock-dot" />
                        {formatStockLabel(product.stock)}
                    </p>

                    <BuyBox key={product._id} product={product} />

                    <ul className="detail__perks">
                        <li>
                            <ShieldIcon />
                            <span>Secure payment through Stripe Checkout</span>
                        </li>
                        <li>
                            <TruckIcon />
                            <span>Track the order status from your account</span>
                        </li>
                    </ul>

                    <dl className="detail__specs">
                        <div className="detail__spec">
                            <dt>Category</dt>
                            <dd>{product.category}</dd>
                        </div>
                        <div className="detail__spec">
                            <dt>Item no.</dt>
                            <dd className="mono">{shortId(product._id)}</dd>
                        </div>
                        <div className="detail__spec">
                            <dt>Listed</dt>
                            <dd>{formatDate(product.createdAt)}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <RelatedProducts product={product} />
        </div>
    );
}
