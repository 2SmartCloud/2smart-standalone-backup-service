const Debugger      = require('homie-sdk/lib/utils/debugger');
const { rootDir2smartPath }  = require('./config');
const System2smartManager = require('./core/System2smartManager');

const debug = new Debugger(process.env.DEBUG || '*');

debug.initEvents();

const system2smartManager = new System2smartManager({ rootDir2smartPath, debug });

module.exports = system2smartManager;
