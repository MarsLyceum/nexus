// ReportParseErrorPlugin.js
class ReportParseErrorPlugin {
    constructor(options = {}) {
        // Default options: verbose logging, no limit on errors, summary enabled by default.
        this.options = Object.assign(
            {
                verbose: true,
                maxErrorsToLog: Infinity,
                showSummary: true,
            },
            options
        );
        this.loggedErrors = new Set();
        this.errorReports = []; // Collect all errors for summary purposes.
    }

    // Helper to extract package name from a module resource string.
    getPackageName(moduleResource) {
        if (!moduleResource) return 'Unknown package';
        if (moduleResource.includes('node_modules')) {
            const parts = moduleResource.split(/node_modules[\\/]/);
            if (parts[1]) {
                const packageParts = parts[1].split(/[\\/]/);
                return packageParts[0].startsWith('@')
                    ? packageParts.slice(0, 2).join('/')
                    : packageParts[0];
            }
        }
        return 'Local';
    }

    apply(compiler) {
        // Improved heuristic: Extract a detailed error type and description.
        const extractErrorType = (error) => {
            const message = error.message || '';
            let errorType = 'UnknownError';
            if (error.name && error.name !== 'Error') {
                errorType = error.name;
            } else if (/Module not found/i.test(message)) {
                errorType = 'ModuleNotFoundError';
            } else if (/Unexpected token/i.test(message)) {
                errorType = 'SyntaxError';
            } else if (/cannot read properties of undefined/i.test(message)) {
                errorType = 'UndefinedPropertyError';
            } else if (/tap/i.test(message)) {
                errorType = 'HookRegistrationError';
            } else if (/ReferenceError/i.test(message)) {
                errorType = 'ReferenceError';
            } else if (/TypeError/i.test(message)) {
                errorType = 'TypeError';
            } else if (/RangeError/i.test(message)) {
                errorType = 'RangeError';
            } else {
                const match = message.match(/^([A-Za-z]+Error)/);
                errorType = match ? match[1] : 'UnknownError';
            }
            if (error.loc && error.loc.start) {
                errorType += ` (at ${error.loc.start.line}:${error.loc.start.column})`;
            }
            return errorType;
        };

        // Helper to report an error and record it.
        const reportError = (error, moduleResource) => {
            const errorType = extractErrorType(error);
            const key = `${moduleResource || 'Unknown module'}::${errorType}::${error.message}`;
            if (this.loggedErrors.has(key)) return;
            this.loggedErrors.add(key);
            const report = {
                severity: 'ERROR',
                component: 'Webpack',
                module: moduleResource || 'Unknown module',
                package: this.getPackageName(moduleResource),
                errorType,
                message: error.message,
                location: error.loc && error.loc.start ? error.loc.start : null,
                stack:
                    this.options.verbose && error.stack
                        ? error.stack
                        : undefined,
                timestamp: new Date().toISOString(),
            };
            // Log the error in structured JSON format.
            console.error(JSON.stringify(report, null, 2));
            this.errorReports.push({
                module: report.module,
                package: report.package,
                errorType: report.errorType,
                message: report.message,
            });
        };

        // Heuristic 1: Tap into multiple parser types.
        const parserTypes = [
            'javascript/auto',
            'javascript/esm',
            'javascript/dynamic',
        ];
        compiler.hooks.normalModuleFactory.tap(
            'EnhancedReportParseErrorPlugin',
            (nmf) => {
                parserTypes.forEach((type) => {
                    try {
                        const parser = nmf.hooks.parser.for(type);
                        if (parser && parser.hooks && parser.hooks.error) {
                            parser.hooks.error.tap(
                                'EnhancedReportParseErrorPlugin',
                                (error) => {
                                    const moduleResource =
                                        parser.state &&
                                        parser.state.module &&
                                        parser.state.module.resource;
                                    reportError(error, moduleResource);
                                }
                            );
                        }
                    } catch (e) {
                        console.warn(
                            JSON.stringify(
                                {
                                    severity: 'WARNING',
                                    component: 'Webpack',
                                    parserType: type,
                                    message: `Parser hook for type "${type}" not available: ${e.message}`,
                                    timestamp: new Date().toISOString(),
                                },
                                null,
                                2
                            )
                        );
                    }
                });
            }
        );

        // Heuristic 2: Tap into the module build phase.
        compiler.hooks.thisCompilation.tap(
            'EnhancedReportParseErrorPlugin',
            (compilation) => {
                // Catch errors during module build.
                compilation.hooks.buildModule.tap(
                    'EnhancedReportParseErrorPlugin',
                    (module) => {
                        if (module.buildInfo && module.buildInfo.errors) {
                            module.buildInfo.errors.forEach((error) => {
                                reportError(error, module.resource);
                            });
                        }
                    }
                );
                // After sealing, iterate through modules to capture any leftover errors.
                compilation.hooks.afterSeal.tap(
                    'EnhancedReportParseErrorPlugin',
                    () => {
                        for (const module of compilation.modules) {
                            if (module.errors && module.errors.length > 0) {
                                module.errors.forEach((error) => {
                                    reportError(error, module.resource);
                                });
                            }
                        }
                    }
                );
            }
        );

        // Heuristic 3: Fallback in the done hook.
        compiler.hooks.done.tap('EnhancedReportParseErrorPlugin', (stats) => {
            const errors = stats.compilation.errors;
            let count = 0;
            errors.forEach((error) => {
                let moduleResource = 'Unknown module';
                if (error.module && error.module.resource) {
                    moduleResource = error.module.resource;
                } else if (error.file) {
                    moduleResource = error.file;
                }
                if (count < this.options.maxErrorsToLog) {
                    reportError(error, moduleResource);
                    count++;
                }
            });
            if (errors.length > count) {
                console.error(
                    JSON.stringify(
                        {
                            severity: 'ERROR',
                            component: 'Webpack',
                            message: `Total errors: ${errors.length}. Only ${count} errors logged (limit set by options).`,
                            timestamp: new Date().toISOString(),
                        },
                        null,
                        2
                    )
                );
            }
        });

        // Heuristic 4: Global failed hook for overall compilation failures.
        compiler.hooks.failed.tap('EnhancedReportParseErrorPlugin', (error) => {
            reportError(error, 'Global Compilation Failure');
        });

        // Heuristic 5: Use the processAssets hook (at the SUMMARY stage) to capture any errors that have been added to the compilation.
        compiler.hooks.compilation.tap(
            'EnhancedReportParseErrorPlugin',
            (compilation) => {
                // PROCESS_ASSETS_STAGE_SUMMARIZE is available on webpack 5.
                const { Compilation } = compiler.webpack;
                compilation.hooks.processAssets.tap(
                    {
                        name: 'EnhancedReportParseErrorPlugin',
                        stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
                    },
                    (assets) => {
                        // Iterate over compilation.errors to capture any errors that haven't been reported.
                        compilation.errors.forEach((error) => {
                            let moduleResource = 'Unknown module';
                            if (error.module && error.module.resource) {
                                moduleResource = error.module.resource;
                            } else if (error.file) {
                                moduleResource = error.file;
                            }
                            reportError(error, moduleResource);
                        });
                    }
                );
            }
        );

        // Heuristic 6: After emitting, output a comprehensive summary.
        if (this.options.showSummary) {
            compiler.hooks.afterEmit.tap(
                'EnhancedReportParseErrorPlugin',
                () => {
                    const errorSummary = {};
                    this.errorReports.forEach((report) => {
                        const key = `${report.module}||${report.errorType}`;
                        if (!errorSummary[key]) {
                            errorSummary[key] = {
                                module: report.module,
                                package: report.package,
                                errorType: report.errorType,
                                count: 0,
                                messages: new Set(),
                            };
                        }
                        errorSummary[key].count++;
                        errorSummary[key].messages.add(report.message);
                    });

                    const formattedSummary = {};
                    Object.keys(errorSummary).forEach((key) => {
                        const entry = errorSummary[key];
                        if (!formattedSummary[entry.module]) {
                            formattedSummary[entry.module] = [];
                        }
                        formattedSummary[entry.module].push({
                            package: entry.package,
                            errorType: entry.errorType,
                            count: entry.count,
                            messages: Array.from(entry.messages),
                        });
                    });

                    console.info(
                        JSON.stringify(
                            {
                                severity: 'INFO',
                                component: 'Webpack',
                                message: 'Error Summary',
                                summary: formattedSummary,
                                timestamp: new Date().toISOString(),
                            },
                            null,
                            2
                        )
                    );
                }
            );
        }
    }
}

module.exports = ReportParseErrorPlugin;
