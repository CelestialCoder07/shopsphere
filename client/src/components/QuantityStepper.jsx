import { MinusIcon, PlusIcon } from "./icons";

export default function QuantityStepper({ value, min = 1, max, onChange, label }) {
    return (
        <div className="qty" role="group" aria-label={label || "Quantity"}>
            <button
                type="button"
                className="qty__btn"
                onClick={() => onChange(value - 1)}
                disabled={value <= min}
                aria-label="Decrease quantity"
            >
                <MinusIcon size={14} />
            </button>

            <span className="qty__value" aria-live="polite">{value}</span>

            <button
                type="button"
                className="qty__btn"
                onClick={() => onChange(value + 1)}
                disabled={max !== undefined && value >= max}
                aria-label="Increase quantity"
            >
                <PlusIcon size={14} />
            </button>
        </div>
    );
}
