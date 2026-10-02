import { useState } from "react";

import { fetchAllOrders, updateOrderStatus } from "../api/orders";
import { useToast } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import AdminHeader from "../components/AdminHeader";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import { PackageIcon } from "../components/icons";
import { ORDER_STATUSES, paymentBadgeClass, statusClass } from "../utils/catalog";
import { formatCurrency, formatDateTime, pluralize, shortId } from "../utils/format";

function OrderPanel({ order, onStatusChange, saving }) {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <article className="admin-order">
            <header className="admin-order__head">
                <div className="stack stack--xs">
                    <span className="admin-order__id">ORDER {shortId(order._id)}</span>
                    <span className="muted text-xs">{formatDateTime(order.createdAt)}</span>
                </div>

                <div className="cluster">
                    <span className={paymentBadgeClass(order.paymentStatus)}>{order.paymentStatus}</span>
                    <span className={statusClass(order.status)}>{order.status}</span>
                </div>
            </header>

            <div className="admin-order__body">
                <div>
                    <div className="admin-order__customer">
                        <span className="eyebrow">Customer</span>
                        {order.user ? (
                            <>
                                <span className="strong">{order.user.name}</span>
                                <span className="muted">{order.user.email}</span>
                            </>
                        ) : (
                            <span className="muted">Account deleted</span>
                        )}
                    </div>

                    <ul className="admin-order__items">
                        {order.items.map((item, index) => (
                            <li className="admin-order__item" key={item._id || index}>
                                <span>
                                    {item.name}
                                    <span className="order-line__qty">× {item.quantity}</span>
                                </span>
                                <span className="mono">{formatCurrency(item.price * item.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="admin-order__controls">
                    <div className="admin-order__totals">
                        <span className="eyebrow">Total · {pluralize(itemCount, "item")}</span>
                        <span className="admin-order__total-value">{formatCurrency(order.totalPrice)}</span>
                    </div>

                    <label className="field">
                        <span className="field__label">Fulfilment status</span>
                        <select
                            className="select"
                            value={order.status}
                            onChange={(event) => onStatusChange(order, event.target.value)}
                            disabled={saving}
                        >
                            {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </label>

                    {order.paymentStatus !== "Paid" && (
                        <p className="field__hint">
                            Not paid yet. The customer may have left checkout before paying.
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
}

export default function AdminOrders() {
    const { notify } = useToast();
    const { data: orders, error, loading, reload, setData } = useAsync(fetchAllOrders, []);

    const [filter, setFilter] = useState("All");
    const [paidOnly, setPaidOnly] = useState(true);
    const [savingId, setSavingId] = useState(null);

    const handleStatusChange = async (order, status) => {
        const previous = order.status;
        const applyStatus = (value) =>
            setData((current = []) =>
                current.map((item) => (item._id === order._id ? { ...item, status: value } : item))
            );

        applyStatus(status);
        setSavingId(order._id);

        try {
            await updateOrderStatus(order._id, status);
            notify(`Order ${shortId(order._id)} marked ${status}`);
        } catch (err) {
            applyStatus(previous);
            notify(err.message, { type: "error" });
        } finally {
            setSavingId(null);
        }
    };

    if (error && !orders) {
        return (
            <div className="page admin">
                <AdminHeader title="Orders" />
                <ErrorState error={error} onRetry={reload} />
            </div>
        );
    }

    if (loading && !orders) {
        return (
            <div className="page admin">
                <AdminHeader title="Orders" />
                <Loading label="Loading orders…" />
            </div>
        );
    }

    const scoped = paidOnly ? orders.filter((order) => order.paymentStatus === "Paid") : orders;
    const countFor = (status) =>
        status === "All" ? scoped.length : scoped.filter((order) => order.status === status).length;
    const visible = filter === "All" ? scoped : scoped.filter((order) => order.status === filter);

    return (
        <div className="page admin">
            <AdminHeader title="Orders" subtitle={`${pluralize(orders.length, "order")} in total`} />

            <div className="admin-orders__toolbar">
                <div className="catalog__chips">
                    {["All", ...ORDER_STATUSES].map((status) => (
                        <button
                            type="button"
                            key={status}
                            className={`chip${filter === status ? " is-active" : ""}`}
                            onClick={() => setFilter(status)}
                        >
                            {status} <span className="chip__count">{countFor(status)}</span>
                        </button>
                    ))}
                </div>

                <label className="toggle">
                    <input
                        type="checkbox"
                        checked={paidOnly}
                        onChange={(event) => setPaidOnly(event.target.checked)}
                    />
                    <span>Paid orders only</span>
                </label>
            </div>

            {visible.length === 0 ? (
                <EmptyState icon={<PackageIcon size={24} />} title="No orders here">
                    {filter === "All"
                        ? "Orders will appear here as customers check out."
                        : `There are no ${filter.toLowerCase()} orders right now.`}
                </EmptyState>
            ) : (
                <div className="admin-orders">
                    {visible.map((order) => (
                        <OrderPanel
                            key={order._id}
                            order={order}
                            onStatusChange={handleStatusChange}
                            saving={savingId === order._id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
