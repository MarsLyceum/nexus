// utils/apolloClient.ts

import { ApolloClient, InMemoryCache, from, split } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { Platform } from 'react-native';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { getSafeWindow } from './getSafeWindow';

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
const useLocalServer = true;

// Set endpoints based on whether we are using the local server or the Cloud Run server.
const graphqlApiGatewayEndpointHttp =
    !onRemoteServer && useLocalServer
        ? 'http://localhost:4000/graphql'
        : 'https://nexus-web-service-197277044151.us-west1.run.app/graphql';

const graphqlApiGatewayEndpointWs =
    !onRemoteServer && useLocalServer
        ? 'ws://localhost:4000/graphql'
        : 'wss://nexus-web-service-197277044151.us-west1.run.app/graphql';

// Create a common error link.
const errorLink = onError((error) => {
    console.error('Apollo Error:', error);
});

// Create an HTTP link using createUploadLink to support file uploads.
const httpLink = from([
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

export const createApolloClient = () =>
    new ApolloClient({
        ssrMode: !getSafeWindow(),
        link,
        cache: new InMemoryCache(),
    });
