import QWinstonTransport from '@qlog/winston-transport';
import winston from 'winston';

const qwinstonTransport = await QWinstonTransport.init({ bootstrapServers: 'localhost:9094', appName: 'winston-demo' });

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      qwinstonTransport
    ],
});

export default logger;