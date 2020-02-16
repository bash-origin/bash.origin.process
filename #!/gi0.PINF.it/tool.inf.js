
exports['gi0.pinf.it/core/v0/tool'] = async function (workspace, LIB) {

    return async function (instance) {

        if (/\/runner\/v0$/.test(instance.kindId)) {

            const PROCESS = require("../../lib/process");

            return async function (invocation) {

                if (invocation.method === 'run') {

                    const name = '';
                    const config = invocation.config.config;

                    // TODO: Wait until all processes are up and then continue instead of continuing right away.
                    PROCESS.run(name, config);
                
                    return true;
                }
            };            
        }
    };
}
