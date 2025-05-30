// server.js

// detect flags
const isDebug = process.argv.includes('--debug');
const isStacktrace = process.argv.includes('--stacktrace');

// only load error-mapping and source maps when explicitly asked
if (isStacktrace) {
    require('./error-mapper');
    require('source-map-support').install();
}

// make NODE_ENV match the chosen mode
process.env.NODE_ENV = isDebug ? 'development' : 'production';

const express = require('express');
const next = require('next');
const os = require('os');
const fs = require('fs');
const path = require('path');
const processModule = process;

// dev=true builds on the fly; dev=false serves from .next
const dev = isDebug;
const app = next({ dev });
const handle = app.getRequestHandler();

// startup banner
console.log(
    `Starting server in ${dev ? 'DEBUG' : 'PRODUCTION'} mode` +
        (isStacktrace ? ' with STACKTRACE support' : '')
);

// catch any uncaught exceptions/rejections
processModule.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    processModule.exit(1);
});
processModule.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    processModule.exit(1);
});

// parse a single "at ..." stack line
function parseStackLine(line) {
    const regex =
        /at\s+(?:(?<func>[\w\.$<>]+)\s+\()?(?<file>[^():]+):(?<line>\d+):(?<column>\d+)\)?/;
    const match = regex.exec(line.trim());
    if (match && match.groups) {
        return {
            function: match.groups.func || null,
            file: match.groups.file,
            line: parseInt(match.groups.line, 10),
            column: parseInt(match.groups.column, 10),
        };
    }
    return null;
}

// turn an Error.stack into structured entries
function parseFullStackTrace(stack) {
    if (!stack) return [];
    return stack
        .split('\n')
        .filter((l) => l.trim().startsWith('at '))
        .map(parseStackLine)
        .filter((x) => x !== null);
}

// gather some runtime info
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

// read up to 300 chars of key config files
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
            const content = fs.readFileSync(
                path.join(processModule.cwd(), f),
                'utf8'
            );
            info[f] =
                content.length > 300 ? content.slice(0, 300) + '...' : content;
        } catch {
            info[f] = 'Not found or unreadable';
        }
    });
    return info;
}

// find files matching a keyword
function getModuleFilesInfo(keyword) {
    const glob = require('glob');
    return glob.sync(`**/*${keyword}*`, { nodir: true });
}

// decide if we’re in build/asset phase or page render
function inferPhase(reqUrl) {
    return reqUrl.includes('/_next/')
        ? 'Next.js Internal (Static Assets/Compilation)'
        : 'Runtime (Page Rendering)';
}

// assemble the full detailed error object
function getDetailedErrorInfo(err, req) {
    const envInfo = getEnvironmentInfo();
    const processInfo = getProcessInfo();
    const configInfo = getConfigFilesInfo();
    const parsedStack = parseFullStackTrace(err.stack);
    const phase = inferPhase(req.url);
    let moduleFiles = [];
    if (err.message) {
        const match = err.message.match(/page:\s*['"]\/([\w\-]+)['"]/);
        if (match) moduleFiles = getModuleFilesInfo(match[1]);
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

// prepare the Next app
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
            // catch errors and run our custom reporter
            server.all('*', (req, res, next) => {
                handle(req, res).catch(next);
            });
            server.use((err, req, res) => {
                const detailed = getDetailedErrorInfo(err, req);
                fs.appendFileSync(
                    path.join(processModule.cwd(), 'detailed-errors.log'),
                    JSON.stringify(detailed, null, 2) + '\n'
                );
                console.error(
                    'Detailed Error Report:\n',
                    JSON.stringify(detailed, null, 2)
                );
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

        server.listen(3000, (err) => {
            if (err) throw err;
            console.log('> Ready on http://localhost:3000');
        });
    });
