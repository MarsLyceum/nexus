import { COLORS } from '../constants';

export const getOnlineStatusDotColor = (status?: string): string => {
    const currentStatus = status ? status.toLowerCase() : 'online';
    switch (currentStatus) {
        case 'online': {
            return COLORS.Success;
        }
        case 'online_dnd': {
            return COLORS.Error;
        }
        case 'idle': {
            return COLORS.Idle;
        }
        case 'offline':
        case 'invisible': {
            return COLORS.InactiveText;
        }
        case 'offline_dnd': {
            return COLORS.Error;
        }
        default: {
            return COLORS.InactiveText;
        }
    }
};
