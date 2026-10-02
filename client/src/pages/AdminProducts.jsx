import { useState } from "react";

import {
    createProduct,
    deleteProduct,
    fetchAllProducts,
    invalidateCategories,
    updateProduct
} from "../api/products";
import { useToast } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import useCategories from "../hooks/useCategories";
import AdminHeader from "../components/AdminHeader";
import ProductImage from "../components/ProductImage";
import { Alert, EmptyState, ErrorState, Loading } from "../components/Feedback";
import { PlusIcon, SearchIcon } from "../components/icons";
import { LOW_STOCK_THRESHOLD } from "../utils/catalog";
import { discountPercent, formatCurrency, formatStockLabel, pluralize } from "../utils/format";

const EMPTY_FORM = {
    name: "",
    brand: "",
    description: "",
    price: "",
    compareAtPrice: "",
    category: "",
    image: "",
    stock: "",
    featured: false
};

const toForm = (product) => ({
    name: product.name,
    brand: product.brand || "",
    description: product.description,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
    category: product.category,
    image: product.image || "",
    stock: String(product.stock),
    featured: Boolean(product.featured)
});

const toPayload = (form) => ({
    name: form.name.trim(),
    brand: form.brand.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    // Empty clears the sale on the server.
    compareAtPrice: form.compareAtPrice === "" ? "" : Number(form.compareAtPrice),
    category: form.category.trim(),
    image: form.image.trim(),
    stock: Number(form.stock),
    featured: form.featured
});

const validate = (payload) => {
    if (!payload.name) return "Give the product a name.";
    if (!payload.description) return "Add a short description.";
    if (!payload.category) return "Pick or type a category.";
    if (!Number.isFinite(payload.price) || payload.price < 0) return "Price must be 0 or more.";
    if (payload.compareAtPrice !== "" && !(payload.compareAtPrice > payload.price)) {
        return "The \"was\" price must be higher than the price (or leave it empty).";
    }
    if (!Number.isInteger(payload.stock) || payload.stock < 0) return "Stock must be a whole number, 0 or more.";
    return "";
};

function ProductForm({ editing, onSaved, onCancel }) {
    const { notify } = useToast();
    const [form, setForm] = useState(editing ? toForm(editing) : EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const { names: categories } = useCategories();

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = toPayload(form);
        const problem = validate(payload);

        if (problem) {
            setError(problem);
            return;
        }

        setError("");
        setSaving(true);

        try {
            const saved = editing
                ? await updateProduct(editing._id, payload)
                : await createProduct(payload);

            invalidateCategories();
            notify(editing ? `Saved changes to ${saved.name}` : `${saved.name} added to the catalog`);
            onSaved(saved, Boolean(editing));

            if (!editing) setForm(EMPTY_FORM);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="admin-form" onSubmit={handleSubmit}>
            <h2 className="admin-form__title">{editing ? "Edit product" : "New product"}</h2>

            <Alert>{error}</Alert>

            <div className="admin-form__grid">
                <label className="field">
                    <span className="field__label">Name</span>
                    <input className="input" name="name" value={form.name} onChange={handleChange} required />
                </label>

                <label className="field">
                    <span className="field__label">Brand</span>
                    <input className="input" name="brand" value={form.brand} onChange={handleChange} />
                </label>
            </div>

            <label className="field">
                <span className="field__label">Description</span>
                <textarea
                    className="textarea"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                />
            </label>

            <div className="admin-form__grid">
                <label className="field">
                    <span className="field__label">Price (₹)</span>
                    <input
                        className="input"
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={form.price}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label className="field">
                    <span className="field__label">Was (₹), optional</span>
                    <input
                        className="input"
                        type="number"
                        name="compareAtPrice"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Sale only"
                        value={form.compareAtPrice}
                        onChange={handleChange}
                    />
                </label>
            </div>

            <div className="admin-form__grid">
                <label className="field">
                    <span className="field__label">Stock</span>
                    <input
                        className="input"
                        type="number"
                        name="stock"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={form.stock}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label className="field">
                    <span className="field__label">Category</span>
                    <input
                        className="input"
                        name="category"
                        list="category-options"
                        placeholder="Pick or type new"
                        value={form.category}
                        onChange={handleChange}
                        required
                    />
                    <datalist id="category-options">
                        {categories.map((category) => (
                            <option key={category} value={category} />
                        ))}
                    </datalist>
                </label>
            </div>

            <label className="field">
                <span className="field__label">Image URL</span>
                <input
                    className="input"
                    type="url"
                    name="image"
                    placeholder="https://…"
                    value={form.image}
                    onChange={handleChange}
                />
            </label>

            <label className="toggle">
                <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
                <span>Feature on the home page</span>
            </label>

            <div className="admin-form__preview">
                <ProductImage src={form.image.trim()} alt="Image preview" iconSize={28} />
            </div>

            <div className="admin-form__actions">
                {editing && (
                    <button type="button" className="btn btn--outline" onClick={onCancel} disabled={saving}>
                        Cancel
                    </button>
                )}
                <button type="submit" className="btn btn--primary" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Save changes" : <><PlusIcon size={14} /> Add product</>}
                </button>
            </div>
        </form>
    );
}

export default function AdminProducts() {
    const { notify } = useToast();
    const { data: products, error, loading, reload, setData } = useAsync(fetchAllProducts, []);

    const [editing, setEditing] = useState(null);
    const [confirmingId, setConfirmingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [filter, setFilter] = useState("");

    const handleSaved = (saved, wasEdit) => {
        setData((current = []) =>
            wasEdit
                ? current.map((product) => (product._id === saved._id ? saved : product))
                : [saved, ...current]
        );
        setEditing(null);
    };

    const startEditing = (product) => {
        setEditing(product);
        setConfirmingId(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (product) => {
        setDeletingId(product._id);

        try {
            await deleteProduct(product._id);
            invalidateCategories();
            setData((current = []) => current.filter((item) => item._id !== product._id));
            if (editing?._id === product._id) setEditing(null);
            notify(`${product.name} was removed`);
        } catch (err) {
            notify(err.message, { type: "error" });
        } finally {
            setDeletingId(null);
            setConfirmingId(null);
        }
    };

    if (error && !products) {
        return (
            <div className="page admin">
                <AdminHeader title="Products" />
                <ErrorState error={error} onRetry={reload} />
            </div>
        );
    }

    const term = filter.trim().toLowerCase();
    const visible = (products ?? []).filter(
        (product) =>
            !term ||
            product.name.toLowerCase().includes(term) ||
            (product.brand || "").toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term)
    );

    return (
        <div className="page admin">
            <AdminHeader
                title="Products"
                subtitle={products ? `${pluralize(products.length, "product")} in the catalog` : undefined}
            />

            <div className="admin-grid">
                <ProductForm
                    key={editing?._id || "new"}
                    editing={editing}
                    onSaved={handleSaved}
                    onCancel={() => setEditing(null)}
                />

                <section>
                    <label className="search admin-search">
                        <SearchIcon />
                        <span className="visually-hidden">Filter products</span>
                        <input
                            type="search"
                            className="search__input"
                            placeholder="Filter by name or category…"
                            value={filter}
                            onChange={(event) => setFilter(event.target.value)}
                        />
                    </label>

                    {loading && !products ? (
                        <Loading label="Loading products…" />
                    ) : visible.length === 0 ? (
                        <EmptyState title={term ? "No matches" : "No products yet"}>
                            {term ? "Try a different search." : "Use the form to add your first product."}
                        </EmptyState>
                    ) : (
                        <ul className="admin-list">
                            {visible.map((product) => {
                                const confirming = confirmingId === product._id;
                                const low = product.stock <= LOW_STOCK_THRESHOLD;

                                return (
                                    <li
                                        className={`admin-row${editing?._id === product._id ? " is-editing" : ""}`}
                                        key={product._id}
                                    >
                                        <div className="admin-row__media">
                                            <ProductImage src={product.image} alt={product.name} iconSize={20} />
                                        </div>

                                        <div>
                                            <p className="admin-row__name">{product.name}</p>
                                            <div className="admin-row__meta">
                                                <span>{product.brand ? `${product.brand} · ` : ""}{product.category}</span>
                                                <span>
                                                    {formatCurrency(product.price)}
                                                    {discountPercent(product) > 0 && ` (−${discountPercent(product)}%)`}
                                                </span>
                                                {product.featured && <span className="admin-row__featured">Featured</span>}
                                                <span className={low ? "admin-row__low" : undefined}>
                                                    {formatStockLabel(product.stock)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="admin-row__actions">
                                            {confirming ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm btn--ghost"
                                                        onClick={() => setConfirmingId(null)}
                                                        disabled={deletingId === product._id}
                                                    >
                                                        Keep
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm btn--danger"
                                                        onClick={() => handleDelete(product)}
                                                        disabled={deletingId === product._id}
                                                    >
                                                        {deletingId === product._id ? "Deleting…" : "Confirm delete"}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm btn--outline"
                                                        onClick={() => startEditing(product)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm btn--ghost"
                                                        onClick={() => setConfirmingId(product._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
