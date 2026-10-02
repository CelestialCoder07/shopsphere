import { MapPinIcon } from "./icons";

// Renders the address Stripe collected at checkout, if any.
export default function ShippingAddress({ address, compact = false }) {
    if (!address?.line1) return null;

    const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(", ");

    return (
        <address className={`ship-to${compact ? " ship-to--compact" : ""}`}>
            <span className="ship-to__label">
                <MapPinIcon size={13} /> Ship to
            </span>
            <span className="strong">{address.name}</span>
            <span>
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
            </span>
            <span>{cityLine}{address.country ? ` · ${address.country}` : ""}</span>
            {address.phone && <span className="muted">{address.phone}</span>}
        </address>
    );
}
