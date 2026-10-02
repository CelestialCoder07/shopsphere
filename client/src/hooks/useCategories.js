import { fetchCategories } from "../api/products";
import useAsync from "./useAsync";

// Categories come from the catalog itself (with counts and a
// cover image), so adding a product in a new category is enough
// for it to appear across the site.
export default function useCategories() {
    const { data, loading, error } = useAsync(fetchCategories, []);

    return {
        categories: data ?? [],
        names: (data ?? []).map((category) => category.name),
        loading,
        error
    };
}
