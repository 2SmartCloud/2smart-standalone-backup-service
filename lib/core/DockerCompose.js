/* eslint-disable no-param-reassign */
const compose = require('docker-compose');
const _ = require('underscore');

class DockerCompose {
    constructor(defaultOptions) {
        this.defaultOptions = defaultOptions;
    }
    async ps(options = {}) {
        return DockerCompose.ps({ ...this.defaultOptions, ...options });
    }
    async exec(container, command, options = {}) {
        return DockerCompose.exec(container, command, { ...this.defaultOptions, ...options });
    }
    async rm(...services) {
        const options = (services.length && typeof services[0] === 'object') ? services.shift() : {};

        return DockerCompose.rm({ ...this.defaultOptions, ...options }, ...services);
    }
    async up(...services) {
        const options = (services.length && typeof services[services.length - 1] === 'object' && !Array.isArray(services[services.length - 1])) ? services.pop() : {};

        return DockerCompose.up(...services, { ...this.defaultOptions, ...options });
    }
    async restart(...services) {
        const options = (services.length && typeof services[services.length - 1] === 'object' && !Array.isArray(services[services.length - 1])) ? services.pop() : {};

        return DockerCompose.restart(...services, { ...this.defaultOptions, ...options });
    }
    static async ps(...args) {
        const { out: data } = await compose.ps(...args);
        const listData = data.split('\n');
        const containers = listData.filter(service => service !== '');

        return containers;
    }
    static async rm(...args) {
        return compose.rm(...args);
    }
    static async exec(...args) {
        return compose.exec(...args);
    }
    static async up(...args) {
        const options = (args.length && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1])) ? args.pop() : {};

        args = _.flatten(args);
        if (args.length === 0) return compose.upAll(options);
        else if (args.length === 1) return compose.upOne(args[0], options);

        return compose.upMany(args, options);
    }
    static async restart(...args) {
        const options = (args.length && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1])) ? args.pop() : {};

        args = _.flatten(args);
        if (args.length === 0) return compose.restartAll(options);
        else if (args.length === 1) return compose.restartOne(args[0], options);

        return compose.restartMany(args, options);
    }
}

module.exports = DockerCompose;
