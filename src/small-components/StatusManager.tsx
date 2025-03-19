import React, { useEffect, useRef, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import { useMutation } from '@apollo/client';
import { useAppSelector, UserType, RootState } from '../redux';
import { UPDATE_USER } from '../queries';

export const StatusManager: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [updateUser] = useMutation(UPDATE_USER);
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const idleTimeout = useRef<NodeJS.Timeout | null>(null);
    const currentStatus = useRef<string>('offline');

    // This function updates the user status using GraphQL
    const setStatus = useCallback(
        async (status: string) => {
            if (!user) return;
            // Determine effective status based on DND preference
            let effectiveStatus = status;
            if (
                (status === 'online' || status === 'offline') &&
                user.status.includes('dnd')
            ) {
                effectiveStatus = `${status}-dnd`;
            }
            if (currentStatus.current === effectiveStatus) return;
            try {
                await updateUser({
                    variables: {
                        id: user.id,
                        status: effectiveStatus,
                    },
                });
                currentStatus.current = effectiveStatus;
            } catch (error) {
                console.error(
                    `Error updating status to ${effectiveStatus}:`,
                    error
                );
            }
        },
        [updateUser, user]
    );

    // This timer resets the status to idle after a period of inactivity
    const resetIdleTimer = useCallback(() => {
        if (idleTimeout.current) {
            clearTimeout(idleTimeout.current);
        }
        if (currentStatus.current === 'idle') {
            void setStatus('online');
        }
        idleTimeout.current = setTimeout(
            () => {
                void setStatus('idle');
            },
            15 * 60 * 1000 // 15 minutes
        );
    }, [setStatus]);

    useEffect(() => {
        // When the component mounts, set the status to online
        void setStatus('online');
        resetIdleTimer();

        const subscription = AppState.addEventListener(
            'change',
            (nextAppState: AppStateStatus) => {
                if (nextAppState === 'active') {
                    void setStatus('online');
                    resetIdleTimer();
                }
                // No action needed for inactive/background on web.
            }
        );

        // On page hide/unload, update the status to offline using sendBeacon or synchronous XHR.
        const handlePageHide = () => {
            void setStatus('offline');
        };

        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('beforeunload', handlePageHide);

        return () => {
            if (idleTimeout.current) {
                clearTimeout(idleTimeout.current);
            }
            subscription.remove();
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('beforeunload', handlePageHide);
            // On cleanup, attempt to update the status to offline.
            void setStatus('offline');
        };
    }, [user, resetIdleTimer, setStatus]);

    return (
        <View style={{ flex: 1 }} onTouchStart={resetIdleTimer}>
            {children}
        </View>
    );
};
