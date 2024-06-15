declare module '*.jpg' {
    const content: string;
    // eslint-disable-next-line import/no-default-export
    export default content;
}

declare module '*.jpeg' {
    const content: string;
    // eslint-disable-next-line import/no-default-export
    export default content;
}

declare module '*.svg' {
    import { SvgProps } from 'react-native-svg';

    const content: React.FC<SvgProps>;
    // eslint-disable-next-line import/no-default-export
    export default content;
}

declare namespace JSX {
    interface ElementChildrenAttribute {
        children: unknown  // specify children name to use
    }
}
