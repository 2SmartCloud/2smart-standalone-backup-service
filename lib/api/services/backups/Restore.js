const X = require('chista/Exception').default;
const backupsManager = require('../../../backupsManager');
const ServiceBase = require('../ServiceBase');

class BackupsRestore extends ServiceBase {
    static validationRules = {
        data : [ 'required', { 'nested_object' : {
            backupName : [ 'required', 'string' ]
        } } ]
    };

    async execute({ data: { backupName } }) {
        // if (!backupExists) {
        //     this.debug.warning('BackupsRestore.execute', `Backup with filename ${backupFilename} doesn't exist`);

        //     throw new X({
        //         code   : 'NOT_FOUND',
        //         fields : {
        //             backupName : 'NOT_FOUND'
        //         }
        //     });
        // }

        try {
            // Change work dir and execute restore script
            await backupsManager.restoreBackup(backupName);
        } catch (err) {
            this.debug.warning('BackupsRestore', err);

            throw new X({
                code   : 'RESTORE_ERROR',
                fields : {
                    backupName : 'RESTORE_ERROR'
                }
            });
        }

        return {
            status : 1
        };
    }
}

module.exports = BackupsRestore;
