// utils/apolloClient.ts

import { ApolloClient, InMemoryCache, from, split } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition, Observable } from '@apollo/client/utilities';
import { Platform } from 'react-native';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { REFRESH_TOKEN } from '../queries';
import {
    REFRESH_TOKEN_KEY,
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_EXPIRES_AT_KEY,
} from '../constants';

import { getItemSecure, setItemSecure } from './storageUtil';
import { getSafeWindow } from './getSafeWindow';
import { detectEnvironment } from './detectEnvironment';

// Detect if the code is running in a Cloud Run container by checking for the K_SERVICE env variable.
const isCloudRun =
    typeof process !== 'undefined' && process.env.K_SERVICE !== undefined;

// Detect if running on the frontend domain dev.my-nexus.net.
const isDevDomain =
    getSafeWindow() &&
    getSafeWindow()?.location &&
    getSafeWindow()?.location.hostname === 'dev.my-nexus.net';

// Use local server only if NOT running in Cloud Run or on the dev.my-nexus.net domain.
const onRemoteServer = isCloudRun || isDevDomain;

const environment = detectEnvironment();
const isReactNativeWeb = environment === 'react-native-web';
const isNext =
    environment === 'nextjs-client' || environment === 'nextjs-server';

// Set endpoints based on whether we are using the local server or the Cloud Run server.
const graphqlApiGatewayEndpointHttp =
    !onRemoteServer && !(process.env.USE_REMOTE_GRAPHQL === 'true')
        ? isNext
            ? 'http://localhost:3000/graphql'
            : isReactNativeWeb
              ? 'http://localhost:8081/graphql'
              : 'http://192.168.1.48:4000/graphql'
        : 'https://dev.my-nexus.net/graphql';

const graphqlApiGatewayEndpointWs =
    !onRemoteServer && !(process.env.USE_REMOTE_GRAPHQL === 'true')
        ? isNext
            ? 'ws://localhost:3000/graphql'
            : isReactNativeWeb
              ? 'ws://localhost:4000/graphql'
              : 'ws://192.168.1.48:4000/graphql'
        : 'wss://dev.my-nexus.net/graphql';

export const createApolloClient = () => {
    let client!: ApolloClient<unknown>;

    const authLink = setContext(async (_, { headers }) => {
        // on web we rely on cookies; mobile gets header
        let token: string | undefined;
        if (Platform.OS !== 'web') {
            token = (await getItemSecure(ACCESS_TOKEN_KEY)) ?? undefined;
        }

        return {
            headers: {
                ...headers,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        };
    });

    // eslint-disable-next-line consistent-return
    const errorLink = onError(
        (errorResponse: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            graphQLErrors?: any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            operation: any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            forward: any;
            // eslint-disable-next-line consistent-return
        }) => {
            const { graphQLErrors, operation, forward } = errorResponse;
            console.error('Apollo Error:', errorResponse);

            const authError = graphQLErrors?.find(
                (e: { extensions: { code: string } }) =>
                    e.extensions?.code === 'UNAUTHENTICATED'
            );
            if (authError) {
                return new Observable((observer) => {
                    void (async () => {
                        const rawExpiresAt = await getItemSecure(
                            REFRESH_TOKEN_EXPIRES_AT_KEY
                        );
                        const expiresAt = rawExpiresAt
                            ? Number.parseInt(rawExpiresAt, 10)
                            : 0;

                        if (!expiresAt || Date.now() / 1000 >= expiresAt) {
                            await setItemSecure(ACCESS_TOKEN_KEY, '');
                            await setItemSecure(REFRESH_TOKEN_KEY, '');
                            observer.complete();
                            return;
                        }

                        try {
                            const refreshToken =
                                Platform.OS !== 'web'
                                    ? (await getItemSecure(
                                          REFRESH_TOKEN_KEY
                                      )) ?? undefined
                                    : undefined;
                            const response = await client.mutate({
                                mutation: REFRESH_TOKEN,
                                variables: { refreshToken },
                            });
                            if (
                                Platform.OS !== 'web' &&
                                response.data?.refreshToken
                            ) {
                                const {
                                    accessToken: newAccessToken,
                                    refreshToken: newRefreshToken,
                                    refreshTokenExpiresAt,
                                } = response.data.refreshToken;

                                await setItemSecure(
                                    ACCESS_TOKEN_KEY,
                                    newAccessToken
                                );
                                await setItemSecure(
                                    REFRESH_TOKEN_KEY,
                                    newRefreshToken
                                );
                                await setItemSecure(
                                    REFRESH_TOKEN_EXPIRES_AT_KEY,
                                    refreshTokenExpiresAt
                                );
                            }

                            forward(operation).subscribe({
                                next: (result) => observer.next(result),
                                error: (err) => observer.error(err),
                                complete: () => observer.complete(),
                            });
                        } catch (error) {
                            console.error('errorLink: refresh failed', error);
                            observer.error(error);
                        }
                    })();
                });
            }
        }
    );

    // Create an HTTP link using createUploadLink to support file uploads.
    const httpLink = from([
        authLink,
        errorLink,
        createUploadLink({
            uri: graphqlApiGatewayEndpointHttp,
            credentials: 'include', // Ensures cookies are sent with requests
            // This function tells apollo-upload-client which values represent files.
            // @ts-expect-error file
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            isExtractableFile: (value: any) => {
                if (value === undefined || value === null) return false;
                if (typeof File !== 'undefined' && value instanceof File)
                    return true;
                if (typeof Blob !== 'undefined' && value instanceof Blob)
                    return true;
                if (
                    typeof value === 'object' &&
                    typeof value.uri === 'string' &&
                    typeof value.name === 'string' &&
                    typeof value.type === 'string'
                ) {
                    if (
                        Platform.OS === 'web' &&
                        typeof value.createReadStream !== 'function'
                    ) {
                        Object.defineProperty(value, 'createReadStream', {
                            value: () => {
                                throw new Error(
                                    'createReadStream is not supported on web'
                                );
                            },
                            writable: false,
                            enumerable: false,
                        });
                    }
                    return true;
                }
                return false;
            },
        }),
    ]);

    // Create a WebSocket link for subscriptions (client-only).
    const wsLink = getSafeWindow()
        ? new GraphQLWsLink(
              createClient({
                  url: graphqlApiGatewayEndpointWs,
                  webSocketImpl: ReconnectingWebSocket,
              })
          )
        : undefined;

    // Use split to direct subscriptions to wsLink and other operations to httpLink.
    const link =
        !getSafeWindow() || !wsLink
            ? httpLink
            : split(
                  ({ query }) => {
                      const definition = getMainDefinition(query);
                      return (
                          definition.kind === 'OperationDefinition' &&
                          definition.operation === 'subscription'
                      );
                  },
                  wsLink,
                  httpLink
              );

    client = new ApolloClient({
        ssrMode: !getSafeWindow(),
        link,
        cache: new InMemoryCache(),
    });

    return client;
};
