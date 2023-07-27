/* eslint-disable quotes */
const childProcess  = require('child_process');
const path = require('path');
const { promisify } = require('bluebird');

const exec      = promisify(childProcess.exec);

const BaseBackupService = require('./BaseBackupService');

class InfluxDBBackupService extends BaseBackupService {
    constructor(...args) {
        super(...args);
        this.requiredServicesToRestore = [ 'influxdb' ];
        this.systemFolders = [ 'influxdb' ];
    }
    async createBackup(dirname) {
        this.debug.info(`InfluxDBBackupService.${this.name}`, `createBackup ${dirname}`);
        await exec(
            `docker exec -i influxdb sh -c 'influxd backup -portable -database "$INFLUXDB_DB" /backup'` +
            ` && docker cp influxdb:/backup "${path.resolve(dirname, this.name)}"`
        );
    }
    async waitForServices() {
        await this.waitForServicePort('influxdb', 8088);
        await this.waitForServicePort('influxdb', 8086);
    }
    async restoreBackup(dirname) {
        this.debug.info(`InfluxDBBackupService.${this.name}`, `restoreBackup ${dirname}`);
        await exec(
            `docker exec -i influxdb sh -c 'influx -execute "DROP DATABASE \\"$INFLUXDB_DB\\""'` +
            ` && docker cp "${path.resolve(dirname, this.name)}" "influxdb:/backup"` +
            ` && docker exec -i influxdb sh -c 'influxd restore -portable -database "$INFLUXDB_DB" /backup'`
        );
    }
}

module.exports = InfluxDBBackupService;
