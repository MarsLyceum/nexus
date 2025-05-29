// server.js
require('source-map-support/register');
const express = require('express');
const next = require('next');
const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Global error handlers for uncaught exceptions and unhandled rejections.
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});

// Helper: Parse a single stack trace line.
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

// Helper: Parse full stack trace into structured data.
function parseFullStackTrace(stack) {
    if (!stack) return [];
    const lines = stack
        .split('\n')
        .filter((line) => line.trim().startsWith('at '));
    return lines.map(parseStackLine).filter((x) => x !== null);
}

// Gather environment information.
function getEnvironmentInfo() {
    return {
        os: os.platform() + ' ' + os.release(),
        nodeVersion: process.version,
        workingDirectory: process.cwd(),
    };
}

// Gather process information.
function getProcessInfo() {
    return {
        commandLine: process.argv.join(' '),
        NODE_OPTIONS: process.env.NODE_OPTIONS || 'Not set',
        DEBUG: process.env.DEBUG || 'Not set',
    };
}

// Gather key configuration files (example: package.json).
function getConfigFilesInfo() {
    const configFiles = [
        'tsconfig.json',
        'babel.config.js',
        '.babelrc',
        'package.json',
    ];
    const configInfo = {};
    configFiles.forEach((filename) => {
        try {
            const filePath = path.join(process.cwd(), filename);
            const content = fs.readFileSync(filePath, 'utf8');
            configInfo[filename] =
                content.length > 300
                    ? content.substring(0, 300) + '...'
                    : content;
        } catch (e) {
            configInfo[filename] = 'Not found or unreadable';
        }
    });
    return configInfo;
}

// Search for module files matching a keyword.
function getModuleFilesInfo(keyword) {
    const glob = require('glob');
    return glob.sync(`**/*${keyword}*`, { nodir: true });
}

// Infer build or runtime phase based on the request URL.
function inferPhase(reqUrl) {
    if (reqUrl.includes('/_next/')) {
        return 'Next.js Internal (Static Assets/Compilation)';
    }
    return 'Runtime (Page Rendering)';
}

// Gather detailed error info.
function getDetailedErrorInfo(err, req) {
    const envInfo = getEnvironmentInfo();
    const processInfo = getProcessInfo();
    const configInfo = getConfigFilesInfo();
    const parsedStack = parseFullStackTrace(err.stack);
    const phase = inferPhase(req.url);
    let moduleFiles = [];
    if (err.message) {
        const match = err.message.match(/page:\s*['"]\/([\w\-]+)['"]/);
        if (match) {
            const keyword = match[1];
            moduleFiles = getModuleFilesInfo(keyword);
        }
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

// Wrap app.prepare() to catch build-time errors.
app.prepare()
    .catch((err) => {
        console.error('Error during Next.js prepare:', err);
        const detailedError = getDetailedErrorInfo(err, {
            url: 'build phase',
            method: 'N/A',
        });
        const logPath = path.join(process.cwd(), 'detailed-errors.log');
        fs.appendFileSync(
            logPath,
            JSON.stringify(detailedError, null, 2) + '\n'
        );
        console.error(
            'Detailed Build Error Report:\n',
            JSON.stringify(detailedError, null, 2)
        );
        process.exit(1);
    })
    .then(() => {
        const server = express();

        // Main request handler.
        server.all('*', (req, res, nextMiddleware) => {
            handle(req, res).catch(nextMiddleware);
        });

        // Error-handling middleware.
        server.use((err, req, res, nextMiddleware) => {
            const detailedError = getDetailedErrorInfo(err, req);
            const logPath = path.join(process.cwd(), 'detailed-errors.log');
            fs.appendFileSync(
                logPath,
                JSON.stringify(detailedError, null, 2) + '\n'
            );
            console.error(
                'Detailed Error Report:\n',
                JSON.stringify(detailedError, null, 2)
            );
            res.status(err.status || 500).send(`
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Error: ${err.status || 500}</h1>
        <p><strong>Message:</strong> ${err.message}</p>
        <p><strong>URL:</strong> ${req.url}</p>
        <p><strong>Phase:</strong> ${detailedError.phase}</p>
        <h2>Detailed Error Report:</h2>
        <pre style="background: #fdd; padding: 10px; white-space: pre-wrap;">
${JSON.stringify(detailedError, null, 2)}
        </pre>
      </div>
    `);
        });

        server.listen(3000, (err) => {
            if (err) throw err;
            console.log('> Ready on http://localhost:3000');
        });
    });
