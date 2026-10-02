import { useState } from "react";

import { StarIcon } from "./icons";

// Read-only rating, e.g. ★★★★½ 4.5 (12)
export function Stars({ rating = 0, count, size = 14, showValue = false }) {
    const rounded = Math.round(rating * 2) / 2;

    return (
        <span className="stars" aria-label={`Rated ${rating} out of 5${count !== undefined ? `, ${count} reviews` : ""}`}>
            <span className="stars__icons" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((value) => {
                    const fill = rounded >= value ? 1 : rounded >= value - 0.5 ? 0.5 : 0;

                    return (
                        <span className="stars__star" key={value}>
                            <span className="stars__empty"><StarIcon size={size} /></span>
                            <span className="stars__full" style={{ width: `${fill * 100}%` }}>
                                <StarIcon size={size} />
                            </span>
                        </span>
                    );
                })}
            </span>

            {showValue && rating > 0 && <span className="stars__value">{rating.toFixed(1)}</span>}
            {count !== undefined && <span className="stars__count">({count})</span>}
        </span>
    );
}

// Clickable 1–5 picker for the review form.
export function StarInput({ value, onChange }) {
    const [hover, setHover] = useState(0);
    const shown = hover || value;

    return (
        <div className="star-input" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={value === star}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    className={`star-input__star${shown >= star ? " is-on" : ""}`}
                    onMouseEnter={() => setHover(star)}
                    onClick={() => onChange(star)}
                >
                    <StarIcon size={26} />
                </button>
            ))}
        </div>
    );
}
