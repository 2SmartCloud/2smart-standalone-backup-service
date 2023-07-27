const ChistaESModule = require('chista');
const Debugger       = require('homie-sdk/lib/utils/debugger');

const debug = new Debugger('*');

debug.initEvents();

const Chista = ChistaESModule.default;

module.exports = new Chista({
    defaultLogger : (type, data) => {
        const { result } = data;

        if (result instanceof Error || type === 'error') debug.warning('Chista.defaultLogger', data);
    }
});
