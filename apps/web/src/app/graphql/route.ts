// app/graphql/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOCAL = 'http://localhost:4000/graphql';
const REMOTE =
    'https://nexus-web-service-197277044151.us-west1.run.app/graphql';
const isCloudRun = Boolean(process.env.K_SERVICE);

function isDevDomain(req: NextRequest): boolean {
    return req.headers.get('host')?.split(':')[0] === 'dev.my-nexus.net';
}

async function proxy(req: NextRequest): Promise<NextResponse> {
    const onRemote = isCloudRun || isDevDomain(req);
    const useRemoteGQ = process.env.NEXT_PUBLIC_USE_REMOTE_GRAPHQL === 'true';
    const target = !onRemote && !useRemoteGQ ? LOCAL : REMOTE;

    // ← clone all incoming headers (cookie, content-type, etc)
    const headers = new Headers(req.headers);

    const res = await fetch(target, {
        method: req.method,
        headers,
        body: req.body,
        // @ts-expect-error duplex
        duplex: 'half',
    });

    // mirror status + all response headers (including Set-Cookie)
    const response = new NextResponse(res.body, {
        status: res.status,
        statusText: res.statusText,
    });
    res.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
            response.headers.append(key, value);
        } else {
            response.headers.set(key, value);
        }
    });

    return response;
}

// ↓ alias every verb to the same proxy fn
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
