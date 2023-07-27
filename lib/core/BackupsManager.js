/* eslint-disable no-sync */
const events = require('events');
const path = require('path');
const childProcess  = require('child_process');
const fs = require('fs-extra');
const Promise = require('bluebird');
const _ = require('underscore');
const { getSizeOfDirectoryFiles } = require('./utils');

const { promisify } = Promise;

const exec      = promisify(childProcess.exec);

class BackupsManager extends events {
    constructor({
        backupsDirPath, backupServiceName,
        tempBackupsDirPath, backupServises, system2smartManager, backupsMemoryLimit, restoreTriesAmount,
        debug
    }) {
        super();
        this.backupsDirPath = backupsDirPath;
        this.backupServiceName = backupServiceName;
        this.tempBackupsDirPath = tempBackupsDirPath;
        this.backupServises = backupServises;
        this.system2smartManager = system2smartManager;
        this.backupsMemoryLimit = backupsMemoryLimit;
        this.restoreTriesAmount = restoreTriesAmount;
        this.restoring = false;
        this.backupsInProgress = {};
        this.debug = debug;
    }
    async init() {
        for (const backupServise of this.backupServises) {
            await backupServise.init();
        }
    }
    async freeMemory(amount) {
        const backups = _.sortBy(await this.listBackups(), 'time');

        let backup;

        // eslint-disable-next-line no-cond-assign
        while (amount > 0 && (backup = backups.pop())) {
            // eslint-disable-next-line no-param-reassign
            amount -= backup.size;
            this.removeBackup(backup.name);
        }
    }
    async deleteOldBackups() {
        await exec(`find ${this.backupsDirPath} -mtime +7 -type f -delete`);
    }
    async listBackups() {
        const backupFilenames = await fs.readdir(this.backupsDirPath);

        const backupObjects = [];

        for (const filename of backupFilenames) {
            const { size, mtime } = await fs.stat(path.resolve(this.backupsDirPath, filename));
            const filenameWithoutExtension = path.basename(filename, '.tar.gz');

            backupObjects.push({
                size,
                name : filenameWithoutExtension,
                time : new Date(mtime).getTime()
            });
        }

        return backupObjects;
    }
    async removeBackup(name) {
        await fs.remove(`${path.resolve(this.backupsDirPath, `${name}.tar.gz`)}`);
    }
    async existsBackup(name) {
        return fs.exists(`${path.resolve(this.backupsDirPath, `${name}.tar.gz`)}`);
    }
    async createBackup(name) {
        if (this.restoring) throw new Error('Cannot make backups while restoring');
        // if (await this.existsBackup(name)) throw new Error('Backup exists');
        if (this.backupsInProgress[name]) throw new Error('Backup is already in progress');

        const tempBackupDir = path.resolve(this.tempBackupsDirPath, name);

        try {
            this.backupsInProgress[name] = true;
            this.emit('backup.start', name);
            this.emit(`backup.start.${name}`);
            await fs.ensureDir(tempBackupDir);

            for (const backupServise of this.backupServises) {
                await backupServise.createBackup(tempBackupDir);
            }
            // await Promise.all(this.backupServises.map(backupServise => backupServise.createBackup(tempBackupDir)));
            await exec(`tar -zcvf ${tempBackupDir}.tar.gz -C ${tempBackupDir} --remove-files .`);

            const { size: backupSize } = await fs.stat(`${tempBackupDir}.tar.gz`);
            const backupDirSize = await getSizeOfDirectoryFiles(this.backupsDirPath);

            if (backupSize > this.backupsMemoryLimit) {
                this.debug.warning('BackupsManager.createBackup', 'Cannot free memory for current backup, it takes more memory than limit. Please, increase memory limit');
                throw new Error('Cannot free memory for current backup, it takes more memory than limit. Please, increase memory limit');
            } else if (backupSize + backupDirSize > this.backupsMemoryLimit) {
                await this.freeMemory(backupSize + backupDirSize - this.backupsMemoryLimit);
            }
            await fs.move(`${tempBackupDir}.tar.gz`, `${path.resolve(this.backupsDirPath, `${name}.tar.gz`)}`, { overwrite: true });
            delete this.backupsInProgress[name];
            this.emit('backup.end', name);
            this.emit(`backup.end.${name}`);
            // eslint-disable-next-line max-len
            // await exec(`tar -zcvf ${path.resolve(this.backupsDirPath, `${name}.tar.gz`)} ${tempBackupDir} --remove-files`);
        } catch (e) {
            await fs.remove(tempBackupDir);
            delete this.backupsInProgress[name];
            this.emit('backup.error', name, e);
            this.emit(`backup.error.${name}`);
            throw e;
        }
    }
    async restoreBackup(name) {
        if (this.restoring) throw new Error('Cannot start another restore process while restoring');
        try {
            if (!(await this.existsBackup(name))) throw new Error('Backup does not exists');
            this.restoring = true;
            if (Object.keys(this.backupsInProgress)) {
                this.debug.info('BackupsManager.restoreBackup', 'awating backups in progress');
                await Promise.all(Object.keys(this.backupsInProgress).map(backupNameInProgress => {
                    return new Promise(resolve => {
                        this.once(`backup.end.${backupNameInProgress}`, resolve);
                        this.once(`backup.error.${backupNameInProgress}`, resolve);
                    });
                }));
            }
            this.debug.info('BackupsManager.restoreBackup', 'start');

            const tempBackupDir = path.resolve(this.tempBackupsDirPath, name);

            await fs.ensureDir(tempBackupDir);

            await exec(`tar -zxvf ${path.resolve(this.backupsDirPath, `${name}.tar.gz`)} -C ${tempBackupDir}`);

            for (const backupServise of this.backupServises) {
                await backupServise.destroy();
            }
            const listOfServices = await this.system2smartManager.listServices();
            const listOfOtherServices = listOfServices.filter(service => service !== this.backupServiceName);

            this.debug.info('BackupsManager.restoreBackup', `stop services ${listOfOtherServices.join(', ')}`);
            await this.system2smartManager.rm(...listOfOtherServices);

            // const systemFoldersToDelete = _.uniq(_.flatten(this.backupServises.map(({ systemFolders }) => {
            //     return systemFolders;
            // })));

            // await Promise.all(systemFoldersToDelete.map(systemFolder => {
            //     return fs.remove(path.resolve(this.system2smartManager.rootDir2smartPath, 'system', systemFolder));
            // }));

            for (const backupServise of this.backupServises) {
                const requiredServicesToRestore = backupServise.requiredServicesToRestore;
                const systemFolders = backupServise.systemFolders;

                await Promise.all(systemFolders.map(systemFolder => {
                    return fs.remove(path.resolve(this.system2smartManager.rootDir2smartPath, 'system', systemFolder));
                }));

                if (requiredServicesToRestore.length) {
                    this.debug.info('BackupsManager.restoreBackup', `run services ${requiredServicesToRestore.join(', ')}`);
                    await this.system2smartManager.up(backupServise.requiredServicesToRestore);
                    // await Promise.delay(10000);
                }
                // eslint-disable-next-line more/no-c-like-loops
                for (let i = 0; ; i++) {
                    try {
                        this.debug.info('BackupsManager.restoreBackup', `${backupServise.name} restore... ${i > 0 ? `attempt ${i + 1}` : ''}`);
                        await backupServise.restoreBackup(tempBackupDir);
                        this.debug.info('BackupsManager.restoreBackup', 'restore succeed');
                        break;
                    } catch (e) {
                        if (i === this.restoreTriesAmount) throw e;
                        await Promise.delay(5000);
                        this.debug.error(e);
                    }
                }
                if (requiredServicesToRestore.length) {
                    this.debug.info('BackupsManager.restoreBackup', `stop services ${requiredServicesToRestore.join(', ')}`);
                    await this.system2smartManager.rm(...backupServise.requiredServicesToRestore);
                }
            }
            // await Promise.all(this.backupServises.map(backupServise => backupServise.restoreBackup(tempBackupDir)));
            await fs.remove(tempBackupDir);

            this.debug.info('BackupsManager.restoreBackup', `run services ${listOfOtherServices.join(', ')}`);
            await this.system2smartManager.up(listOfOtherServices, { commandOptions: [ '--force-recreate', '--remove-orphans' ] });
            for (const backupServise of this.backupServises) {
                await backupServise.init();
            }
            this.restoring = false;
            // process.exit(0);// self restart
        } catch (e) {
            for (const backupServise of this.backupServises) {
                await backupServise.init();
            }
            this.restoring = false;
            // process.exit(1);// self restart
            throw e;
        }
    }
}

module.exports = BackupsManager;
