import { useCallback, useEffect, useState } from "react";

// =====================================================
// useAsync
// =====================================================
// Runs `load` whenever `deps` change and tracks its result.
// The previous data stays visible while a new request is in
// flight, so filters and pagination never flash empty.
//
//   const { data, error, loading, reload, setData } =
//       useAsync(() => fetchThing(id), [id]);

export default function useAsync(load, deps) {
    const [reloadCount, setReloadCount] = useState(0);
    const requestKey = `${JSON.stringify(deps)}#${reloadCount}`;

    const [state, setState] = useState({
        key: null,
        data: undefined,
        error: null
    });

    useEffect(() => {
        let cancelled = false;

        Promise.resolve()
            .then(load)
            .then(
                (data) => {
                    if (!cancelled) {
                        setState({ key: requestKey, data, error: null });
                    }
                },
                (error) => {
                    if (!cancelled) {
                        setState((current) => ({
                            key: requestKey,
                            data: current.data,
                            error
                        }));
                    }
                }
            );

        return () => {
            cancelled = true;
        };
        // `load` is a fresh closure every render; `requestKey`
        // already captures everything it depends on.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestKey]);

    const reload = useCallback(() => {
        setReloadCount((count) => count + 1);
    }, []);

    // Apply a local update (e.g. after a mutation) without refetching.
    const setData = useCallback((updater) => {
        setState((current) => ({
            ...current,
            data:
                typeof updater === "function"
                    ? updater(current.data)
                    : updater
        }));
    }, []);

    const settled = state.key === requestKey;

    return {
        data: state.data,
        error: settled ? state.error : null,
        loading: !settled,
        reload,
        setData
    };
}
