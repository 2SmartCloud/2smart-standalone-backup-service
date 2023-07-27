const DockerCompose = require('./DockerCompose');

class System2smartManager {
    constructor({ rootDir2smartPath, debug }) {
        this.rootDir2smartPath = rootDir2smartPath;
        this.dockerCompose = new DockerCompose({ cwd: this.rootDir2smartPath });
        this.debug = debug;
    }
    async listServices() {
        // return (await this.dockerCompose.ps({ commandOptions: [ '--services' ] })).map(({ name }) => name);
        return this.dockerCompose.ps({ commandOptions: [ '--services' ] });
    }
    async exec(...args) {
        return this.dockerCompose.exec(...args);
    }
    async rm(...args) {
        return this.dockerCompose.rm({ commandOptions: [ '-v', '-s' ] }, ...args);
    }
    async up(...args) {
        return this.dockerCompose.up(...args);
    }
    async restart(...args) {
        return this.dockerCompose.restart(...args);
    }
}

module.exports = System2smartManager;
