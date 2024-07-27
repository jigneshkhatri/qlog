import QWinstonTransport from '@qlog/winston-transport';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      await QWinstonTransport.init({ bootstrapServers: 'localhost:9094', appName: 'winston-demo' }),
    ],
});

export default logger;