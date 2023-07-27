const { promisify } = require('bluebird');
const Debugger      = require('homie-sdk/lib/utils/debugger');
const { appPort } = require('./lib/config');
const backupsManager = require('./lib/backupsManager');
const app = require('./lib/api/app');
const { everyHourJob, everyMidnightJob } = require('./lib/jobs');

const debug = new Debugger(process.env.DEBUG || '*');

debug.initEvents();

let server = null;

init().catch(async error => {
    debug.error(error);
    await shutdown();
});

async function init() {
    await backupsManager.init();
    everyHourJob.start();
    everyMidnightJob.start();
    debug.info('App', `Server STARTING AT PORT ${appPort}`);
    server = app.listen(appPort, () => {
        debug.info('App', `Server STARTING AT PORT ${appPort}`);
    });
    server.closeAsync = promisify(server.close);
}

async function shutdown() {
    if (server) {
        debug.info('App', 'Closing server');
        await server.closeAsync();
    }

    debug.info('Exit');
    process.exit(0);
}

// Subscribe to system signals
process.on('SIGTERM', async () => {
    debug.info('App', 'SIGTERM signal catched');

    await shutdown();
});

process.on('SIGINT', async () => {
    debug.info('App', 'SIGINT signal catched');

    await shutdown();
});
