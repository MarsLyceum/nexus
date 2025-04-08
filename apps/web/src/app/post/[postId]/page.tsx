// app/post/[postId]/page.tsx

import dynamic from 'next/dynamic';
import '../../../../polyfills/expo-polyfills.js';
import React from 'react';
import { createApolloClient } from 'shared-ui/utils';
import { FETCH_POST_QUERY, FETCH_USER_QUERY } from 'shared-ui/queries';
import type { Post } from 'shared-ui/types';
import { headers } from 'next/headers';

// Dynamically import the client component with SSR enabled
const PostPageClient = dynamic(
    () => import('./PostPageClient').then((mod) => mod.PostPageClient),
    { ssr: true }
);

type PageProps = {
    params: { postId: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

// Use generateMetadata to set dynamic meta tags for this page.
export async function generateMetadata({ params }: PageProps) {
    const { postId } = params;
    const paramHeaders = await headers();

    // Get the host from the request headers.
    const host = paramHeaders.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    // Fetch the post data for metadata
    const client = createApolloClient();
    const { data } = await client.query({
        query: FETCH_POST_QUERY,
        variables: { postId },
    });

    const post: Post | null = data?.fetchPost || null;

    // Compute metadata values, stripping HTML tags if needed.
    const title = post?.title || 'Post';
    const description = post?.content
        ? post.content.replace(/<[^>]+>/g, '').slice(0, 160)
        : '';
    const url = `${origin}/post/${postId}`;
    const image =
        post?.attachmentUrls && post.attachmentUrls.length > 0
            ? post.attachmentUrls[0]
            : `${origin}/default-og-image.jpg`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            images: [{ url: image }],
            type: 'article',
        },
    };
}

export default async function PostPage({ params, searchParams }: PageProps) {
    const { postId } = params;
    const { post: postString, parentCommentId } = searchParams;

    let parsedPost: Post | null = null;
    if (postString) {
        try {
            parsedPost = JSON.parse(postString as string);
        } catch (e) {
            console.error('Failed to parse post from query:', e);
        }
    }

    const client = createApolloClient();
    let postData: Post | undefined = undefined;

    if (!parsedPost) {
        const { data } = await client.query({
            query: FETCH_POST_QUERY,
            variables: { postId },
        });
        postData = data?.fetchPost;
    } else {
        postData = parsedPost;
    }

    // Compute user ID from the fetched post
    const computedUserId = postData?.postedByUserId || postData?.user || '';
    let userData;
    if (computedUserId) {
        const { data } = await client.query({
            query: FETCH_USER_QUERY,
            variables: { userId: computedUserId },
        });
        userData = data?.fetchUser;
    }

    return (
        <PostPageClient
            post={postData}
            user={userData}
            parentCommentId={parentCommentId ? String(parentCommentId) : null}
        />
    );
}
