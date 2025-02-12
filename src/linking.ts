export const linking = {
    prefixes: ['peeps://', 'http://localhost:8081'],
    config: {
        screens: {
            // When the path is "post/:id", navigate to PostScreen.
            Main: {
                screens: {
                    PostScreen: 'post/:id',
                },
            },
        },
    },
};
