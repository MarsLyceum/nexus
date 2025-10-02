import { Platform } from 'react-native';

export type ShadowKind = 'light' | 'medium';

type ShadowPreset = {
    web: string;
    ios: {
        shadowColor: string;
        shadowOffset: { width: number; height: number };
        shadowOpacity: number;
        shadowRadius: number;
    };
    android: {
        elevation: number;
    };
};

const shadowMap: Record<ShadowKind, ShadowPreset> = {
    light: {
        web: '0 1px 4px rgba(0,0,0,0.3)',
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
        },
        android: {
            elevation: 2,
        },
    },
    medium: {
        web: '0 4px 10px rgba(0,0,0,0.25)',
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
        },
        android: {
            elevation: 5,
        },
    },
};

export const getShadowStyle = (kind: ShadowKind) => {
    const preset = shadowMap[kind];

    return Platform.select({
        web: {
            boxShadow: preset.web,
        },
        ios: preset.ios,
        android: preset.android,
        default: {},
    });
};
