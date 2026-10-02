import { startTransition, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth, useToast } from "../context/hooks";

// Signs out and returns to the shop. React Router runs
// navigation as a transition, so the sign-out goes in the same
// transition: otherwise a protected page would see the empty
// session first and bounce to /login, remembering itself as the
// page to return to for whoever signs in next.
export default function useSignOut() {
    const { signOut } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();

    return useCallback(() => {
        startTransition(() => {
            navigate("/");
            signOut();
        });
        notify("You have been signed out.");
    }, [navigate, signOut, notify]);
}
