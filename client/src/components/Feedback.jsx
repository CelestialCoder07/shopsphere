// =====================================================
// FEEDBACK STATES
// =====================================================
// Shared loading / empty / error building blocks so every
// page communicates the same way.

import { AlertIcon, InboxIcon } from "./icons";

export function Loading({ label = "Loading…" }) {
    return (
        <div className="loading-block" role="status">
            <span className="spinner" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}

export function EmptyState({ icon, title, children, action }) {
    return (
        <div className="empty">
            <span className="empty__icon">{icon || <InboxIcon />}</span>
            <h2 className="empty__title">{title}</h2>
            {children && <p className="empty__text">{children}</p>}
            {action}
        </div>
    );
}

export function ErrorState({ error, onRetry }) {
    return (
        <EmptyState
            icon={<AlertIcon size={24} />}
            title="Something went wrong"
            action={
                onRetry && (
                    <button type="button" className="btn btn--outline" onClick={onRetry}>
                        Try again
                    </button>
                )
            }
        >
            {error?.message || "Please try again in a moment."}
        </EmptyState>
    );
}

export function Alert({ type = "error", children }) {
    if (!children) return null;

    return (
        <div className={`alert alert--${type}`} role="alert">
            {type === "error" && <AlertIcon size={16} />}
            <span>{children}</span>
        </div>
    );
}

export function SkeletonGrid({ count = 8 }) {
    return (
        <div className="grid-auto" aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div className="skeleton-card" key={index}>
                    <div className="skeleton skeleton-card__media" />
                    <div className="skeleton-card__body">
                        <div className="skeleton skeleton-card__line" style={{ width: "40%" }} />
                        <div className="skeleton skeleton-card__line" style={{ width: "85%" }} />
                        <div className="skeleton skeleton-card__line" style={{ width: "60%" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
