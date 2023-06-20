const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const config = require('./config');
const mongo = require('./services/mongo');

const indexRouter = require('./routes/index');
const quotesRouter = require('./routes/quotes');
const renamerRouter = require('./routes/renamer')
const notificationsRouter = require('./routes/notifications')
const synchronizerRouter = require('./routes/synchronizer')
const sprintsRouter = require('./routes/sprints')

let app = express();

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

router.use((req, _res, next) => {
    if (config.debug) mongo.insertLogs(req.payload);
    next()
})

app.use('/', indexRouter);
app.use('/quotes', quotesRouter);
app.use('/rename', renamerRouter);
app.use('/notifications', notificationsRouter);
app.use('/sync', synchronizerRouter);
app.use('/sprints', sprintsRouter)

module.exports = app;
