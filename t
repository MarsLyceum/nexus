[1mdiff --git a/packages/shared-ui/src/hooks/useCreatePost.ts b/packages/shared-ui/src/hooks/useCreatePost.ts[m
[1mindex b067048..be9ba13 100644[m
[1m--- a/packages/shared-ui/src/hooks/useCreatePost.ts[m
[1m+++ b/packages/shared-ui/src/hooks/useCreatePost.ts[m
[36m@@ -2,7 +2,7 @@[m
 import { useMutation } from '@apollo/client';[m
 import {[m
     CREATE_GROUP_CHANNEL_POST_MUTATION,[m
[31m-    FETCH_CHANNEL_POSTS_QUERY,[m
[32m+[m[32m    GET_FEED_CHANNEL_POSTS_QUERY,[m
 } from '../queries';[m
 import { AttachmentFile } from '../types';[m
 [m
[36m@@ -28,7 +28,7 @@[m [mexport const useCreatePost = ([m
             },[m
             refetchQueries: [[m
                 {[m
[31m-                    query: FETCH_CHANNEL_POSTS_QUERY,[m
[32m+[m[32m                    query: GET_FEED_CHANNEL_POSTS_QUERY,[m
                     variables: { channelId, offset: 0, limit: 100 },[m
                 },[m
             ],[m
[1mdiff --git a/packages/shared-ui/src/hooks/useFeedPosts.ts b/packages/shared-ui/src/hooks/useFeedPosts.ts[m
[1mindex e4bb7d7..40d4d1a 100644[m
[1m--- a/packages/shared-ui/src/hooks/useFeedPosts.ts[m
[1m+++ b/packages/shared-ui/src/hooks/useFeedPosts.ts[m
[36m@@ -1,9 +1,9 @@[m
 // useFeedPosts.ts[m
 import { useState, useEffect, useRef } from 'react';[m
 import { useApolloClient } from '@apollo/client';[m
[31m-import { FETCH_CHANNEL_POSTS_QUERY, FETCH_USER_QUERY } from '../queries';[m
[32m+[m[32mimport { GET_FEED_CHANNEL_POSTS_QUERY, FETCH_USER_QUERY } from '../queries';[m
 import { getRelativeTime } from '../utils';[m
[31m-import { GroupChannelPostMessage, User, FeedPost } from '../types';[m
[32m+[m[32mimport { FeedChannelPost, User, FeedPost } from '../types';[m
 [m
 export const useFeedPosts = (channelId?: string) => {[m
     const apolloClient = useApolloClient();[m
[36m@@ -19,15 +19,13 @@[m [mexport const useFeedPosts = (channelId?: string) => {[m
             try {[m
                 console.log('Starting to load feed:', new Date());[m
                 const { data } = await apolloClient.query<{[m
[31m-                    fetchFeedPosts: GroupChannelPostMessage[];[m
[32m+[m[32m                    getFeedChannelPosts: FeedChannelPost[];[m
                 }>({[m
[31m-                    query: FETCH_CHANNEL_POSTS_QUERY,[m
[32m+[m[32m                    query: GET_FEED_CHANNEL_POSTS_QUERY,[m
                     variables: { channelId, offset: 0, limit: 100 },[m
                 });[m
 [m
[31m-                const postsData = data.fetchFeedPosts.filter([m
[31m-                    (msg) => msg.messageType === 'post'[m
[31m-                );[m
[32m+[m[32m                const postsData = data.getFeedChannelPosts;[m
 [m
                 const posts: FeedPost[] = await Promise.all([m
                     postsData.map(async (msg) => {[m
[36m@@ -57,7 +55,6 @@[m [mexport const useFeedPosts = (channelId?: string) => {[m
                             thumbnail:[m
                                 msg.thumbnail ||[m
                                 `https://picsum.photos/seed/${username}/48`,[m
[31m-                            fromReddit: Math.random() < 0.2, // ~20% chance to be true[m
                             attachmentUrls: msg.attachmentUrls,[m
                         } as FeedPost;[m
                     })[m
[1mdiff --git a/packages/shared-ui/src/queries/group-api/FETCH_CHANNEL_MESSAGES_QUERY.ts b/packages/shared-ui/src/queries/group-api/FETCH_CHANNEL_MESSAGES_QUERY.ts[m
[1mdeleted file mode 100644[m
[1mindex 81f5653..0000000[m
[1m--- a/packages/shared-ui/src/queries/group-api/FETCH_CHANNEL_MESSAGES_QUERY.ts[m
[1m+++ /dev/null[m
[36m@@ -1,19 +0,0 @@[m
[31m-import { gql } from '@apollo/client';[m
[31m-[m
[31m-export const FETCH_CHANNEL_MESSAGES_QUERY = gql`[m
[31m-    query FetchChannelMessages($channelId: String!, $offset: Int, $limit: Int) {[m
[31m-        fetchChannelMessages([m
[31m-            channelId: $channelId[m
[31m-            offset: $offset[m
[31m-            limit: $limit[m
[31m-        ) {[m
[31m-            id[m
[31m-            content[m
[31m-            postedAt[m
[31m-            edited[m
[31m-            channelId[m
[31m-            postedByUserId[m
[31m-            attachmentUrls[m
[31m-        }[m
[31m-    }[m
[31m-`;[m
[1mdiff --git a/packages/shared-ui/src/queries/group-api/FETCH_CHANNEL_POSTS_QUERY.ts b/packages/shared-ui/src/queries/group-api/FETCH_CHANNEL_POSTS_QUERY.ts[m
[1mdeleted file mode 100644[m
[1mindex a44bfeb..0000000[m
[1m--- a/packages/shared-ui/src/queries/group-api/FETCH_CHANNEL_POSTS_QUERY.ts[m
[1m+++ /dev/null[m
[36m@@ -1,29 +0,0 @@[m
[31m-import { gql } from '@apollo/client';[m
[31m-[m
[31m-export const FETCH_CHANNEL_POSTS_QUERY = gql`[m
[31m-    query FetchChannelMessage($channelId: String!, $offset: Int, $limit: Int) {[m
[31m-        fetchFeedPosts: fetchChannelMessages([m
[31m-            channelId: $channelId[m
[31m-            offset: $offset[m
[31m-            limit: $limit[m
[31m-        ) {[m
[31m-            id[m
[31m-            content[m
[31m-            postedAt[m
[31m-            edited[m
[31m-            channelId[m
[31m-            postedByUserId[m
[31m-            messageType[m
[31m-            attachmentUrls[m
[31m-            ... on PostMessage {[m
[31m-                title[m
[31m-                flair[m
[31m-                domain[m
[31m-                thumbnail[m
[31m-                upvotes[m
[31m-                commentsCount[m
[31m-                shareCount[m
[31m-            }[m
[31m-        }[m
[31m-    }[m
[31m-`;[m
[1mdiff --git a/packages/shared-ui/src/queries/group-api/index.ts b/packages/shared-ui/src/queries/group-api/index.ts[m
[1mindex 5a2a709..a70d7cf 100644[m
[1m--- a/packages/shared-ui/src/queries/group-api/index.ts[m
[1m+++ b/packages/shared-ui/src/queries/group-api/index.ts[m
[36m@@ -2,8 +2,8 @@[m [mexport * from './CREATE_GROUP_CHANNEL_MESSAGE_MUTATION';[m
 export * from './CREATE_GROUP_CHANNEL_POST_MUTATION';[m
 export * from './CREATE_GROUP_MUTATION';[m
 export * from './CREATE_POST_COMMENT_MUTATION';[m
[31m-export * from './FETCH_CHANNEL_MESSAGES_QUERY';[m
[31m-export * from './FETCH_CHANNEL_POSTS_QUERY';[m
[32m+[m[32mexport * from './GET_TEXT_CHANNEL_MESSAGES_QUERY';[m
[32m+[m[32mexport * from './GET_FEED_CHANNEL_POSTS_QUERY';[m
 export * from './FETCH_POST_COMMENTS_QUERY';[m
 export * from './FETCH_POST_QUERY';[m
 export * from './FETCH_USER_GROUPS_QUERY';[m
[1mdiff --git a/packages/shared-ui/src/types/FeedPost.ts b/packages/shared-ui/src/types/FeedPost.ts[m
[1mindex f2f0397..f442de1 100644[m
[1m--- a/packages/shared-ui/src/types/FeedPost.ts[m
[1m+++ b/packages/shared-ui/src/types/FeedPost.ts[m
[36m@@ -9,7 +9,6 @@[m [mexport type FeedPost = {[m
     content: string;[m
     time: string;[m
     thumbnail: string;[m
[31m-    fromReddit?: boolean;[m
     attachmentUrls?: string[];[m
 };[m
 [m
[1mdiff --git a/packages/shared-ui/src/types/Group.ts b/packages/shared-ui/src/types/Group.ts[m
[1mindex 04b987b..0815249 100644[m
[1m--- a/packages/shared-ui/src/types/Group.ts[m
[1m+++ b/packages/shared-ui/src/types/Group.ts[m
[36m@@ -1,5 +1,4 @@[m
[31m-// Discriminated union for messages[m
[31m-export type BaseGroupChannelMessage = {[m
[32m+[m[32mexport type TextChannelMessage = {[m
     id: string;[m
     content: string;[m
     postedAt: Date;[m
[36m@@ -11,12 +10,17 @@[m [mexport type BaseGroupChannelMessage = {[m
     attachmentUrls?: string[];[m
 };[m
 [m
[31m-export type GroupChannelRegularMessage = BaseGroupChannelMessage & {[m
[31m-    messageType: 'message'; // for regular messages[m
[31m-};[m
[32m+[m[32mexport type FeedChannelPost = {[m
[32m+[m[32m    id: string;[m
[32m+[m[32m    content: string;[m
[32m+[m[32m    postedAt: Date;[m
[32m+[m[32m    edited: boolean;[m
[32m+[m[32m    // eslint-disable-next-line no-use-before-define[m
[32m+[m[32m    channel?: GroupChannel;[m
[32m+[m[32m    channelId: string;[m
[32m+[m[32m    postedByUserId: string;[m
[32m+[m[32m    attachmentUrls?: string[];[m
 [m
[31m-export type GroupChannelPostMessage = BaseGroupChannelMessage & {[m
[31m-    messageType: 'post'; // discriminator value for posts[m
     title: string;[m
     flair?: string;[m
     domain?: string;[m
[36m@@ -26,9 +30,7 @@[m [mexport type GroupChannelPostMessage = BaseGroupChannelMessage & {[m
     shareCount: number;[m
 };[m
 [m
[31m-export type GroupChannelMessage =[m
[31m-    | GroupChannelRegularMessage[m
[31m-    | GroupChannelPostMessage;[m
[32m+[m[32mexport type GroupChannelMessage = TextChannelMessage | FeedChannelPost;[m
 [m
 // New type for post comments (reflecting GroupChannelPostCommentEntity)[m
 export type GroupChannelPostComment = {[m
[36m@@ -37,7 +39,7 @@[m [mexport type GroupChannelPostComment = {[m
     postedAt: Date;[m
     edited: boolean;[m
     postedByUserId: string;[m
[31m-    // Reference to the parent post (GroupChannelPostMessage)[m
[32m+[m[32m    // Reference to the parent post (FeedChannelPost)[m
     postId: string;[m
     // For threaded replies, optional parent comment id[m
     parentCommentId?: string | null;[m
[1mdiff --git a/packages/shared-ui/src/types/Message.ts b/packages/shared-ui/src/types/Message.ts[m
[1mindex 63acbfa..8ba5878 100644[m
[1m--- a/packages/shared-ui/src/types/Message.ts[m
[1m+++ b/packages/shared-ui/src/types/Message.ts[m
[36m@@ -1,7 +1,7 @@[m
[31m-import { GroupChannelRegularMessage } from './Group';[m
[32m+[m[32mimport { TextChannelMessage } from './Group';[m
 import { Message } from './DirectMessages';[m
 [m
[31m-export type MessageWithAvatar = GroupChannelRegularMessage & {[m
[32m+[m[32mexport type MessageWithAvatar = TextChannelMessage & {[m
     avatar: string;[m
     username: string;[m
 };[m
