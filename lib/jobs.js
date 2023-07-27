const { CronJob } = require('cron');
const moment = require('moment');
const Debugger      = require('homie-sdk/lib/utils/debugger');
const backupsManager = require('./backupsManager');

const EVERY_HOUR_CRON_TIME     = '0 1-23 * * *'; // run job every hour excluding 00:00
const EVERY_MIDNIGHT_CRON_TIME = '0 0 * * *';    // run job at midnight (00:00)

const debug = new Debugger(process.env.DEBUG || '*');

debug.initEvents();

const everyHourJob = new CronJob(EVERY_HOUR_CRON_TIME, async () => {
    try {
        await backupsManager.createBackup(`dump_${moment().format('YYYY-MM-DD_HH:mm')}`);
    } catch (err) {
        debug.error(`Error with making backups for current hour: ${err}`);
        debug.error(err);
    }
});

const everyMidnightJob = new CronJob(EVERY_MIDNIGHT_CRON_TIME, async () => {
    try {
        await backupsManager.createBackup(`dump_${moment().format('YYYY-MM-DD_HH:mm')}`);
    } catch (err) {
        debug.error(`Error with making backups for current day: ${err}`);
        debug.error(err);
    }

    try {
        await backupsManager.deleteOldBackups();
    } catch (err) {
        debug.error(`Old backups removing error: ${err.message}`);
        debug.error(err);
    }
});

module.exports = {
    everyHourJob,
    everyMidnightJob
};

// everyHourJob.start();
// everyMidnightJob.start();
