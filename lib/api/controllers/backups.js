const chista = require('../chista');

const BackupsList    = require('../services/backups/List');
const BackupsRestore = require('../services/backups/Restore');
const BackupsCreate  = require('../services/backups/Create');

module.exports = {
    list    : chista.makeServiceRunner(BackupsList, req => req.query),
    restore : chista.makeServiceRunner(BackupsRestore, req => req.body),
    create  : chista.makeServiceRunner(BackupsCreate, req => req.body)
};
