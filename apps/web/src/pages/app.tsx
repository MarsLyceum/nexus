// apps/web/pages/app.tsx;
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AppScreenServer } from '../page-components/app/app.server';

// Dynamically import the client version (using the named export).
const AppScreenClient = dynamic(
    () =>
        import('../page-components/app/app.client').then(
            (mod) => mod.AppScreenClient
        ),
    { ssr: false }
);

export default function AppDrawerScreenPage(): JSX.Element {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // When the component mounts, set mounted to true so that the client version is rendered.
        setMounted(true);
    }, []);

    return (
        <>
            {/* This is the server-rendered static markup */}
            <div style={{ display: mounted ? 'none' : 'block' }}>
                <AppScreenServer />
            </div>
            {/* Only render the interactive (client) version after mounting */}
            {mounted && <AppScreenClient />}
        </>
    );
}
