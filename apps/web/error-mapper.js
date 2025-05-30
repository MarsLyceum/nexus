// error-mapper.js
const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');

// cache SourceMapConsumers so we only parse each .map once
const consumerCache = Object.create(null);

async function mapStackTrace(stack) {
    const lines = stack.split('\n');
    const mapped = await Promise.all(
        lines.map(async (line) => {
            // try to match both `at foo (file.js:123:45)` and `at file.js:123:45`
            const m =
                line.match(/\((.*):(\d+):(\d+)\)$/) ||
                line.match(/at (.*):(\d+):(\d+)$/);
            if (!m) return line;

            const [, filePath, genLine, genCol] = m;
            const mapPath = path.resolve(process.cwd(), filePath + '.map');

            if (!fs.existsSync(mapPath)) return line;

            try {
                let consumer = consumerCache[mapPath];
                if (!consumer) {
                    const raw = fs.readFileSync(mapPath, 'utf8');
                    consumer = await new SourceMapConsumer(JSON.parse(raw));
                    consumerCache[mapPath] = consumer;
                }

                const orig = consumer.originalPositionFor({
                    line: Number(genLine),
                    column: Number(genCol),
                });

                if (orig.source && orig.line != null && orig.column != null) {
                    const human = `${orig.source}:${orig.line}:${orig.column}`;
                    return line.replace(
                        `${filePath}:${genLine}:${genCol}`,
                        human
                    );
                }
            } catch (_) {
                // ignore mapping errors
            }

            return line;
        })
    );

    return mapped.join('\n');
}

async function report(err) {
    if (err && err.stack) {
        console.error('🚀 Mapped stack:\n' + (await mapStackTrace(err.stack)));
    } else {
        console.error(err);
    }
}

// hook into Node’s global error handlers
process.on('uncaughtException', (err) => {
    report(err).then(() => process.exit(1));
});
process.on('unhandledRejection', (reason) => {
    report(reason).then(() => process.exit(1));
});
