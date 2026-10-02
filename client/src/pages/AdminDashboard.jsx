import { Link } from "react-router-dom";

import { fetchAllOrders } from "../api/orders";
import { fetchAllProducts } from "../api/products";
import useAsync from "../hooks/useAsync";
import AdminHeader from "../components/AdminHeader";
import { ErrorState, Loading } from "../components/Feedback";
import { ArrowRightIcon, LayersIcon, PackageIcon } from "../components/icons";
import { LOW_STOCK_THRESHOLD, paymentBadgeClass, statusClass } from "../utils/catalog";
import { formatCurrency, formatDate, shortId } from "../utils/format";

const RECENT_COUNT = 6;

const loadDashboard = async () => {
    const [products, orders] = await Promise.all([fetchAllProducts(), fetchAllOrders()]);
    return { products, orders };
};

export default function AdminDashboard() {
    const { data, error, loading, reload } = useAsync(loadDashboard, []);

    if (error) {
        return (
            <div className="page admin">
                <AdminHeader title="Overview" />
                <ErrorState error={error} onRetry={reload} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page admin">
                <AdminHeader title="Overview" />
                <Loading label="Crunching the numbers…" />
            </div>
        );
    }

    const { products, orders } = data;
    const paidOrders = orders.filter((order) => order.paymentStatus === "Paid");
    const revenue = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const toFulfil = paidOrders.filter(
        (order) => order.status === "Pending" || order.status === "Processing"
    ).length;
    const lowStock = products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length;

    const stats = [
        { label: "Revenue (paid)", value: formatCurrency(revenue) },
        { label: "Paid orders", value: paidOrders.length },
        { label: "Awaiting fulfilment", value: toFulfil, tone: toFulfil > 0 ? "accent" : "" },
        { label: "Products", value: products.length },
        { label: "Low or out of stock", value: lowStock, tone: lowStock > 0 ? "amber" : "" }
    ];

    return (
        <div className="page admin">
            <AdminHeader title="Overview" subtitle="A snapshot of the store right now." />

            <div className="admin__stats">
                {stats.map((stat) => (
                    <div className={`stat${stat.tone ? ` stat--${stat.tone}` : ""}`} key={stat.label}>
                        <div className="stat__value">{stat.value}</div>
                        <div className="stat__label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="admin-tiles">
                <Link to="/admin/products" className="admin-tile">
                    <span className="admin-tile__icon"><LayersIcon /></span>
                    <span className="admin-tile__title">Products</span>
                    <span className="admin-tile__text">
                        Add new items, update prices and stock, or retire
                        products from the catalog.
                    </span>
                    <span className="admin-tile__cta">Manage products <ArrowRightIcon size={14} /></span>
                </Link>

                <Link to="/admin/orders" className="admin-tile">
                    <span className="admin-tile__icon"><PackageIcon /></span>
                    <span className="admin-tile__title">Orders</span>
                    <span className="admin-tile__text">
                        Review incoming orders and move them from
                        processing through to delivered.
                    </span>
                    <span className="admin-tile__cta">Manage orders <ArrowRightIcon size={14} /></span>
                </Link>
            </div>

            <section className="admin__recent">
                <div className="section-head">
                    <h2 className="display display--sm">Recent orders</h2>
                    <Link to="/admin/orders" className="link-underline text-sm">View all</Link>
                </div>

                {orders.length === 0 ? (
                    <p className="muted">No orders have been placed yet.</p>
                ) : (
                    <div className="admin-table__wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th className="align-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, RECENT_COUNT).map((order) => (
                                    <tr key={order._id}>
                                        <td className="mono">{shortId(order._id)}</td>
                                        <td>{order.user?.name || <span className="muted">Deleted user</span>}</td>
                                        <td>{formatDate(order.createdAt)}</td>
                                        <td><span className={paymentBadgeClass(order.paymentStatus)}>{order.paymentStatus}</span></td>
                                        <td><span className={statusClass(order.status)}>{order.status}</span></td>
                                        <td className="mono align-right">{formatCurrency(order.totalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
