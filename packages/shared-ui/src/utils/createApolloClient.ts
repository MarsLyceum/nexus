// lib/apolloClient.ts

import { ApolloClient, InMemoryCache, from, split } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { Platform } from 'react-native';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

const isRunningLocally = true;

const graphqlApiGatewayEndpointHttp = isRunningLocally
    ? 'http://localhost:4000/graphql'
    : 'https://nexus-web-service-197277044151.us-west1.run.app/graphql';

const graphqlApiGatewayEndpointWs = isRunningLocally
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
        // This function tells apollo-upload-client which values represent files.
        // @ts-expect-error file
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
const wsLink =
    typeof window !== 'undefined'
        ? new GraphQLWsLink(
              createClient({
                  url: graphqlApiGatewayEndpointWs,
                  webSocketImpl: ReconnectingWebSocket,
              })
          )
        : undefined;

// Use split to direct subscriptions to wsLink and other operations to httpLink.
const link =
    typeof window === 'undefined' || !wsLink
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
        ssrMode: typeof window === 'undefined',
        link,
        cache: new InMemoryCache(),
    });
