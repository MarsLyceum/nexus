export const BorderRadius = {
    ExtraLarge: 28,
    Large: 24,
    XL: 20,
    Medium: 16,
    Small: 12,
    SM: 10,
    ExtraSmall: 8,
    Pill: 999,
} as const;

export const Spacing = {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    XXL: 24,
    XXXL: 32,
} as const;

export const Typography = {
    H1: {
        fontSize: 36,
        fontWeight: '700' as const,
        lineHeight: 43,
        letterSpacing: -0.01,
    },
    H2: {
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 35,
        letterSpacing: -0.01,
    },
    H3: {
        fontSize: 22,
        fontWeight: '600' as const,
        lineHeight: 29,
    },
    Body: {
        fontSize: 17,
        fontWeight: '400' as const,
        lineHeight: 26,
    },
    BodySmall: {
        fontSize: 15,
        fontWeight: '400' as const,
        lineHeight: 22,
    },
    Eyebrow: {
        fontSize: 11,
        fontWeight: '600' as const,
        lineHeight: 13,
        letterSpacing: 0.88,
        textTransform: 'uppercase' as const,
    },
    SectionHeading: {
        fontSize: 18,
        fontWeight: '600' as const,
        lineHeight: 23,
    },
    Button: {
        fontSize: 16,
        fontWeight: '600' as const,
    },
    Caption: {
        fontSize: 13,
        fontWeight: '400' as const,
        lineHeight: 18,
    },
    Code: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
    },
} as const;

export const Opacity = {
    Border: 0.05,
    BorderMedium: 0.08,
    BorderSubtle: 0.03,
    BorderLight: 0.04,
    Overlay: 0.1,
    ElevatedBackdrop: 0.18,
    FocusOutline: 0.18,
} as const;

export const LayerDepth = {
    Backdrop: 0,
    Shell: 1,
    Card: 2,
    Content: 3,
} as const;
