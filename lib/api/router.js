const express     = require('express');
const controllers = require('./controllers');

const router = express.Router();

router.get('/backups/list', controllers.backups.list);
router.post('/backups/restore', controllers.backups.restore);
router.post('/backups/create', controllers.backups.create);

module.exports = router;
