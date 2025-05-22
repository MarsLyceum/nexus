'use client';

import React from 'react';
import { PostScreen } from 'shared-ui/screens';
import type { Post, User } from 'shared-ui/types';

type PostPageProps = {
    post?: Post;
    user?: User;
    parentCommentId: string | null;
};

export function PostPageClient({
    post,
    user,
    parentCommentId,
}: PostPageProps): React.JSX.Element {
    return (
        <PostScreen
            post={post} // pass the post object directly
            user={user} // pass the user as a prop
            parentCommentId={parentCommentId || undefined}
        />
    );
}
