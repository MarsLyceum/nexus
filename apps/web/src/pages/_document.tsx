// pages/_document.tsx
import Document, {
    Html,
    Head,
    Main,
    NextScript,
    DocumentContext,
} from 'next/document';
const {
    registerComponent,
    getApplication,
} = require('react-native-web/dist/cjs/exports/AppRegistry');

registerComponent('Main', () => Main);
const { getStyleElement } = getApplication('Main');

export default class MyDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
        const initialProps = await Document.getInitialProps(ctx);
        return { ...initialProps };
    }

    render() {
        return (
            <Html lang="en">
                <Head>
                    {/* 1) RN‑Web’s SSR styles */}
                    {getStyleElement()}

                    {/* 2) your normal <meta> / <link> tags */}
                    <meta
                        name="viewport"
                        content="width=device-width,initial-scale=1"
                    />
                    <link
                        rel="preconnect"
                        href="https://fonts.googleapis.com"
                    />
                    <link
                        rel="preconnect"
                        href="https://fonts.gstatic.com"
                        crossOrigin="anonymous"
                    />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
                        rel="stylesheet"
                    />
                </Head>
                <body style={{ margin: 0, padding: 0, height: '100%' }}>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
