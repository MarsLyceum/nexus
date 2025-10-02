import React, { useEffect, useRef, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus, View, Platform } from 'react-native';
import { useMutation } from '@apollo/client';

import { useAppSelector, UserType, RootState } from '../redux';
import { UPDATE_USER } from '../queries';
import { getItemSecure } from '../utils';
import { ACCESS_TOKEN_KEY } from '../constants';

export const StatusManager: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [updateUser] = useMutation(UPDATE_USER);
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const idleTimeout = useRef<number | null>(null);
    const currentStatus = useRef<string>('offline');
    const hasAuthFailed = useRef<boolean>(false);

    // This function updates the user status using GraphQL
    const setStatus = useCallback(
        async (status: string) => {
            if (!user?.id) return;

            const token =
                Platform.OS !== 'web'
                    ? (await getItemSecure(ACCESS_TOKEN_KEY)) ?? undefined
                    : undefined;

            if (Platform.OS !== 'web' && !token) {
                return;
            }

            if (hasAuthFailed.current) {
                return;
            }
            // Determine effective status based on DND preference
            let effectiveStatus = status;
            if (
                (status === 'online' || status === 'offline') &&
                user.status.includes('dnd')
            ) {
                effectiveStatus = `${status}_dnd`;
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
                hasAuthFailed.current = false;
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                const isAuthError =
                    errorMessage.includes('401') ||
                    errorMessage.includes('Unauthorized');

                if (isAuthError) {
                    hasAuthFailed.current = true;
                    return;
                }

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
        ) as unknown as number;
    }, [setStatus]);

    useEffect(() => {
        if (!user?.id) {
            if (idleTimeout.current) {
                clearTimeout(idleTimeout.current);
                idleTimeout.current = null;
            }
            currentStatus.current = 'offline';
            hasAuthFailed.current = false;
            return undefined;
        }

        // When the component mounts or user changes, set the status to online
        void setStatus('online');
        resetIdleTimer();

        const subscription = AppState.addEventListener(
            'change',
            (nextAppState: AppStateStatus) => {
                if (nextAppState === 'active') {
                    void setStatus('online');
                    resetIdleTimer();
                }
                if (nextAppState === 'background' && Platform.OS !== 'web') {
                    void setStatus('offline');
                }
            }
        );

        // On page hide/unload, update the status to offline.
        const handlePageHide = () => {
            void setStatus('offline');
        };

        // Only add these listeners on web
        if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
            window.addEventListener('pagehide', handlePageHide);
            window.addEventListener('beforeunload', handlePageHide);
        }

        return () => {
            if (idleTimeout.current) {
                clearTimeout(idleTimeout.current);
                idleTimeout.current = null;
            }
            subscription.remove();
            // Only remove these listeners on web
            if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
                window.removeEventListener('pagehide', handlePageHide);
                window.removeEventListener('beforeunload', handlePageHide);
            }
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
