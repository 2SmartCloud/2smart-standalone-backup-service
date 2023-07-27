/* eslint-disable no-sync */
const path = require('path');
const fs = require('fs-extra');
const Debugger      = require('homie-sdk/lib/utils/debugger');
const { backupsMemoryLimit, tempBackupsDirPath, backupsDirPath, backupServiceName, rootDir2smartPath, mqttConnectionOptions, restoreTriesAmount }  = require('./config');
const system2smartManager = require('./system2smartManager');
const { parseMemorySizeAndConvertToBytes } = require('./core/utils');

const debug = new Debugger(process.env.DEBUG || '*');

debug.initEvents();

const BackupsManager = require('./core/BackupsManager');

const BackupFilesService = require('./core/backupServices/BackupFilesService');
const EMQXBackupService = require('./core/backupServices/EMQXBackupService');
const InfluxDBBackupService = require('./core/backupServices/InfluxDBBackupService');
const MySQLBackupService = require('./core/backupServices/MySQLBackupService');

const EXCLUDE_2SMART_SYSTEM_FOLDERS = [ 'emqx', 'mysql', 'influxdb', 'filebeat', 'changelogs', 'dumps' ];

fs.ensureDirSync(tempBackupsDirPath);
fs.ensureDirSync(backupsDirPath);

const backupsManager = new BackupsManager({
    backupsMemoryLimit : parseMemorySizeAndConvertToBytes(backupsMemoryLimit),
    tempBackupsDirPath,
    backupsDirPath,
    backupServiceName,
    system2smartManager,
    restoreTriesAmount : parseInt(restoreTriesAmount, 10),
    debug,
    backupServises     : [
        // eslint-disable-next-line no-sync
        ...fs.readdirSync(path.resolve(rootDir2smartPath, 'system')).filter(name => !EXCLUDE_2SMART_SYSTEM_FOLDERS.includes(name)).map(name => {
            return new BackupFilesService({
                name,
                pathToBackup : path.resolve(rootDir2smartPath, 'system', name),
                debug
            });
        }),
        new InfluxDBBackupService({
            name : 'influx',
            debug
        }),
        new MySQLBackupService({
            name : 'mysql.sql',
            debug
        }),
        new EMQXBackupService({
            name : 'emqx.json',
            mqttConnectionOptions,
            debug
        })
    ]
});

module.exports = backupsManager;
