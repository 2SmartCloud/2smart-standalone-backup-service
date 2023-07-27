const express = require('express');
const middlewares = require('./middlewares');
const router = require('./router');

const app = express();

app.use(middlewares.urlencoded);
app.use(middlewares.json);
app.use(middlewares.cors);
app.use('/', router);

module.exports = app;
