import { useCallback, useMemo, useRef, useState } from "react";

import { ToastContext } from "./contexts";
import { AlertIcon, CheckCircleIcon, CloseIcon } from "../components/icons";

const DEFAULT_DURATION_MS = 3200;
const MAX_VISIBLE = 4;

export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const notify = useCallback(
        (message, { type = "success", duration = DEFAULT_DURATION_MS } = {}) => {
            nextId.current += 1;
            const id = nextId.current;

            setToasts((current) => [
                ...current.slice(-(MAX_VISIBLE - 1)),
                { id, message, type }
            ]);

            window.setTimeout(() => dismiss(id), duration);
        },
        [dismiss]
    );

    const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div className="toast-stack" role="status" aria-live="polite">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast${toast.type === "error" ? " toast--error" : ""}`}
                    >
                        <span className="toast__icon">
                            {toast.type === "error"
                                ? <AlertIcon size={18} />
                                : <CheckCircleIcon size={18} />}
                        </span>

                        <span>{toast.message}</span>

                        <button
                            type="button"
                            className="toast__close"
                            onClick={() => dismiss(toast.id)}
                            aria-label="Dismiss notification"
                        >
                            <CloseIcon size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
