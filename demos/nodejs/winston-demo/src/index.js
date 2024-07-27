import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import logger from './winston.logger.js';

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
        res.sendStatus(500);
    }
});

app.get(`/test/stream`, (req, res) => {
    res.writeHead(200, {
        'Content-Type': "text/event-stream",
        'Cache-Control': "no-cache",
        'Connection': "keep-alive"
    });
    let value = 0;
    setInterval(() => {
        const data = `data: ${JSON.stringify({count: value++})}\n\n`;
        logger.info(data);
        res.write(data);
    }, 1000);
});

const port = 4003;

app.listen(port, () => {
    console.log('Application is initialized. Server is running at [http://localhost:%s]', port);
});