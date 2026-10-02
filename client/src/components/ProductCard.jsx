import { Link } from "react-router-dom";

import { useCart, useToast } from "../context/hooks";
import { formatCurrency } from "../utils/format";
import { LOW_STOCK_THRESHOLD } from "../utils/catalog";
import ProductImage from "./ProductImage";
import { CheckIcon, PlusIcon } from "./icons";

export default function ProductCard({ product }) {
    const { addToCart, quantityOf } = useCart();
    const { notify } = useToast();

    const inCart = quantityOf(product._id);
    const outOfStock = product.stock <= 0;
    const maxedOut = !outOfStock && inCart >= product.stock;
    const lowStock = !outOfStock && product.stock <= LOW_STOCK_THRESHOLD;
    const href = `/products/${product._id}`;

    const handleAdd = () => {
        addToCart(product);
        notify(`${product.name} added to your cart`);
    };

    let label = "Add";
    if (outOfStock) label = "Sold out";
    else if (maxedOut) label = "In cart";

    return (
        <article className={`product-card${outOfStock ? " is-soldout" : ""}`}>
            <Link to={href} className="product-card__media" tabIndex={-1}>
                <ProductImage src={product.image} alt={product.name} />

                <div className="product-card__flags">
                    <span className="badge">{product.category}</span>
                    {outOfStock && <span className="badge badge--danger">Sold out</span>}
                    {lowStock && (
                        <span className="badge badge--amber">
                            Only {product.stock} left
                        </span>
                    )}
                </div>
            </Link>

            <div className="product-card__body">
                <Link to={href} className="product-card__name clamp-2">
                    {product.name}
                </Link>

                <p className="product-card__desc clamp-2">
                    {product.description}
                </p>

                <div className="product-card__foot">
                    <div>
                        <span className="product-card__unit">Price</span>
                        <span className="product-card__price">
                            {formatCurrency(product.price)}
                        </span>
                    </div>

                    <button
                        type="button"
                        className={`btn btn--sm ${inCart > 0 ? "btn--outline" : "btn--primary"}`}
                        onClick={handleAdd}
                        disabled={outOfStock || maxedOut}
                        aria-label={`Add ${product.name} to cart`}
                    >
                        {inCart > 0 && !outOfStock ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
                        {inCart > 0 && !maxedOut ? `${inCart} · Add` : label}
                    </button>
                </div>
            </div>
        </article>
    );
}
