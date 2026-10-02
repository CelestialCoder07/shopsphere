import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { fetchProducts } from "../api/products";
import { useAuth } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import useCategories from "../hooks/useCategories";
import useDebouncedValue from "../hooks/useDebouncedValue";
import Price from "../components/Price";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import { EmptyState, ErrorState, SkeletonGrid } from "../components/Feedback";
import {
    ArrowRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CloseIcon,
    SearchIcon,
    ShieldIcon,
    StarIcon,
    TagIcon,
    TruckIcon,
    PackageIcon
} from "../components/icons";
import { SORT_OPTIONS } from "../utils/catalog";
import { pluralize } from "../utils/format";

const PAGE_SIZE = 12;

const PERKS = [
    { icon: TruckIcon, title: "Free shipping", text: "On every order, no minimum" },
    { icon: ShieldIcon, title: "Secure checkout", text: "Payments handled by Stripe" },
    { icon: StarIcon, title: "Real reviews", text: "Verified-purchase badges" },
    { icon: PackageIcon, title: "Live tracking", text: "From paid to delivered" }
];

// -----------------------------------------------------
// Hero
// -----------------------------------------------------

function HeroTile({ product, size }) {
    return (
        <Link to={`/products/${product._id}`} className={`hero-tile hero-tile--${size}`}>
            <ProductImage src={product.image} alt={product.name} iconSize={40} />
            <span className="hero-tile__caption">
                <span className="hero-tile__brand">{product.brand}</span>
                <span className="hero-tile__name">{product.name}</span>
                <Price product={product} size="sm" />
            </span>
        </Link>
    );
}

function Hero({ featured, totalProducts, categoryCount }) {
    const { isAuthenticated } = useAuth();
    const [main, second, third] = featured;

    return (
        <section className="hero">
            <div className="hero__content">
                <p className="eyebrow">New season · {new Date().getFullYear()}</p>

                <h1 className="display hero__title">
                    Goods worth <em>keeping</em>.
                </h1>

                <p className="hero__lede">
                    Sneakers, tech, everyday carry and pieces for your home.
                    A curated catalog with honest reviews and a checkout
                    you can trust.
                </p>

                <div className="hero__actions">
                    <a href="#catalog" className="btn btn--primary btn--lg">
                        Shop the catalog <ArrowRightIcon />
                    </a>

                    <Link
                        to={isAuthenticated ? "/wishlist" : "/register"}
                        className="btn btn--outline btn--lg"
                    >
                        {isAuthenticated ? "Your wishlist" : "Create an account"}
                    </Link>
                </div>

                <dl className="hero__stats">
                    <div>
                        <dt className="hero__stat-label">Products</dt>
                        <dd className="hero__stat-value">{totalProducts ?? "—"}</dd>
                    </div>
                    <div>
                        <dt className="hero__stat-label">Categories</dt>
                        <dd className="hero__stat-value">{categoryCount || "—"}</dd>
                    </div>
                    <div>
                        <dt className="hero__stat-label">Shipping</dt>
                        <dd className="hero__stat-value">Free</dd>
                    </div>
                </dl>
            </div>

            <div className="hero__collage">
                {main ? (
                    <>
                        <HeroTile product={main} size="lg" />
                        {second && <HeroTile product={second} size="sm" />}
                        {third && <HeroTile product={third} size="sm" />}
                    </>
                ) : (
                    <>
                        <div className="hero-tile hero-tile--lg skeleton" />
                        <div className="hero-tile hero-tile--sm skeleton" />
                        <div className="hero-tile hero-tile--sm skeleton" />
                    </>
                )}
            </div>
        </section>
    );
}

function Perks() {
    return (
        <ul className="perks">
            {PERKS.map(({ icon: Icon, title, text }) => (
                <li className="perks__item" key={title}>
                    <span className="perks__icon"><Icon size={20} /></span>
                    <span>
                        <span className="perks__title">{title}</span>
                        <span className="perks__text">{text}</span>
                    </span>
                </li>
            ))}
        </ul>
    );
}

// -----------------------------------------------------
// Categories & rails
// -----------------------------------------------------

function CategoryTiles({ categories, onPick }) {
    if (categories.length === 0) return null;

    return (
        <section className="home-section">
            <div className="section-head">
                <h2 className="display display--md">Shop by category</h2>
            </div>

            <div className="category-tiles">
                {categories.map((category) => (
                    <button
                        type="button"
                        key={category.name}
                        className="category-tile"
                        onClick={() => onPick(category.name)}
                    >
                        <ProductImage src={category.image} alt="" iconSize={32} />
                        <span className="category-tile__label">
                            <span className="category-tile__name">{category.name}</span>
                            <span className="category-tile__count">{pluralize(category.count, "item")}</span>
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function Rail({ title, eyebrow, products, action }) {
    if (!products || products.length === 0) return null;

    return (
        <section className="home-section">
            <div className="section-head">
                <div>
                    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                    <h2 className="display display--md">{title}</h2>
                </div>
                {action}
            </div>

            <div className="grid-auto">
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </section>
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
    const { categories, names } = useCategories();

    const requestedCategory = params.get("category");
    const category = requestedCategory || "All";
    const sort = SORT_OPTIONS.some((option) => option.value === params.get("sort"))
        ? params.get("sort")
        : "newest";
    const onSale = params.get("sale") === "1";
    const page = Math.max(1, Number.parseInt(params.get("page"), 10) || 1);

    const [query, setQuery] = useState("");
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

    const scrollToCatalog = () =>
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });

    const handleQueryChange = (value) => {
        setQuery(value);
        if (params.has("page")) updateParams({});
    };

    const featured = useAsync(() => fetchProducts({ featured: true, limit: 8 }), []);
    const deals = useAsync(() => fetchProducts({ onSale: true, sort: "price-asc", limit: 4 }), []);

    const catalog = useAsync(
        () => fetchProducts({ search, category, sort, page, onSale, limit: PAGE_SIZE }),
        [search, category, sort, page, onSale]
    );

    const featuredProducts = featured.data?.products ?? [];
    const heroProducts = featuredProducts.filter((product) => product.image).slice(0, 3);
    const products = catalog.data?.products ?? [];
    const total = catalog.data?.total ?? 0;
    const hasFilters = Boolean(search) || category !== "All" || onSale;
    const totalProducts = categories.reduce((sum, item) => sum + item.count, 0) || undefined;

    const pickCategory = (name) => {
        updateParams({ category: name === "All" ? "" : name });
        scrollToCatalog();
    };

    const clearFilters = () => {
        setQuery("");
        updateParams({ category: "", sale: "" });
    };

    const goToPage = (number) => {
        updateParams({ page: number > 1 ? number : "" });
        scrollToCatalog();
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
                    : "No products match these filters yet."}
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

                <Pagination page={catalog.data.page} pages={catalog.data.pages} onChange={goToPage} />
            </>
        );
    }

    return (
        <>
            <div className="page">
                <Hero
                    featured={heroProducts}
                    totalProducts={totalProducts}
                    categoryCount={categories.length}
                />
                <Perks />
                <CategoryTiles categories={categories} onPick={pickCategory} />
                <Rail
                    eyebrow="Hand-picked"
                    title="Editor's picks"
                    products={featuredProducts.slice(0, 4)}
                />
                <Rail
                    eyebrow="Limited time"
                    title="On sale now"
                    products={deals.data?.products}
                    action={
                        <button
                            type="button"
                            className="link-underline text-sm"
                            onClick={() => {
                                updateParams({ sale: "1", category: "" });
                                scrollToCatalog();
                            }}
                        >
                            See all deals
                        </button>
                    }
                />

                <section className="catalog" id="catalog">
                    <div className="section-head">
                        <h2 className="display display--md">The catalog</h2>
                        <span className="eyebrow">
                            {category === "All" ? "Everything" : category}
                            {onSale && " · on sale"}
                        </span>
                    </div>

                    <div className="catalog__toolbar">
                        <div className="catalog__chips" role="tablist" aria-label="Categories">
                            {["All", ...names].map((name) => (
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
                                placeholder="Search products or brands…"
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

                        <div className="cluster">
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={onSale}
                                    onChange={(event) => updateParams({ sale: event.target.checked ? "1" : "" })}
                                />
                                <TagIcon size={14} />
                                <span>On sale</span>
                            </label>

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
                    </div>

                    {results}
                </section>
            </div>
        </>
    );
}
