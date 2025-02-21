// useFeedPosts.ts
import { useState, useEffect, useRef } from 'react';
import { useApolloClient } from '@apollo/client';
import { FETCH_CHANNEL_POSTS_QUERY, FETCH_USER_QUERY } from '../queries';
import { getRelativeTime } from '../utils';
import { GroupChannelPostMessage, User, FeedPost } from '../types';

export const useFeedPosts = (channelId?: string) => {
    const apolloClient = useApolloClient();
    const userCacheRef = useRef<Record<string, string>>({});
    const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
    const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

    useEffect(() => {
        if (!channelId) return;
        let cancelled = false;

        const fetchPosts = async () => {
            try {
                console.log('Starting to load feed:', new Date());
                const { data } = await apolloClient.query<{
                    fetchFeedPosts: GroupChannelPostMessage[];
                }>({
                    query: FETCH_CHANNEL_POSTS_QUERY,
                    variables: { channelId, offset: 0 },
                });

                const postsData = data.fetchFeedPosts.filter(
                    (msg) => msg.messageType === 'post'
                );

                const posts: FeedPost[] = await Promise.all(
                    postsData.map(async (msg) => {
                        let username: string;
                        if (userCacheRef.current[msg.postedByUserId]) {
                            username = userCacheRef.current[msg.postedByUserId];
                        } else {
                            const userResult = await apolloClient.query<{
                                fetchUser: User;
                            }>({
                                query: FETCH_USER_QUERY,
                                variables: { userId: msg.postedByUserId },
                            });
                            username = userResult.data.fetchUser.username;
                            userCacheRef.current[msg.postedByUserId] = username;
                        }
                        return {
                            id: msg.id,
                            user: username,
                            domain: msg.domain || '',
                            title: msg.title,
                            upvotes: msg.upvotes,
                            commentsCount: msg.commentsCount,
                            shareCount: msg.shareCount,
                            content: msg.content,
                            time: getRelativeTime(new Date(msg.postedAt)),
                            thumbnail:
                                msg.thumbnail ||
                                `https://picsum.photos/seed/${username}/48`,
                            fromReddit: Math.random() < 0.2, // ~20% chance to be true
                            attachmentUrls: msg.attachmentUrls,
                        } as FeedPost;
                    })
                );
                if (!cancelled) {
                    console.log('Feed loaded', new Date());
                    setFeedPosts(posts);
                    setLoadingFeed(false);
                }
            } catch (error) {
                console.error('Error fetching feed posts:', error);
                if (!cancelled) {
                    setLoadingFeed(false);
                }
            }
        };

        // eslint-disable-next-line no-void
        void fetchPosts();
        return () => {
            cancelled = true;
        };
    }, [apolloClient, channelId]);

    return { feedPosts, loadingFeed };
};
