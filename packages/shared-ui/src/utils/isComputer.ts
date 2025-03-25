import { Platform } from 'react-native';

import { isMobileBrowser } from './isMobileBrowser';

export const isComputer = (): boolean =>
    !(Platform.OS === 'ios' || Platform.OS === 'android' || isMobileBrowser());
