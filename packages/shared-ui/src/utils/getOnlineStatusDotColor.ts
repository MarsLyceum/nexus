import { Theme } from '../theme';

export const getOnlineStatusDotColor = (
    theme: Theme,
    status?: string
): string => {
    const currentStatus = status ? status.toLowerCase() : 'online';
    switch (currentStatus) {
        case 'online': {
            return theme.colors.Success;
        }
        case 'online_dnd': {
            return theme.colors.Error;
        }
        case 'idle': {
            return theme.colors.Idle;
        }
        case 'offline':
        case 'invisible': {
            return theme.colors.InactiveText;
        }
        case 'offline_dnd': {
            return theme.colors.Error;
        }
        default: {
            return theme.colors.InactiveText;
        }
    }
};
