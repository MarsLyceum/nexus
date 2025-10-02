const { detectPort } = require('detect-port');
const { spawn } = require('child_process');

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? '', 10) || 3000;

const parseAdditionalArgs = (argv) => argv.slice(2);

const parsePortNumber = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const extractCliPort = (args) =>
    args.reduce((resolved, token, index) => {
        if (resolved !== undefined) {
            return resolved;
        }
        if (token === '-p' || token === '--port') {
            return parsePortNumber(args[index + 1]);
        }
        if (token.startsWith('--port=')) {
            return parsePortNumber(token.split('=')[1]);
        }
        if (token.startsWith('-p') && token.length > 2) {
            return parsePortNumber(token.slice(2));
        }
        return undefined;
    }, undefined);

const extractEnvPort = (env) =>
    env.PORT === undefined ? undefined : parsePortNumber(env.PORT);

const classifyPortRequest = (envPort, cliPort) => {
    if (cliPort !== undefined) {
        return { origin: 'cli', value: cliPort };
    }
    if (envPort !== undefined) {
        return { origin: 'env', value: envPort };
    }
    return { origin: 'default', value: DEFAULT_PORT };
};

const detectPortIfNeeded = async (request) => {
    if (request.origin !== 'default') {
        return { port: request.value, wasReassigned: false };
    }
    const availablePort = await detectPort(request.value);
    return {
        port: availablePort,
        wasReassigned: availablePort !== request.value,
    };
};

const formatPortAnnouncement = (request, outcome) =>
    request.origin === 'default' && outcome.wasReassigned
        ? `Port ${request.value} in use, switching to ${outcome.port}`
        : undefined;

const buildNextArguments = (additionalArgs, request, outcome) =>
    request.origin === 'default'
        ? additionalArgs.concat(['-p', String(outcome.port)])
        : additionalArgs;

const enrichEnvironment = (baseEnv, request, outcome) => {
    const port = request.origin === 'default' ? outcome.port : request.value;

    return {
        ...baseEnv,
        PORT: String(port),
        NEXT_PUBLIC_PORT: String(port),
    };
};

const launchNext = (args, env) =>
    new Promise((resolve, reject) => {
        const child = spawn('next', ['start', ...args], {
            stdio: 'inherit',
            env,
        });
        child.on('error', reject);
        child.on('exit', (code, signal) => {
            if (signal) {
                process.kill(process.pid, signal);
                return;
            }
            resolve(code ?? 0);
        });
    });

const start = async () => {
    const additionalArgs = parseAdditionalArgs(process.argv);
    const envPort = extractEnvPort(process.env);
    const cliPort = extractCliPort(additionalArgs);
    const portRequest = classifyPortRequest(envPort, cliPort);
    const outcome = await detectPortIfNeeded(portRequest);
    const announcement = formatPortAnnouncement(portRequest, outcome);
    if (announcement !== undefined) {
        console.log(announcement);
    }
    const nextArgs = buildNextArguments(additionalArgs, portRequest, outcome);
    const env = enrichEnvironment(process.env, portRequest, outcome);
    const exitCode = await launchNext(nextArgs, env);
    process.exit(exitCode);
};

start().catch((error) => {
    console.error(error);
    process.exit(1);
});
