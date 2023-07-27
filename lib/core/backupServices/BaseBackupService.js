
const waitPort = require('wait-port');

class BackupBaseService {
    constructor({ name, debug }) {
        this.name = name;
        this.debug = debug;
        this.requiredServicesToRestore = [];
        this.systemFolders = [];
        this.initialized = false;
    }
    createBackup() {}
    restoreBackup() {}
    init() {
        this.initialized = true;
    }
    destroy() {
        this.initialized = false;
    }
    async waitForServicePort(host, port) {
        this.debug.info(`${this.constructor.name}.waitForServicePort`, `waiting for port ${host}:${port}`);
        const params = {
            output  : 'silent',
            timeout : 60000,
            host,
            port
        };
        const available = await waitPort(params);

        if (!available) throw new Error(`Cannot access ${params.host}:${params.port}`);
    }
}

module.exports = BackupBaseService;
