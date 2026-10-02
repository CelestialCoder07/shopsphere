import { useEffect } from "react";
import { Link } from "react-router-dom";

import { fetchProfile } from "../api/auth";
import { useAuth, useCart } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import useSignOut from "../hooks/useSignOut";
import { ErrorState, Loading } from "../components/Feedback";
import {
    CartIcon,
    ChevronRightIcon,
    LayersIcon,
    LogoutIcon,
    PackageIcon
} from "../components/icons";
import { formatDate, initials, pluralize } from "../utils/format";

export default function Profile() {
    const { updateUser, isAdmin } = useAuth();
    const { itemCount } = useCart();
    const handleSignOut = useSignOut();

    const { data: user, error, loading, reload } = useAsync(fetchProfile, []);

    // Keep the cached user (navbar name, role) in step with the server.
    useEffect(() => {
        if (user) updateUser(user);
    }, [user, updateUser]);

    if (error) {
        return (
            <div className="page orders">
                <ErrorState error={error} onRetry={reload} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page orders">
                <Loading label="Loading your profile…" />
            </div>
        );
    }

    return (
        <div className="page">
            <div className="profile">
                <aside className="profile__side">
                    <p className="eyebrow">Shortcuts</p>

                    <Link to="/orders" className="profile__link">
                        <PackageIcon /> <span>Order history</span> <ChevronRightIcon />
                    </Link>

                    <Link to="/cart" className="profile__link">
                        <CartIcon /> <span>Cart · {pluralize(itemCount, "item")}</span> <ChevronRightIcon />
                    </Link>

                    {isAdmin && (
                        <Link to="/admin" className="profile__link">
                            <LayersIcon /> <span>Admin dashboard</span> <ChevronRightIcon />
                        </Link>
                    )}

                    <button type="button" className="btn btn--outline btn--block" onClick={handleSignOut}>
                        <LogoutIcon /> Sign out
                    </button>
                </aside>

                <section className="profile__card">
                    <div className="profile__identity">
                        <span className="profile__avatar">{initials(user.name)}</span>
                        <div>
                            <p className="profile__name">{user.name}</p>
                            <p className="muted text-sm">{user.email}</p>
                        </div>
                    </div>

                    <dl className="profile__rows">
                        <div className="profile__row">
                            <dt>Name</dt>
                            <dd>{user.name}</dd>
                        </div>
                        <div className="profile__row">
                            <dt>Email</dt>
                            <dd>{user.email}</dd>
                        </div>
                        <div className="profile__row">
                            <dt>Account type</dt>
                            <dd>
                                <span className={user.role === "admin" ? "badge badge--ink" : "badge"}>
                                    {user.role === "admin" ? "Administrator" : "Customer"}
                                </span>
                            </dd>
                        </div>
                        <div className="profile__row">
                            <dt>Member since</dt>
                            <dd>{formatDate(user.createdAt)}</dd>
                        </div>
                    </dl>
                </section>
            </div>
        </div>
    );
}
