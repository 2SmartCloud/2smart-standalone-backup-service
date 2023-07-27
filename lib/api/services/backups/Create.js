const X = require('chista/Exception').default;
const backupsManager = require('../../../backupsManager');

const ServiceBase = require('../ServiceBase');

class BackupsCreate extends ServiceBase {
    static validationRules = {
        data : [ 'required', { 'nested_object' : {
            backupBaseName : [ 'required', { like: '^[a-zA-Z0-9]+$' }, { 'max_length': 25 } ]
        } } ]
    };

    async execute({ data: { backupBaseName } }) {
        try {
            await backupsManager.createBackup(backupBaseName);
        } catch (err) {
            this.debug.warning('BackupsCreate', err);

            if (!(err instanceof X)) {
                throw new X({
                    code   : 'CREATE_ERROR',
                    fields : {}
                });
            }

            throw err;
        }

        return {
            status : 1
        };
    }
}

module.exports = BackupsCreate;

