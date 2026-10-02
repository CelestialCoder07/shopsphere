import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth, useToast } from "../context/hooks";
import AuthLayout from "../components/AuthLayout";
import { Alert } from "../components/Feedback";
import { ArrowRightIcon } from "../components/icons";

// Where to go after signing in: back to the page that sent us
// here, otherwise admins land on the dashboard.
const destinationFor = (from, user) => {
    if (from?.pathname && from.pathname !== "/login") {
        return `${from.pathname}${from.search || ""}`;
    }

    return user?.role === "admin" ? "/admin" : "/";
};

export default function Login() {
    const { signIn, isAuthenticated, user } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from;

    const [form, setForm] = useState({ email: "", password: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (isAuthenticated && !submitting) {
        return <Navigate to={destinationFor(from, user)} replace />;
    }

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const signedIn = await signIn(form);
            notify(`Welcome back, ${signedIn.name.split(" ")[0]}!`);
            navigate(destinationFor(from, signedIn), { replace: true });
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Members"
            title="Welcome back."
            points={[
                "Pick up your cart right where you left it",
                "Check out securely with Stripe",
                "Follow every order from paid to delivered"
            ]}
        >
            <div className="auth-card">
                <h2 className="display auth-card__title">Sign in</h2>
                <p className="auth-card__sub">Use the email and password for your ShopSphere account.</p>

                <form className="auth-card__form" onSubmit={handleSubmit}>
                    <Alert>{error}</Alert>

                    <label className="field">
                        <span className="field__label">Email</span>
                        <input
                            className="input"
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </label>

                    <label className="field">
                        <span className="field__label">Password</span>
                        <input
                            className="input"
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="Your password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
                        {submitting ? (
                            <>
                                <span className="spinner spinner--light" /> Signing in…
                            </>
                        ) : (
                            <>
                                Sign in <ArrowRightIcon />
                            </>
                        )}
                    </button>
                </form>

                <p className="auth-card__foot">
                    New to ShopSphere?{" "}
                    <Link to="/register" state={location.state} className="link-underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
