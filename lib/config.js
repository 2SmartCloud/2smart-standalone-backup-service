const path = require('path');
const confme = require('confme');

const config = confme(path.join(__dirname, '../etc/config.json'));

module.exports = config;
