const ModuleServiceBase = require('chista/ServiceBase').default;

class ServiceBase extends ModuleServiceBase {
    constructor({ debug, ...args }) {
        super(args);
        this.debug = debug;
    }
}

module.exports = ServiceBase;
