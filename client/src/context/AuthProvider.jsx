import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthContext } from "./contexts";
import { login as loginRequest } from "../api/auth";
import { SESSION_EXPIRED_EVENT } from "../api/client";
import {
    STORAGE_KEYS,
    clearSession,
    readJson,
    readToken,
    saveSession,
    writeJson
} from "../utils/storage";

const EMPTY_SESSION = { token: null, user: null };

const readSession = () => {
    const token = readToken();
    return token
        ? { token, user: readJson(STORAGE_KEYS.user, null) }
        : EMPTY_SESSION;
};

export default function AuthProvider({ children }) {
    const [session, setSession] = useState(readSession);

    // Drop the session when the API rejects the token, and keep
    // tabs in sync when the user signs in or out elsewhere.
    useEffect(() => {
        const handleExpired = () => setSession(EMPTY_SESSION);

        const handleStorage = (event) => {
            if (
                event.key === null ||
                event.key === STORAGE_KEYS.token ||
                event.key === STORAGE_KEYS.user
            ) {
                setSession(readSession());
            }
        };

        window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    const signIn = useCallback(async (credentials) => {
        const data = await loginRequest(credentials);

        saveSession(data.token, data.user);
        setSession({ token: data.token, user: data.user });

        return data.user;
    }, []);

    const signOut = useCallback(() => {
        clearSession();
        setSession(EMPTY_SESSION);
    }, []);

    // Refresh the cached user (e.g. after loading the profile).
    const updateUser = useCallback((user) => {
        writeJson(STORAGE_KEYS.user, user);
        setSession((current) =>
            current.token ? { ...current, user } : current
        );
    }, []);

    const value = useMemo(() => {
        const isAuthenticated = Boolean(session.token);

        return {
            user: isAuthenticated ? session.user : null,
            isAuthenticated,
            isAdmin: isAuthenticated && session.user?.role === "admin",
            signIn,
            signOut,
            updateUser
        };
    }, [session, signIn, signOut, updateUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
