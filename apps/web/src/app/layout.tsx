import React from 'react';

import '../../polyfills/expo-polyfills.js';
import 'react-native-get-random-values';

import { ClientProviders } from '../route-components/ClientProviders';

export const metadata = {
    title: 'Nexus',
    description: '',
    icons: {
        icon: '/favicon.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                {/* 1) viewport meta for proper mobile/SSR scaling */}
                <meta
                    name="viewport"
                    content="width=device-width,initial-scale=1"
                />

                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{ margin: 0, padding: 0, height: '100%' }}>
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
