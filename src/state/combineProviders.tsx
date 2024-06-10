import React, { ReactNode, FC, ComponentType } from 'react';

// Define the type for the provider components
type ProviderComponent = ComponentType<{ children: ReactNode }>;

// Define the type for the combineProviders function
const combineProviders = (
    providers: ProviderComponent[]
): FC<{ children: ReactNode }> => {
    return ({ children }) => {
        return providers.reduceRight((acc, Provider) => {
            return <Provider>{acc}</Provider>;
        }, children as ReactNode);
    };
};

export default combineProviders;
