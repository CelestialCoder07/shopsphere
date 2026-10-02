import { CheckCircleIcon } from "./icons";

// Two-column auth screen: a short pitch on the left, the form
// card on the right. Collapses to one column on small screens.
export default function AuthLayout({ eyebrow, title, points, children }) {
    return (
        <div className="page">
            <div className="auth">
                <aside className="auth__aside">
                    <p className="eyebrow">{eyebrow}</p>
                    <h1 className="display auth__aside-title">{title}</h1>

                    <ul className="auth__points">
                        {points.map((point) => (
                            <li className="auth__point" key={point}>
                                <span className="auth__point-icon"><CheckCircleIcon /></span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </aside>

                {children}
            </div>
        </div>
    );
}
