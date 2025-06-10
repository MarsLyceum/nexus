// server.js

// 1) Grab CLI args (skip node + script path)
const rawArgs = process.argv.slice(2);

// 2) Detect your flags
const isDebug = rawArgs.includes('--debug');
const isStacktrace = rawArgs.includes('--stacktrace');

// 3) Pull in all the same flags as `next start`
let port = process.env.PORT || 3000;
let hostname = '0.0.0.0';

// --help
if (rawArgs.includes('-h') || rawArgs.includes('--help')) {
    console.log(`
Usage: node server.js [--debug] [--stacktrace] [--port <n>] [--hostname <host>]

  --debug         run in dev mode (just like next dev)
  --stacktrace    enable source-map-support + detailed error pages
  -p, --port      port to listen on (default: $PORT or 3000)
  -H, --hostname  hostname to bind (default: 0.0.0.0)
  -h, --help      show this help
`);
    process.exit(0);
}

// -p / --port and -H / --hostname
for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a === '-p' || a === '--port') {
        const val = rawArgs[i + 1];
        if (val && !val.startsWith('-')) {
            port = Number(val);
            i++;
        }
    }
    if (a === '-H' || a === '--hostname') {
        const val = rawArgs[i + 1];
        if (val && !val.startsWith('-')) {
            hostname = val;
            i++;
        }
    }
}

// 4) Conditionally load your mapper + source-map-support
let report, patchNext;
if (isStacktrace) {
    const errorMapper = require('./error-mapper');
    report = errorMapper.report;
    patchNext = errorMapper.patchNext;
    require('source-map-support').install();
}

// 5) Set NODE_ENV to match
process.env.NODE_ENV = isDebug ? 'development' : 'production';

const express = require('express');
const next = require('next');
const os = require('os');
const fs = require('fs');
const path = require('path');
const processModule = process;

// 6) All your existing helpers, unmodified:
function parseStackLine(line) {
    const regex =
        /at\s+(?:(?<func>[\w\.$<>]+)\s+\()?(?<file>[^():]+):(?<line>\d+):(?<column>\d+)\)?/;
    const m = regex.exec(line.trim());
    if (m && m.groups) {
        return {
            function: m.groups.func || null,
            file: m.groups.file,
            line: parseInt(m.groups.line, 10),
            column: parseInt(m.groups.column, 10),
        };
    }
    return null;
}
function parseFullStackTrace(stack) {
    if (!stack) return [];
    return stack
        .split('\n')
        .filter((l) => l.trim().startsWith('at '))
        .map(parseStackLine)
        .filter((x) => x !== null);
}
function getEnvironmentInfo() {
    return {
        os: os.platform() + ' ' + os.release(),
        nodeVersion: processModule.version,
        workingDirectory: processModule.cwd(),
    };
}
function getProcessInfo() {
    return {
        commandLine: processModule.argv.join(' '),
        NODE_OPTIONS: processModule.env.NODE_OPTIONS || 'Not set',
        DEBUG: processModule.env.DEBUG || 'Not set',
    };
}
function getConfigFilesInfo() {
    const configFiles = [
        'tsconfig.json',
        'babel.config.js',
        '.babelrc',
        'package.json',
    ];
    const info = {};
    configFiles.forEach((f) => {
        try {
            const c = fs.readFileSync(
                path.join(processModule.cwd(), f),
                'utf8'
            );
            info[f] = c.length > 300 ? c.slice(0, 300) + '...' : c;
        } catch {
            info[f] = 'Not found or unreadable';
        }
    });
    return info;
}
function getModuleFilesInfo(keyword) {
    const glob = require('glob');
    return glob.sync(`**/*${keyword}*`, { nodir: true });
}
function inferPhase(reqUrl) {
    return reqUrl.includes('/_next/')
        ? 'Next.js Internal (Static Assets/Compilation)'
        : 'Runtime (Page Rendering)';
}
function getDetailedErrorInfo(err, req) {
    const envInfo = getEnvironmentInfo();
    const processInfo = getProcessInfo();
    const configInfo = getConfigFilesInfo();
    const parsedStack = parseFullStackTrace(err.stack);
    const phase = inferPhase(req.url);
    let moduleFiles = [];
    if (err.message) {
        const m = err.message.match(/page:\s*['"]\/([\w\-]+)['"]/);
        if (m) moduleFiles = getModuleFilesInfo(m[1]);
    }
    return {
        message: err.message,
        rawStack: err.stack,
        parsedStack,
        phase,
        envInfo,
        processInfo,
        configInfo,
        moduleFiles,
        url: req.url,
        method: req.method,
    };
}

// 7) Prepare Next
const dev = isDebug;
const app = next({ dev });
const handle = app.getRequestHandler();

// If stacktrace mode, patch Next’s internal renderError
if (isStacktrace) {
    patchNext(app);
}

console.log(
    `Starting server in ${dev ? 'DEBUG' : 'PRODUCTION'} mode` +
        (isStacktrace ? ' with STACKTRACE support' : '') +
        ` on ${hostname}:${port}`
);

// global Node handlers
processModule.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    processModule.exit(1);
});
processModule.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    processModule.exit(1);
});

app.prepare()
    .catch((err) => {
        console.error('Error during Next.js prepare:', err);
        if (isStacktrace) {
            const detailed = getDetailedErrorInfo(err, {
                url: 'build phase',
                method: 'N/A',
            });
            fs.appendFileSync(
                path.join(processModule.cwd(), 'detailed-errors.log'),
                JSON.stringify(detailed, null, 2) + '\n'
            );
            console.error(
                'Detailed Build Error Report:\n',
                JSON.stringify(detailed, null, 2)
            );
        }
        processModule.exit(1);
    })
    .then(() => {
        const server = express();

        if (isStacktrace) {
            server.use((req, res, next) => {
                console.log('[REQUEST]', req.method, req.url);
                return next();
            });
        }

        server.get('/__/hosting/verification', (req, res) => {
            // If you need to return a specific token or file for Firebase Hosting,
            // do so here. For now, we just return a blank 200 OK.
            return res.status(200).send('');
        });
        // (You can also catch all /__/hosting/* if needed:)
        server.use('/__/hosting', (req, res, next) => {
            // If any other /__/hosting/* path comes in, treat it as 404 or 200:
            return res.status(404).send('Not found');
        });

        server.get('/_next/static/health', (req, res) => {
            // You can return a tiny 200 OK body. Next static‐files are usually cached, so:
            res.setHeader(
                'Cache-Control',
                'public, max-age=0, must-revalidate'
            );
            return res.status(200).send('OK');
        });

        server.get('/healthz', (req, res) => {
            return res.status(200).send('OK');
        });

        server.use('/_next', express.static(path.join(process.cwd(), '.next')));
        server.use('/_next', (req, res, next) => {
            // If express.static did NOT find a matching file under ".next", it calls next().
            // We then throw a 404‐style Error so our catch‐all sees it.
            const err404 = new Error(
                `Static file not found: ${req.originalUrl}`
            );
            err404.status = 404;
            return next(err404);
        });

        if (isStacktrace) {
            // forward all requests into Next, catching error
            server.use(async (req, res, next) => {
                try {
                    // This covers everything Next does (including static files, SSR, API routes, etc.)
                    await handle(req, res);
                } catch (err) {
                    // 1) Immediately run our mapper
                    await report(err);

                    // 2) Forward into our Express error middleware
                    return next(err);
                }
            });

            // single 4-arg middleware that preserves *all* original behavior
            server.use(async (err, req, res, next) => {
                console.error('[server] Entered custom error handler');

                // 1) mapped stack in logs
                await report(err);

                // 2) detailed JSON log
                const detailed = getDetailedErrorInfo(err, req);
                const logPath = path.join(
                    processModule.cwd(),
                    'detailed-errors.log'
                );
                fs.appendFileSync(
                    logPath,
                    JSON.stringify(detailed, null, 2) + '\n'
                );
                console.error(
                    'Detailed Error Report:\n',
                    JSON.stringify(detailed, null, 2)
                );

                // 3) same HTML you had
                res.status(err.status || 500).send(`
      <div style="padding:20px;font-family:sans-serif;">
        <h1>Error: ${err.status || 500}</h1>
        <p><strong>Message:</strong> ${err.message}</p>
        <p><strong>URL:</strong> ${req.url}</p>
        <p><strong>Phase:</strong> ${detailed.phase}</p>
        <h2>Detailed Error Report:</h2>
        <pre style="background:#fdd;padding:10px;white-space:pre-wrap;">
${JSON.stringify(detailed, null, 2)}
        </pre>
      </div>
    `);
            });
        } else {
            // vanilla next start behavior
            server.all('*', (req, res) => handle(req, res));
        }

        server.listen(port, hostname, (err) => {
            if (err) throw err;
            let prettyHostname = hostname;
            if (hostname === '0.0.0.0') {
                prettyHostname = 'localhost';
            }
            console.log(`> Ready on http://${prettyHostname}:${port}`);
        });
    });
