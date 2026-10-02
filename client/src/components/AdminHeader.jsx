import { NavLink } from "react-router-dom";

const tabClass = ({ isActive }) => `chip${isActive ? " is-active" : ""}`;

// Shared heading + section switcher for the admin screens.
export default function AdminHeader({ title, subtitle }) {
    return (
        <header className="admin__header">
            <div>
                <p className="eyebrow">Back office</p>
                <h1 className="display display--lg">{title}</h1>
                {subtitle && <p className="muted text-sm admin__subtitle">{subtitle}</p>}
            </div>

            <nav className="admin__nav" aria-label="Admin sections">
                <NavLink to="/admin" end className={tabClass}>Overview</NavLink>
                <NavLink to="/admin/products" className={tabClass}>Products</NavLink>
                <NavLink to="/admin/orders" className={tabClass}>Orders</NavLink>
            </nav>
        </header>
    );
}
