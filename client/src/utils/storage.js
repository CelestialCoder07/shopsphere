// =====================================================
// LOCAL STORAGE
// =====================================================
// Every read/write goes through here so key names live in
// one place and private-mode failures can't crash the app.

export const STORAGE_KEYS = {
    token: "token",
    user: "user",
    cart: "cart"
};

const safeGet = (key) => {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

const safeSet = (key, value) => {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        /* Storage unavailable — the app still works in memory. */
    }
};

const safeRemove = (key) => {
    try {
        window.localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
};

export const readJson = (key, fallback) => {
    const raw = safeGet(key);

    if (!raw) {
        return fallback;
    }

    try {
        return JSON.parse(raw);
    } catch {
        // Corrupt entry — drop it rather than crashing on boot.
        safeRemove(key);
        return fallback;
    }
};

export const writeJson = (key, value) => {
    safeSet(key, JSON.stringify(value));
};

export const readToken = () => safeGet(STORAGE_KEYS.token);

export const saveSession = (token, user) => {
    safeSet(STORAGE_KEYS.token, token);
    writeJson(STORAGE_KEYS.user, user);
};

export const clearSession = () => {
    safeRemove(STORAGE_KEYS.token);
    safeRemove(STORAGE_KEYS.user);
};
