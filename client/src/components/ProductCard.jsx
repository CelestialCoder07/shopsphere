import { Link } from "react-router-dom";

import { useCart, useToast } from "../context/hooks";
import { LOW_STOCK_THRESHOLD } from "../utils/catalog";
import { discountPercent } from "../utils/format";
import Price from "./Price";
import ProductImage from "./ProductImage";
import { Stars } from "./Stars";
import WishlistButton from "./WishlistButton";
import { CheckIcon, PlusIcon } from "./icons";

export default function ProductCard({ product }) {
    const { addToCart, quantityOf } = useCart();
    const { notify } = useToast();

    const inCart = quantityOf(product._id);
    const outOfStock = product.stock <= 0;
    const maxedOut = !outOfStock && inCart >= product.stock;
    const lowStock = !outOfStock && product.stock <= LOW_STOCK_THRESHOLD;
    const off = discountPercent(product);
    const href = `/products/${product._id}`;

    const handleAdd = () => {
        addToCart(product);
        notify(`${product.name} added to your cart`);
    };

    let label = "Add to cart";
    if (outOfStock) label = "Sold out";
    else if (maxedOut) label = "All in cart";
    else if (inCart > 0) label = `Add another (${inCart})`;

    return (
        <article className={`product-card${outOfStock ? " is-soldout" : ""}`}>
            <Link to={href} className="product-card__media" tabIndex={-1} aria-hidden="true">
                <ProductImage src={product.image} alt="" />

                <div className="product-card__flags">
                    {off > 0 && <span className="badge badge--sale">−{off}%</span>}
                    {outOfStock && <span className="badge badge--danger">Sold out</span>}
                    {lowStock && <span className="badge badge--amber">Only {product.stock} left</span>}
                </div>
            </Link>

            <div className="product-card__wish">
                <WishlistButton product={product} />
            </div>

            <div className="product-card__body">
                <div className="product-card__meta">
                    <span className="product-card__brand">{product.brand || product.category}</span>
                    {product.numReviews > 0 && (
                        <Stars rating={product.rating} count={product.numReviews} size={12} />
                    )}
                </div>

                <Link to={href} className="product-card__name clamp-2">
                    {product.name}
                </Link>

                <div className="product-card__foot">
                    <Price product={product} size="sm" />

                    <button
                        type="button"
                        className={`btn btn--sm product-card__add ${inCart > 0 ? "btn--outline" : "btn--primary"}`}
                        onClick={handleAdd}
                        disabled={outOfStock || maxedOut}
                        aria-label={`Add ${product.name} to cart`}
                        title={label}
                    >
                        {inCart > 0 && !outOfStock ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
                        <span className="product-card__add-label">{outOfStock ? "Sold out" : inCart > 0 ? inCart : "Add"}</span>
                    </button>
                </div>
            </div>
        </article>
    );
}
