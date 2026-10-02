import useWishlist from "../hooks/useWishlist";
import { HeartIcon } from "./icons";

export default function WishlistButton({ product, variant = "icon" }) {
    const { isSaved, toggle } = useWishlist();
    const saved = isSaved(product._id);
    const label = saved ? "Remove from wishlist" : "Save to wishlist";

    if (variant === "button") {
        return (
            <button
                type="button"
                className={`btn btn--outline btn--lg wish-btn${saved ? " is-saved" : ""}`}
                onClick={() => toggle(product)}
                aria-pressed={saved}
            >
                <HeartIcon size={16} filled={saved} />
                {saved ? "Saved" : "Wishlist"}
            </button>
        );
    }

    return (
        <button
            type="button"
            className={`wish-icon${saved ? " is-saved" : ""}`}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggle(product);
            }}
            aria-pressed={saved}
            aria-label={label}
            title={label}
        >
            <HeartIcon size={17} filled={saved} />
        </button>
    );
}
