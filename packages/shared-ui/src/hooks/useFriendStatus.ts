// ▶ src/hooks/useFriendStatus.ts
import { useCallback, useMemo } from 'react';
import { useSubscription } from '@apollo/client';
import { GET_FRIENDS, FRIEND_STATUS_CHANGED } from '../queries';
import type { FriendItemData } from '../types';

type Payload = {
    friendStatusChanged: {
        friendUserId: string;
        status:
            | 'online'
            | 'online_dnd'
            | 'idle'
            | 'offline'
            | 'invisible'
            | 'offline_dnd';
    };
};
type Vars = { userId?: string };

export function useFriendStatus(userId?: string) {
    const handleData = useCallback(
        ({
            client,
            subscriptionData,
        }: {
            client: import('@apollo/client').ApolloClient<unknown>;
            subscriptionData: { data?: Payload };
        }) => {
            const payload = subscriptionData.data?.friendStatusChanged;
            if (!payload) return;
            const data = client.readQuery<{ getFriends: FriendItemData[] }>({
                query: GET_FRIENDS,
                variables: { userId },
            });
            if (!data) return;

            const idx = data.getFriends.findIndex(
                (f) => f.friend.id === payload.friendUserId
            );
            if (
                idx === -1 ||
                data.getFriends[idx].friend.status === payload.status
            ) {
                return;
            }

            const updated = [...data.getFriends];
            updated[idx] = {
                ...updated[idx],
                friend: { ...updated[idx].friend, status: payload.status },
            };

            client.writeQuery({
                query: GET_FRIENDS,
                variables: { userId },
                data: { getFriends: updated },
            });
        },
        [userId]
    );

    const subOptions = useMemo(
        () => ({
            variables: { userId },
            skip: !userId,
            onSubscriptionData: handleData,
        }),
        [userId, handleData]
    );

    useSubscription<Payload, Vars>(FRIEND_STATUS_CHANGED, subOptions);
}
