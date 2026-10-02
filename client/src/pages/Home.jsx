import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { fetchProducts } from "../api/products";
import { useAuth } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import useDebouncedValue from "../hooks/useDebouncedValue";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import { EmptyState, ErrorState, SkeletonGrid } from "../components/Feedback";
import {
    ArrowRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CloseIcon,
    SearchIcon
} from "../components/icons";
import { CATEGORIES, SORT_OPTIONS } from "../utils/catalog";
import { formatCurrency, pluralize } from "../utils/format";

const PAGE_SIZE = 12;

const TICKER_ITEMS = [
    "Secure Stripe checkout",
    "Prices verified at checkout",
    "Shoes · Electronics · Accessories",
    "Track every order",
    "New pieces added regularly"
];

// -----------------------------------------------------
// Hero
// -----------------------------------------------------

function Hero({ featured, total }) {
    const { isAuthenticated } = useAuth();

    return (
        <section className="hero">
            <div className="hero__content">
                <p className="eyebrow">The ShopSphere Edit · {new Date().getFullYear()}</p>

                <h1 className="display hero__title">
                    Goods worth <em>keeping</em>.
                </h1>

                <p className="hero__lede">
                    A tight, considered catalog of shoes, electronics and
                    everyday accessories. Fewer things, chosen better,
                    delivered with a checkout you can trust.
                </p>

                <div className="hero__actions">
                    <a href="#catalog" className="btn btn--primary btn--lg">
                        Browse the catalog <ArrowRightIcon />
                    </a>

                    {isAuthenticated ? (
                        <Link to="/orders" className="btn btn--outline btn--lg">
                            Your orders
                        </Link>
                    ) : (
                        <Link to="/register" className="btn btn--outline btn--lg">
                            Create an account
                        </Link>
                    )}
                </div>

                <dl className="hero__stats">
                    <div>
                        <dt className="hero__stat-label">Products</dt>
                        <dd className="hero__stat-value">{total ?? "—"}</dd>
                    </div>
                    <div>
                        <dt className="hero__stat-label">Categories</dt>
                        <dd className="hero__stat-value">{CATEGORIES.length}</dd>
                    </div>
                    <div>
                        <dt className="hero__stat-label">Checkout</dt>
                        <dd className="hero__stat-value">Stripe</dd>
                    </div>
                </dl>
            </div>

            {featured ? (
                <Link to={`/products/${featured._id}`} className="hero__visual">
                    <span className="hero__visual-badge badge badge--accent">New in</span>
                    <div className="hero__visual-frame">
                        <ProductImage src={featured.image} alt={featured.name} iconSize={56} />
                    </div>
                    <div className="hero__visual-caption">
                        <div>
                            <p className="eyebrow">{featured.category}</p>
                            <p className="hero__visual-name">{featured.name}</p>
                        </div>
                        <span className="price">{formatCurrency(featured.price)}</span>
                    </div>
                </Link>
            ) : (
                <div className="hero__visual" aria-hidden="true">
                    <div className="hero__visual-frame skeleton" />
                    <div className="hero__visual-caption">
                        <div className="skeleton" style={{ height: 14, width: "60%" }} />
                    </div>
                </div>
            )}
        </section>
    );
}

function Ticker() {
    // Rendered twice so the CSS loop is seamless.
    const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

    return (
        <div className="ticker" aria-hidden="true">
            <div className="ticker__track">
                {items.map((item, index) => (
                    <span className="ticker__item" key={index}>
                        <span className="ticker__dot" />
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}

// -----------------------------------------------------
// Pagination
// -----------------------------------------------------

function Pagination({ page, pages, onChange }) {
    if (pages <= 1) return null;

    return (
        <nav className="pagination" aria-label="Pagination">
            <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => onChange(page - 1)}
                disabled={page <= 1}
            >
                <ChevronLeftIcon size={14} /> Prev
            </button>

            <div className="pagination__pages">
                {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                    <button
                        type="button"
                        key={number}
                        className={`pagination__page${number === page ? " is-active" : ""}`}
                        onClick={() => onChange(number)}
                        aria-current={number === page ? "page" : undefined}
                    >
                        {number}
                    </button>
                ))}
            </div>

            <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => onChange(page + 1)}
                disabled={page >= pages}
            >
                Next <ChevronRightIcon size={14} />
            </button>
        </nav>
    );
}

// -----------------------------------------------------
// Page
// -----------------------------------------------------

export default function Home() {
    const [params, setParams] = useSearchParams();

    const category = CATEGORIES.includes(params.get("category"))
        ? params.get("category")
        : "All";
    const sort = SORT_OPTIONS.some((option) => option.value === params.get("sort"))
        ? params.get("sort")
        : "newest";
    const page = Math.max(1, Number.parseInt(params.get("page"), 10) || 1);

    const [query, setQuery] = useState(params.get("q") || "");
    const search = useDebouncedValue(query.trim(), 300);

    // Filters live in the URL so results are shareable and the
    // back button works. Any filter change returns to page 1.
    const updateParams = (changes) => {
        const next = new URLSearchParams(params);

        Object.entries(changes).forEach(([key, value]) => {
            if (value === undefined || value === "" || value === null) {
                next.delete(key);
            } else {
                next.set(key, value);
            }
        });

        if (!("page" in changes)) next.delete("page");

        setParams(next, { replace: true });
    };

    const handleQueryChange = (value) => {
        setQuery(value);
        if (params.has("page")) updateParams({});
    };

    const showcase = useAsync(
        () => fetchProducts({ sort: "newest", limit: 6 }),
        []
    );

    const catalog = useAsync(
        () => fetchProducts({ search, category, sort, page, limit: PAGE_SIZE }),
        [search, category, sort, page]
    );

    const featured =
        showcase.data?.products.find((product) => product.image && product.stock > 0) ||
        showcase.data?.products[0];

    const products = catalog.data?.products ?? [];
    const total = catalog.data?.total ?? 0;
    const hasFilters = Boolean(search) || category !== "All";

    const clearFilters = () => {
        setQuery("");
        updateParams({ category: "", q: "" });
    };

    const goToPage = (number) => {
        updateParams({ page: number > 1 ? number : "" });
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
    };

    let results;

    if (catalog.error && !catalog.data) {
        results = <ErrorState error={catalog.error} onRetry={catalog.reload} />;
    } else if (!catalog.data) {
        results = <SkeletonGrid count={8} />;
    } else if (products.length === 0) {
        results = (
            <EmptyState
                icon={<SearchIcon size={24} />}
                title="Nothing matches that"
                action={
                    hasFilters && (
                        <button type="button" className="btn btn--outline" onClick={clearFilters}>
                            Clear filters
                        </button>
                    )
                }
            >
                {search
                    ? `We couldn't find anything for “${search}”. Try a different word or category.`
                    : "There are no products in this category yet."}
            </EmptyState>
        );
    } else {
        results = (
            <>
                <div className={`grid-auto${catalog.loading ? " is-refreshing" : ""}`}>
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>

                <Pagination
                    page={catalog.data.page}
                    pages={catalog.data.pages}
                    onChange={goToPage}
                />
            </>
        );
    }

    return (
        <>
            <div className="page">
                <Hero featured={featured} total={showcase.data?.total} />
            </div>

            <Ticker />

            <div className="page">
                <section className="catalog" id="catalog">
                    <div className="section-head">
                        <h2 className="display display--md">The catalog</h2>
                        <span className="eyebrow">{category === "All" ? "Everything" : category}</span>
                    </div>

                    <div className="catalog__toolbar">
                        <div className="catalog__chips" role="tablist" aria-label="Categories">
                            {["All", ...CATEGORIES].map((name) => (
                                <button
                                    type="button"
                                    key={name}
                                    role="tab"
                                    aria-selected={category === name}
                                    className={`chip${category === name ? " is-active" : ""}`}
                                    onClick={() => updateParams({ category: name === "All" ? "" : name })}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>

                        <label className="search catalog__search">
                            <SearchIcon />
                            <span className="visually-hidden">Search products</span>
                            <input
                                type="search"
                                className="search__input"
                                placeholder="Search products…"
                                value={query}
                                onChange={(event) => handleQueryChange(event.target.value)}
                            />
                            {query && (
                                <button
                                    type="button"
                                    className="search__clear"
                                    onClick={() => handleQueryChange("")}
                                    aria-label="Clear search"
                                >
                                    <CloseIcon size={14} />
                                </button>
                            )}
                        </label>
                    </div>

                    <div className="catalog__count">
                        <span className="catalog__summary">
                            {catalog.data ? pluralize(total, "product") : "Loading…"}
                            {search && ` for “${search}”`}
                        </span>

                        <label className="catalog__sort">
                            <span className="catalog__summary">Sort</span>
                            <select
                                className="select select--inline"
                                value={sort}
                                onChange={(event) =>
                                    updateParams({
                                        sort: event.target.value === "newest" ? "" : event.target.value
                                    })
                                }
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {results}
                </section>
            </div>
        </>
    );
}
