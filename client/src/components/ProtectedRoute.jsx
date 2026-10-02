import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/hooks";

// Sends signed-out visitors to the login page (remembering
// where they were headed) and non-admins away from admin pages.
export default function ProtectedRoute({ children, adminOnly = false }) {
    const { isAuthenticated, isAdmin } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
