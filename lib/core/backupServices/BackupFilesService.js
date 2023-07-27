const path = require('path');
const childProcess  = require('child_process');
const fs = require('fs-extra');
/* eslint-disable quotes */
const { promisify } = require('bluebird');

const exec      = promisify(childProcess.exec);
const BaseBackupService = require('./BaseBackupService');


class BackupFilesService extends BaseBackupService {
    constructor({ name, debug, pathToBackup }) {
        super({ name, debug });
        this.pathToBackup = pathToBackup;
        this.systemFolders = [ pathToBackup ];
    }
    async createBackup(dirname) {
        this.debug.info(`BackupFilesService.${this.name}`, `createBackup ${dirname}`);
        if (await fs.exists(this.pathToBackup)) {
            // await fs.copy(this.pathToBackup, path.resolve(dirname, this.name));
            await exec(`cp -r "${this.pathToBackup}" "${path.resolve(dirname, this.name)}"`);
        }
    }
    async restoreBackup(dirname) {
        this.debug.info(`BackupFilesService.${this.name}`, `restoreBackup ${dirname}`);
        await fs.remove(this.pathToBackup);
        if (await fs.exists(path.resolve(dirname, this.name))) {
            // await fs.copy(path.resolve(dirname, this.name), this.pathToBackup);
            await exec(`cp -r "${path.resolve(dirname, this.name)}" "${this.pathToBackup}"`);
        }
    }
}

module.exports = BackupFilesService;
