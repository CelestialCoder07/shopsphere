import { Link } from "react-router-dom";

import { ArrowLeftIcon } from "../components/icons";

export default function NotFound() {
    return (
        <div className="page">
            <div className="notfound">
                <div>
                    <p className="notfound__code">404</p>
                    <h1 className="display notfound__title">This page wandered off</h1>
                    <p className="notfound__text">
                        The link may be broken or the page may have moved.
                        Let's get you back to the good stuff.
                    </p>
                    <Link to="/" className="btn btn--primary">
                        <ArrowLeftIcon /> Back to the shop
                    </Link>
                </div>
            </div>
        </div>
    );
}
