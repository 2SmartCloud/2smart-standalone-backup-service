/* eslint-disable func-style */
const path = require('path');
const fs = require('fs-extra');
const mqtt = require('mqtt');
const BaseBackupService = require('./BaseBackupService');

const TOPICS_TO_EXCLUDE_FROM_BACKUP_REGEXP =
    /^(system-updates)\//;

class EMQXBackupService extends BaseBackupService {
    constructor({ mqttConnectionOptions, ...args }) {
        super(args);
        this.handleConnect = this.handleConnect.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.mqttConnectionOptions = mqttConnectionOptions;
        this.client = null;
        this.state = {};
        this.requiredServicesToRestore = [ '2smart-mysql', '2smart-emqx' ];
        this.systemFolders = [ 'emqx' ];
    }
    _createClient() {
        return mqtt.connect(this.mqttConnectionOptions.uri, {
            username           : this.mqttConnectionOptions.username,
            password           : this.mqttConnectionOptions.password,
            rejectUnauthorized : false,
            protocolVersion    : 5
        });
    }
    async init() {
        if (this.initialized) return;
        this.client = this._createClient();
        this.client.on('connect', this.handleConnect);
        this.client.on('disconnect', this.handleDisconnect);
        this.client.on('message', this.handleMessage);
        this.client.subscribe('#', { rap: true });
        super.init();
    }
    async destroy() {
        if (!this.initialized) return;
        this.client.end(true);
        this.client.off('connect', this.handleConnect);
        this.client.off('message', this.handleMessage);
        this.state = {};
        this.client = null;
        super.destroy();
    }
    async createBackup(dirname) {
        this.debug.info(`EMQXBackupService.${this.name}`, `createBackup ${dirname}`);
        await fs.writeJson(path.resolve(dirname, this.name), this.state);
    }
    async waitForServices() {
        await this.waitForServicePort('2smart-mysql', 3306);
        await this.waitForServicePort('2smart-emqx', 1883);
    }
    async restoreBackup(dirname) {
        this.debug.info(`EMQXBackupService.${this.name}`, `restoreBackup ${dirname}`);
        await this.waitForServices();
        const state = await fs.readJson(path.resolve(dirname, this.name));

        const client = this._createClient();

        client.subscribe('#');

        await new Promise((resolve, reject) => {
            const clear = () => {
                client.off('connect', handler);
                clearTimeout(timeout);
            };
            const handler = () => {
                clear();
                resolve();
            };

            // eslint-disable-next-line prefer-const
            let timeout = setTimeout(() => {
                clear();
                reject(new Error('Timeout'));
            }, 30000);

            client.once('connect', handler);
        });
        // eslint-disable-next-line guard-for-in
        await new Promise((resolve, reject) => {
            const clear = () => {
                clearTimeout(timeout);
                client.off('message', handler);
            };
            const handler = (topic) => {
                this.debug.info(`EMQXBackupService.${this.name}`, `receive ${topic}`);
                delete state[topic];
                if (Object.keys(state).length === 0) {
                    clear();
                    resolve();
                }
            };

            // eslint-disable-next-line prefer-const
            let timeout = setTimeout(() => {
                clear();
                reject(new Error('timeout'));
            }, 10 * Object.keys(state).length + 10000);

            client.on('message', handler);

            for (const [ topic, value ] of Object.entries(state)) {
                this.debug.info(`EMQXBackupService.${this.name}`, `publish ${topic}`);
                client.publish(topic, value, { retain: true });
            }
        });
        await new Promise(resolve => client.end(resolve));
    }

    // handlers
    async handleConnect() {
        this.debug.info(`EMQXBackupService.${this.name}`, 'MQTT is successfully connected');
    }
    async handleDisconnect() {
        this.debug.info(`EMQXBackupService.${this.name}`, 'MQTT is disconnected');
    }
    async handleMessage(topic, message, packet) {
        const isTopicToExclude = TOPICS_TO_EXCLUDE_FROM_BACKUP_REGEXP.test(topic);

        if (isTopicToExclude || !packet.retain) return; // ignore topics to exclude and non-retained messages

        const value = message.toString(); // parse message buffer to string

        if (value) this.state[topic] = value;
        else delete this.state[topic];
    }
}

module.exports = EMQXBackupService;
