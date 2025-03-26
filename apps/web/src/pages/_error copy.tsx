import React from 'react';
import App from 'next/app';
import os from 'os';
import process from 'process';
import fs from 'fs';
import path from 'path';

// Helper: Parse a single stack trace line.
// Expected format: "at functionName (fileName:lineNumber:columnNumber)" or "at fileName:lineNumber:columnNumber"
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

class ErrorPage extends React.Component {
    static async getInitialProps({ res, err, asPath, req }) {
        // Environment Information
        const envInfo = {
            os: os.platform() + ' ' + os.release(),
            nodeVersion: process.version,
            workingDirectory: process.cwd(),
        };

        // Process Information
        const processInfo = {
            commandLine: process.argv.join(' '),
            NODE_OPTIONS: process.env.NODE_OPTIONS || 'Not set',
            DEBUG: process.env.DEBUG || 'Not set',
        };

        // Configuration Files (example: package.json)
        let configInfo = {};
        try {
            const pkgPath = path.join(process.cwd(), 'package.json');
            const pkgContent = fs.readFileSync(pkgPath, 'utf8');
            configInfo['package.json'] =
                pkgContent.length > 300
                    ? pkgContent.substring(0, 300) + '...'
                    : pkgContent;
        } catch (e) {
            configInfo['package.json'] = 'Not found or unreadable';
        }

        // Parse the error's stack trace into structured data
        let parsedStack = [];
        if (err && err.stack) {
            const stackLines = err.stack
                .split('\n')
                .filter((line) => line.trim().startsWith('at '));
            parsedStack = stackLines
                .map(parseStackLine)
                .filter((parsed) => parsed !== null);
        }

        // Infer the build phase or route (for demonstration, we simply use the requested path)
        const phase = asPath || 'Unknown Route';

        const errorReport = {
            message: err ? err.message : 'No error message',
            rawStack: err ? err.stack : 'No stack trace',
            parsedStack,
            phase,
            envInfo,
            processInfo,
            configInfo,
            // Optionally, you might search for files related to the route here.
        };

        const statusCode = res
            ? res.statusCode
            : err
              ? err.statusCode || 500
              : 404;
        return { statusCode, errorReport, asPath };
    }

    render() {
        const { statusCode, errorReport, asPath } = this.props;
        return (
            <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
                <h1>Error {statusCode}</h1>
                <p>
                    An error occurred at path: <code>{asPath}</code>
                </p>
                <h2>Detailed Error Report:</h2>
                <pre
                    style={{
                        background: '#fdd',
                        padding: 10,
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {JSON.stringify(errorReport, null, 2)}
                </pre>
            </div>
        );
    }
}

export default ErrorPage;
