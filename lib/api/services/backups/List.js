const backupsManager = require('../../../backupsManager');

const ServiceBase = require('../ServiceBase');

class BackupsList extends ServiceBase {
    async execute() {
        const backups = await backupsManager.listBackups();

        return {
            status : 1,
            data   : backups.map(({ time, name }) => {
                return {
                    backupName : name,
                    birthTime  : time
                };
            })
        };
    }
}

module.exports = BackupsList;
