import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { verifyPayment } from "../api/payment";
import { useCart } from "../context/hooks";
import useAsync from "../hooks/useAsync";
import { AlertIcon, CheckIcon, ClockIcon } from "../components/icons";
import { shortId } from "../utils/format";

function ResultCard({ tone, icon, title, children, actions }) {
    return (
        <div className="page">
            <div className="payment">
                <div className="payment-card">
                    <div className={`payment-card__icon payment-card__icon--${tone}`}>{icon}</div>
                    <h1 className="display payment-card__title">{title}</h1>
                    {children}
                    <div className="payment-card__actions">{actions}</div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccess() {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const { clearCart } = useCart();

    const { data, error, loading, reload } = useAsync(
        () => (sessionId ? verifyPayment(sessionId) : Promise.reject(new Error("No payment session was found in the link."))),
        [sessionId]
    );

    const paid = data?.paymentStatus === "Paid";

    // Empty the cart only once Stripe has confirmed the money.
    useEffect(() => {
        if (paid) clearCart();
    }, [paid, clearCart]);

    if (loading) {
        return (
            <ResultCard
                tone="wait"
                icon={<span className="spinner" />}
                title="Confirming your payment…"
            >
                <p className="payment-card__text">This only takes a moment. Please don't close this page.</p>
            </ResultCard>
        );
    }

    if (error) {
        return (
            <ResultCard
                tone="bad"
                icon={<AlertIcon size={30} />}
                title="We couldn't confirm that payment"
                actions={
                    <>
                        <Link to="/orders" className="btn btn--primary">View my orders</Link>
                        <Link to="/cart" className="btn btn--outline">Back to cart</Link>
                    </>
                }
            >
                <p className="payment-card__text">{error.message}</p>
            </ResultCard>
        );
    }

    if (!paid) {
        return (
            <ResultCard
                tone="wait"
                icon={<ClockIcon size={30} />}
                title="Payment is still processing"
                actions={
                    <>
                        <button type="button" className="btn btn--primary" onClick={reload}>Check again</button>
                        <Link to="/orders" className="btn btn--outline">View my orders</Link>
                    </>
                }
            >
                <p className="payment-card__text">
                    Stripe hasn't confirmed this payment yet. It usually
                    settles within a few seconds.
                </p>
            </ResultCard>
        );
    }

    return (
        <ResultCard
            tone="ok"
            icon={<CheckIcon size={32} />}
            title="Thank you, payment received!"
            actions={
                <>
                    <Link to="/orders" className="btn btn--primary">Track your order</Link>
                    <Link to="/" className="btn btn--outline">Keep shopping</Link>
                </>
            }
        >
            <p className="payment-card__text">
                Your order is confirmed and we're getting it ready.
            </p>

            <div className="payment-card__receipt">
                <span className="eyebrow">Order</span>
                <span className="mono strong">{shortId(data.orderId)}</span>
            </div>
        </ResultCard>
    );
}
