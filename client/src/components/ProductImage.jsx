import { useState } from "react";

import { ImagePlaceholderIcon } from "./icons";

// Product photo with a neutral placeholder when the URL is
// missing or fails to load.
export default function ProductImage({ src, alt, iconSize = 34 }) {
    const [failedSrc, setFailedSrc] = useState(null);

    if (!src || failedSrc === src) {
        return (
            <div className="product-card__fallback" role="img" aria-label={alt}>
                <ImagePlaceholderIcon size={iconSize} />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailedSrc(src)}
        />
    );
}
