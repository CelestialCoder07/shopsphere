import { discountPercent, formatCurrency } from "../utils/format";

// Current price, with the original struck through when on sale.
export default function Price({ product, size = "md" }) {
    const off = discountPercent(product);

    return (
        <span className={`price-tag price-tag--${size}`}>
            <span className="price-tag__now">{formatCurrency(product.price)}</span>
            {off > 0 && (
                <>
                    <s className="price-tag__was">{formatCurrency(product.compareAtPrice)}</s>
                    {size !== "sm" && <span className="price-tag__off">{off}% off</span>}
                </>
            )}
        </span>
    );
}
