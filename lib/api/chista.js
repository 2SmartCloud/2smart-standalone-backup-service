const ChistaESModule = require('chista');
const { makeServiceRunner } = require('./serviceRunner');

const Chista = ChistaESModule.default;

const chista = new Chista({
    defaultLogger : () => {}
});

chista.makeServiceRunner = makeServiceRunner;

module.exports = chista;
