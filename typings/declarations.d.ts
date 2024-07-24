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
        children: unknown; // specify children name to use
    }
}

declare module 'react-native-event-source' {
    interface RNEventSource {
        onmessage?: (event: MessageEvent) => void;
        onerror?: (event: Event) => void;
        addEventListener(type: string, listener: ListenerCallback): any;
        removeAllListeners(): void;
        removeListener(type: string, listener: ListenerCallback): void;
        close(): void;
    }

    interface MessageEvent {
        data: any;
        origin: string;
        lastEventId: string;
        source: null;
        ports: any[];
    }

    type ListenerCallback = (event: MessageEvent) => void;

    export default class EventSource implements RNEventSource {
        constructor(url: string, options?: {});
        onmessage?: (event: MessageEvent) => void;
        onerror?: (event: Event) => void;
        addEventListener(type: string, listener: ListenerCallback): any;
        removeAllListeners(): void;
        removeListener(type: string, listener: ListenerCallback): void;
        close(): void;
    }
}
