import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { addToWishlist, removeFromWishlist } from "../api/users";
import { useAuth, useToast } from "../context/hooks";

// The wishlist lives on the signed-in user (returned at login),
// so the heart state is known instantly on every page. Toggles
// are optimistic: the UI flips first, then reconciles with the
// server's list or rolls back on failure.
export default function useWishlist() {
    const { user, isAuthenticated, updateUser } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const ids = useMemo(() => new Set(user?.wishlist ?? []), [user]);

    const toggle = useCallback(
        async (product) => {
            if (!isAuthenticated) {
                notify("Sign in to save items to your wishlist.");
                navigate("/login", { state: { from: location } });
                return;
            }

            const saved = ids.has(product._id);
            const previous = user.wishlist ?? [];
            const optimistic = saved
                ? previous.filter((id) => id !== product._id)
                : [...previous, product._id];

            updateUser({ ...user, wishlist: optimistic });

            try {
                const wishlist = saved
                    ? await removeFromWishlist(product._id)
                    : await addToWishlist(product._id);

                updateUser({ ...user, wishlist });
                notify(saved ? "Removed from your wishlist" : "Saved to your wishlist");
            } catch (error) {
                updateUser({ ...user, wishlist: previous });
                notify(error.message, { type: "error" });
            }
        },
        [ids, isAuthenticated, location, navigate, notify, updateUser, user]
    );

    return {
        ids,
        count: ids.size,
        isSaved: (productId) => ids.has(productId),
        toggle
    };
}
