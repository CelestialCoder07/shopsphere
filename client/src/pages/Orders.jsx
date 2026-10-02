import { useState } from "react";
import { Link } from "react-router-dom";

import { cancelOrder, fetchMyOrders } from "../api/orders";
import { useToast } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import { ArrowRightIcon, PackageIcon } from "../components/icons";
import { paymentBadgeClass, statusClass } from "../utils/catalog";
import { formatCurrency, formatDateTime, pluralize, shortId } from "../utils/format";

const PROGRESS = ["Pending", "Processing", "Shipped", "Delivered"];

function OrderProgress({ status }) {
    if (status === "Cancelled") return null;

    const reached = PROGRESS.indexOf(status);

    return (
        <ol className="progress" aria-label={`Order status: ${status}`}>
            {PROGRESS.map((step, index) => (
                <li
                    key={step}
                    className={`progress__step${index <= reached ? " is-done" : ""}${index === reached ? " is-current" : ""}`}
                >
                    <span className="progress__dot" />
                    <span className="progress__label">{step}</span>
                </li>
            ))}
        </ol>
    );
}

function OrderCard({ order, onCancelled }) {
    const { notify } = useToast();
    const [cancelling, setCancelling] = useState(false);

    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const paid = order.paymentStatus === "Paid";
    const cancellable = !paid && order.status === "Pending";

    const handleCancel = async () => {
        setCancelling(true);

        try {
            onCancelled(await cancelOrder(order._id));
            notify(`Order ${shortId(order._id)} cancelled`);
        } catch (err) {
            notify(err.message, { type: "error" });
            setCancelling(false);
        }
    };

    return (
        <article className="order-card">
            <header className="order-card__head">
                <div className="stack stack--xs">
                    <span className="order-card__id">ORDER {shortId(order._id)}</span>
                    <span className="order-card__meta">
                        Placed {formatDateTime(order.createdAt)}
                    </span>
                </div>

                <div className="cluster">
                    <span className={paymentBadgeClass(order.paymentStatus)}>
                        {paid
                            ? "Paid"
                            : order.status === "Cancelled"
                              ? "Not charged"
                              : order.paymentStatus === "Failed"
                                ? "Payment failed"
                                : "Awaiting payment"}
                    </span>
                    <span className={statusClass(order.status)}>{order.status}</span>
                </div>
            </header>

            {paid && <OrderProgress status={order.status} />}

            <ul className="order-card__lines">
                {order.items.map((item, index) => (
                    <li className="order-line" key={item._id || index}>
                        <span>
                            <Link to={`/products/${item.product}`} className="order-line__name">
                                {item.name}
                            </Link>
                            <span className="order-line__qty">× {item.quantity}</span>
                        </span>
                        <span className="order-line__amount">
                            {formatCurrency(item.price * item.quantity)}
                        </span>
                    </li>
                ))}
            </ul>

            <footer className="order-card__foot">
                <span className="cluster">
                    <span className="muted">{pluralize(itemCount, "item")}</span>
                    {cancellable && (
                        <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={handleCancel}
                            disabled={cancelling}
                        >
                            {cancelling ? "Cancelling…" : "Cancel order"}
                        </button>
                    )}
                </span>
                <span className="order-card__total">{formatCurrency(order.totalPrice)}</span>
            </footer>
        </article>
    );
}

export default function Orders() {
    const { data: orders, error, loading, reload, setData } = useAsync(fetchMyOrders, []);

    const handleCancelled = (updated) => {
        setData((current = []) =>
            current.map((order) => (order._id === updated._id ? updated : order))
        );
    };

    let content;

    if (error) {
        content = <ErrorState error={error} onRetry={reload} />;
    } else if (loading) {
        content = <Loading label="Loading your orders…" />;
    } else if (orders.length === 0) {
        content = (
            <EmptyState
                icon={<PackageIcon size={24} />}
                title="No orders yet"
                action={
                    <Link to="/" className="btn btn--primary">
                        Start shopping <ArrowRightIcon />
                    </Link>
                }
            >
                When you place an order it will show up here, along with
                its payment and delivery status.
            </EmptyState>
        );
    } else {
        content = orders.map((order) => (
            <OrderCard key={order._id} order={order} onCancelled={handleCancelled} />
        ));
    }

    return (
        <div className="page orders">
            <div className="section-head">
                <h1 className="display display--lg">Your orders</h1>
                {orders?.length > 0 && <span className="eyebrow">{pluralize(orders.length, "order")}</span>}
            </div>

            {content}
        </div>
    );
}
