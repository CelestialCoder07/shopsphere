import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { register } from "../api/auth";
import { useAuth, useToast } from "../context/hooks";
import AuthLayout from "../components/AuthLayout";
import { Alert } from "../components/Feedback";
import { ArrowRightIcon } from "../components/icons";

const MIN_PASSWORD_LENGTH = 6;

const validate = ({ name, email, password, confirm }) => {
    if (!name.trim()) return "Please enter your name.";
    if (!email.trim()) return "Please enter your email.";
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirm) return "The two passwords don't match.";
    return "";
};

export default function Register() {
    const { signIn, isAuthenticated } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from;

    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (isAuthenticated && !submitting) {
        return <Navigate to="/" replace />;
    }

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const problem = validate(form);
        if (problem) {
            setError(problem);
            return;
        }

        setError("");
        setSubmitting(true);

        try {
            await register(form);

            // The API doesn't return a token on sign-up, so sign
            // straight in with the same credentials.
            const user = await signIn({ email: form.email, password: form.password });

            notify(`Welcome to ShopSphere, ${user.name.split(" ")[0]}!`);
            navigate(from?.pathname ? `${from.pathname}${from.search || ""}` : "/", { replace: true });
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Join us"
            title="Shop smarter, in one place."
            points={[
                "Save your cart across visits",
                "One-click access to your order history",
                "Secure checkout with Stripe, every time"
            ]}
        >
            <div className="auth-card">
                <h2 className="display auth-card__title">Create account</h2>
                <p className="auth-card__sub">It takes less than a minute.</p>

                <form className="auth-card__form" onSubmit={handleSubmit}>
                    <Alert>{error}</Alert>

                    <label className="field">
                        <span className="field__label">Full name</span>
                        <input
                            className="input"
                            name="name"
                            autoComplete="name"
                            placeholder="Asha Rao"
                            value={form.name}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </label>

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
                        />
                    </label>

                    <div className="auth-card__row">
                        <label className="field">
                            <span className="field__label">Password</span>
                            <input
                                className="input"
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                value={form.password}
                                onChange={handleChange}
                                minLength={MIN_PASSWORD_LENGTH}
                                required
                            />
                        </label>

                        <label className="field">
                            <span className="field__label">Confirm</span>
                            <input
                                className="input"
                                type="password"
                                name="confirm"
                                autoComplete="new-password"
                                value={form.confirm}
                                onChange={handleChange}
                                required
                            />
                        </label>
                    </div>
                    <p className="field__hint">At least {MIN_PASSWORD_LENGTH} characters.</p>

                    <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
                        {submitting ? (
                            <>
                                <span className="spinner spinner--light" /> Creating account…
                            </>
                        ) : (
                            <>
                                Create account <ArrowRightIcon />
                            </>
                        )}
                    </button>
                </form>

                <p className="auth-card__foot">
                    Already have an account?{" "}
                    <Link to="/login" state={location.state} className="link-underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
