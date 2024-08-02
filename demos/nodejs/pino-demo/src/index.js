import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import logger from './pino.logger.js';

const app = express();

app.use(
	cors({
		origin: '*',
	})
);

// middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get(`/test/exception`, (req, res) => {
    try {
        throw Error('There is an error');
    } catch(e) {
        logger.error(e);
        logger.error(e, 'Error occurred');
        logger.error('Error occurred');
        res.sendStatus(500);
    }
});

app.get(`/test/all/:id`, (req, res) => {
    logger.trace('A simple trace message');
    logger.trace('A simple trace message with argument [id=%d]', req.params.id);
    logger.trace({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple trace message');
    logger.trace({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple trace message with arguments [id=%d] and [customParam=%s]', req.params.id, 'This is a custom parameter');

    logger.debug('A simple debug message');
    logger.debug('A simple debug message with argument [id=%d]', req.params.id);
    logger.debug({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple debug message');
    logger.debug({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple debug message with arguments [id=%d] and [customParam=%s]', req.params.id, 'This is a custom parameter');

    logger.info('A simple info message');
    logger.info('A simple info message with argument [id=%d]', req.params.id);
    logger.info({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple info message');
    logger.info({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple info message with arguments [id=%d] and [customParam=%s]', req.params.id, 'This is a custom parameter');

    logger.warn('A simple warning message');
    logger.warn('A simple warning message with argument [id=%d]', req.params.id);
    logger.warn({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple warning message');
    logger.warn({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple warning message with arguments [id=%d] and [customParam=%s]', req.params.id, 'This is a custom parameter');

    logger.error('A simple error message');
    logger.error('A simple error message with argument [id=%d]', req.params.id);
    logger.error({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple error message');
    logger.error({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple error message with arguments [id=%d] and [customParam=%s]', req.params.id, 'This is a custom parameter');

    logger.fatal('A simple fatal message');
    logger.fatal('A simple fatal message with argument [id=%d]', req.params.id);
    logger.fatal({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple fatal message');
    logger.fatal({
        id: req.params.id,
        customParam: 'This is a custom parameter'
    }, 'A simple fatal message with arguments [id=%d] and [customParam=%s]', req.params.id, 'This is a custom parameter');

    res.sendStatus(200);
});

app.get(`/test/stream/:id`, (req, res) => {
    res.writeHead(200, {
        'Content-Type': "text/event-stream",
        'Cache-Control': "no-cache",
        'Connection': "keep-alive"
    });
    let value = 0;
    setInterval(() => {
        for (let i=0 ; i<100 ; i++) {
            const data = `data: ${JSON.stringify({id: req.params.id, count: value++})}\n\n`;
            logger.info(data);
            res.write(data);
        }
    }, 100);
});

const port = 4004;

app.listen(port, () => {
    console.log('Application is initialized. Server is running at [http://localhost:%s]', port);
});