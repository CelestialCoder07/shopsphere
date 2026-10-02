import { Link } from "react-router-dom";

import { fetchWishlist } from "../api/users";
import { useAuth } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import ProductCard from "../components/ProductCard";
import { EmptyState, ErrorState, SkeletonGrid } from "../components/Feedback";
import { ArrowRightIcon, HeartIcon } from "../components/icons";
import { pluralize } from "../utils/format";

export default function Wishlist() {
    const { user } = useAuth();
    const { data, error, reload } = useAsync(fetchWishlist, []);

    // Hide items un-hearted on this page without refetching.
    const savedIds = new Set(user?.wishlist ?? []);
    const products = (data ?? []).filter((product) => savedIds.has(product._id));

    let content;

    if (error && !data) {
        content = <ErrorState error={error} onRetry={reload} />;
    } else if (!data) {
        content = <SkeletonGrid count={4} />;
    } else if (products.length === 0) {
        content = (
            <EmptyState
                icon={<HeartIcon size={24} />}
                title="Your wishlist is empty"
                action={
                    <Link to="/" className="btn btn--primary">
                        Discover products <ArrowRightIcon />
                    </Link>
                }
            >
                Tap the heart on any product to save it here for later.
            </EmptyState>
        );
    } else {
        content = (
            <div className="grid-auto">
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        );
    }

    return (
        <div className="page orders">
            <div className="section-head">
                <h1 className="display display--lg">Wishlist</h1>
                {products.length > 0 && <span className="eyebrow">{pluralize(products.length, "item")}</span>}
            </div>

            {content}
        </div>
    );
}
