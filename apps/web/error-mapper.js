// error-mapper.js
const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');

// never truncate your stacks
Error.stackTraceLimit = Infinity;

// cache of SourceMapConsumers
const consumerCache = Object.create(null);

// recursively preload every .map under .next
(function preloadMaps(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
            preloadMaps(full);
        } else if (full.endsWith('.map')) {
            try {
                const raw = fs.readFileSync(full, 'utf8');
                consumerCache[full] = new SourceMapConsumer(JSON.parse(raw));
            } catch {
                // ignore broken maps
            }
        }
    }
})(path.resolve(process.cwd(), '.next'));

// fallback on-demand mapper (in case someone still calls it)
async function mapStackTrace(stack) {
    const lines = stack.split('\n');
    const mapped = await Promise.all(
        lines.map(async (line) => {
            const m =
                line.match(/\((.*):(\d+):(\d+)\)$/) ||
                line.match(/at (.*):(\d+):(\d+)$/);
            if (!m) return line;

            const [, filePath, genLine, genCol] = m;
            const mapPath = path.resolve(process.cwd(), filePath + '.map');
            const consumer = consumerCache[mapPath];
            if (!consumer) return line;

            const orig = consumer.originalPositionFor({
                line: Number(genLine),
                column: Number(genCol),
            });
            if (orig.source && orig.line != null && orig.column != null) {
                const human = `${orig.source}:${orig.line}:${orig.column}`;
                return line.replace(`${filePath}:${genLine}:${genCol}`, human);
            }
            return line;
        })
    );
    return mapped.join('\n');
}

// install a global PrepareStackTrace so ANY err.stack is already remapped
Error.prepareStackTrace = (err, frames) => {
    const out = frames.map((fn) => {
        const file = fn.getFileName();
        const line = fn.getLineNumber();
        const col = fn.getColumnNumber();
        // find matching map
        for (const mapPath of Object.keys(consumerCache)) {
            const jsOut = mapPath.slice(0, -4);
            if (file && file.endsWith(path.basename(jsOut))) {
                const orig = consumerCache[mapPath].originalPositionFor({
                    line,
                    column: col,
                });
                if (orig.source) {
                    const fnName = fn.getFunctionName() || '<anonymous>';
                    return `    at ${fnName} (${orig.source}:${orig.line}:${orig.column})`;
                }
            }
        }
        // fallback
        return `    at ${fn.toString()}`;
    });
    return `${err.name}: ${err.message}\n${out.join('\n')}`;
};

// unified reporter
async function report(err) {
    if (err && err.stack) {
        console.error('🚀 Mapped stack:\n' + err.stack);
    } else {
        console.error(err);
    }
}

// global Node handlers
process.on('uncaughtException', (err) => {
    report(err).then(() => process.exit(1));
});
process.on('unhandledRejection', (reason) => {
    report(reason).then(() => process.exit(1));
});

// Express-style middleware (4 args!)
function middleware(err, req, res, next) {
    report(err).then(() => {
        // you can extend this HTML as you like
        res.status(err.status || 500).send(`
      <div style="padding:20px;font-family:sans-serif;">
        <h1>Error: ${err.status || 500}</h1>
        <pre>${err.stack}</pre>
      </div>
    `);
    });
}

// monkey-patch Next’s renderError so SSR failures also get reported
function patchNext(app) {
    console.log('[patchNext] ✔ patchNext() is running');

    const originalRenderToHTML = app.renderToHTML.bind(app);
    app.renderToHTML = async function (req, res, pathname, query) {
        try {
            return await originalRenderToHTML(req, res, pathname, query);
        } catch (err) {
            // Always report first
            await report(err);
            // Then re-throw so it bubbles into your Express catch-all
            throw err;
        }
    };

    const originalRender = app.render.bind(app);
    app.render = async (req, res, pathname, query) => {
        try {
            return await originalRender(req, res, pathname, query);
        } catch (err) {
            // Always report and then re‐throw so our catch-all sees it
            await report(err);
            throw err;
        }
    };

    const originalRenderError = app.renderError.bind(app);
    app.renderError = async (err, req, res, pathname, query) => {
        await report(err);
        return originalRenderError(err, req, res, pathname, query);
    };
}

module.exports = { report, middleware, patchNext };
