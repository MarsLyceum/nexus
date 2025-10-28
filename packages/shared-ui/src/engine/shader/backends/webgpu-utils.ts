export const checkWebGPUAvailable = (): boolean =>
    typeof navigator !== 'undefined' && 'gpu' in navigator;

export type ConfigurationTracker = {
    readonly isConfigured: () => boolean;
    readonly matches: (width: number, height: number) => boolean;
    readonly mark: (width: number, height: number) => void;
    readonly reset: () => void;
};

export const createConfigurationTracker = (): ConfigurationTracker => {
    let width = 0;
    let height = 0;

    const mark = (nextWidth: number, nextHeight: number) => {
        width = nextWidth;
        height = nextHeight;
    };

    const reset = () => {
        mark(0, 0);
    };

    return {
        isConfigured: () => width > 0 && height > 0,
        matches: (nextWidth: number, nextHeight: number) =>
            width === nextWidth &&
            height === nextHeight &&
            width > 0 &&
            height > 0,
        mark,
        reset,
    };
};

type ShaderCompilationMessage = {
    readonly type: string;
    readonly lineNum?: number;
    readonly linePos?: number;
    readonly message: string;
};

type CompilationInfo = {
    readonly messages: ReadonlyArray<ShaderCompilationMessage>;
};

type ShaderModuleWithCompilationInfo = GPUShaderModule & {
    readonly getCompilationInfo?: () => Promise<CompilationInfo>;
    readonly compilationInfo?: () => Promise<CompilationInfo>;
};

export const loadCompilationInfo = async (
    module: GPUShaderModule
): Promise<CompilationInfo | undefined> => {
    const moduleWithInfo = module as ShaderModuleWithCompilationInfo;

    if (typeof moduleWithInfo.compilationInfo === 'function') {
        return moduleWithInfo.compilationInfo();
    }
    if (typeof moduleWithInfo.getCompilationInfo === 'function') {
        return moduleWithInfo.getCompilationInfo();
    }

    console.warn(
        '[WebGPU] Shader compilation diagnostics unavailable on this browser'
    );
    return undefined;
};

export const reportShaderCompilation = async (
    module: GPUShaderModule,
    stage: 'vertex' | 'fragment'
): Promise<string[]> => {
    const info = await loadCompilationInfo(module);
    const messages = (info?.messages ?? []).filter(
        (message) => message.type !== 'info'
    );

    if (messages.length === 0) {
        return [];
    }

    const formatted = messages.map((message) => {
        const hasLocation =
            typeof message.lineNum === 'number' &&
            typeof message.linePos === 'number';
        const location = hasLocation
            ? ` (${message.lineNum}:${message.linePos})`
            : '';
        return `[${stage}] ${message.type}${location}: ${message.message}`;
    });

    console.error(
        `[WebGPU] Shader compilation messages:\n${formatted.join('\n')}`
    );

    return formatted;
};
