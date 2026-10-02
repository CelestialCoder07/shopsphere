import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Client-side navigation keeps the old scroll position by
// default; start every new page at the top instead.
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
