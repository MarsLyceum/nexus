// pages/index.tsx

'use client';

import '../../../polyfills/expo-polyfills.js';
import React from 'react';
import { WelcomeScreen } from '@shared-ui/screens';

export default function Welcome(): JSX.Element {
    return <WelcomeScreen />;
}
