// =====================================================
// ICON SET
// =====================================================
// Hand-rolled 24px stroke icons. Kept in one file so every
// icon shares the same grid, stroke weight and join style.

const svgProps = (size) => ({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false"
});

export const CartIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.1a2 2 0 0 0 2-1.55L20.5 7H6" />
        <circle cx="9.5" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
    </svg>
);

export const SearchIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.2-4.2" />
    </svg>
);

export const PlusIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M12 5v14M5 12h14" />
    </svg>
);

export const MinusIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M5 12h14" />
    </svg>
);

export const TrashIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.9 12.2a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5L17.5 7" />
    </svg>
);

export const CheckIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
);

export const CheckCircleIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.4 2.7 2.7L16 9.8" />
    </svg>
);

export const CloseIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
);

export const ChevronRightIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
);

export const ChevronLeftIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
);

export const ArrowRightIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </svg>
);

export const ArrowLeftIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
    </svg>
);

export const UserIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <circle cx="12" cy="8.5" r="3.7" />
        <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
);

export const PackageIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <path d="M20.5 8.2v7.6a2 2 0 0 1-1 1.73l-6.5 3.7a2 2 0 0 1-2 0l-6.5-3.7a2 2 0 0 1-1-1.73V8.2a2 2 0 0 1 1-1.73l6.5-3.7a2 2 0 0 1 2 0l6.5 3.7a2 2 0 0 1 1 1.73Z" />
        <path d="M3.8 7.4 12 12l8.2-4.6M12 12v9.4" />
    </svg>
);

export const LayersIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <path d="m12 3.5 8.5 4.6L12 12.7 3.5 8.1 12 3.5Z" />
        <path d="m4 12.4 8 4.3 8-4.3M4 16.6l8 4.3 8-4.3" />
    </svg>
);

export const TruckIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <path d="M2.5 6.5h10v11h-10z" />
        <path d="M12.5 10h4l3 3v4.5h-7z" />
        <circle cx="6.5" cy="18.5" r="1.6" />
        <circle cx="16.5" cy="18.5" r="1.6" />
    </svg>
);

export const ShieldIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <path d="M12 3.2 19 6v5.6c0 4.2-2.9 7.6-7 9.2-4.1-1.6-7-5-7-9.2V6l7-2.8Z" />
        <path d="m9 12 2.2 2.2L15.2 10" />
    </svg>
);

export const ClockIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.2V12l3.2 2" />
    </svg>
);

export const AlertIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.6v5.2M12 16.2h.01" />
    </svg>
);

export const MenuIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
);

export const LogoutIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M9.5 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3.5" />
        <path d="M15.5 8.5 19 12l-3.5 3.5M19 12H9.5" />
    </svg>
);

export const SparkIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9 12 3.5Z" />
        <path d="M18.5 16.5 19.3 19l2.4.8-2.4.8-.8 2.4" />
    </svg>
);

export const ImagePlaceholderIcon = ({ size = 34 }) => (
    <svg {...svgProps(size)}>
        <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
        <circle cx="8.6" cy="10" r="1.6" />
        <path d="m3.5 17 5-4.6 4.2 3.8 3-2.6 4.8 4.2" />
    </svg>
);

export const InboxIcon = ({ size = 26 }) => (
    <svg {...svgProps(size)}>
        <path d="M3.5 13.5 6 6.2A2 2 0 0 1 7.9 5h8.2a2 2 0 0 1 1.9 1.2l2.5 7.3v3.8a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-3.8Z" />
        <path d="M3.5 13.5h4.2l1 2.2h6.6l1-2.2h4.2" />
    </svg>
);

export const HeartIcon = ({ size = 18, filled = false }) => (
    <svg {...svgProps(size)} fill={filled ? "currentColor" : "none"}>
        <path d="M12 20.3s-7.5-4.6-9.3-9.2C1.4 7.7 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.2 4.3 6.6-1.8 4.6-9.3 9.2-9.3 9.2Z" />
    </svg>
);

export const StarIcon = ({ size = 16, filled = true }) => (
    <svg {...svgProps(size)} fill={filled ? "currentColor" : "none"}>
        <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6Z" />
    </svg>
);

export const TagIcon = ({ size = 18 }) => (
    <svg {...svgProps(size)}>
        <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.1 6.1a1.5 1.5 0 0 1-2.1 0l-8.8-7.8Z" />
        <circle cx="8" cy="8" r="1.5" />
    </svg>
);

export const MapPinIcon = ({ size = 16 }) => (
    <svg {...svgProps(size)}>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
        <circle cx="12" cy="10" r="2.3" />
    </svg>
);
