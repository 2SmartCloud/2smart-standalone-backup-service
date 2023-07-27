const childProcess  = require('child_process');
const path = require('path');
const { promisify } = require('bluebird');

const exec      = promisify(childProcess.exec);

const BaseBackupService = require('./BaseBackupService');

class MySQLBackupService extends BaseBackupService {
    constructor(...args) {
        super(...args);
        this.requiredServicesToRestore = [ '2smart-mysql' ];
        this.systemFolders = [ 'mysql' ];
    }
    async createBackup(dirname) {
        this.debug.info(`MySQLBackupService.${this.name}`, `createBackup ${dirname}`);
        await exec(`docker exec 2smart-mysql sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysqldump -u"$MYSQL_USER" "$MYSQL_DATABASE"' > "${path.resolve(dirname, this.name)}"`);
    }
    async waitForServices() {
        await this.waitForServicePort('2smart-mysql', 3306);
    }
    async restoreBackup(dirname) {
        this.debug.info(`MySQLBackupService.${this.name}`, `restoreBackup ${dirname}`);
        await this.waitForServices();
        await exec(`docker exec -i 2smart-mysql sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"' < "${path.resolve(dirname, this.name)}"`);
    }
}

module.exports = MySQLBackupService;
