import QWinstonTransport from '@qlog/winston-transport';
import winston from 'winston';

const qWinstonTransport = await QWinstonTransport.init({ 
  bootstrapServers: 'localhost:9094', 
  appName: 'winston-demo',
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
		winston.format.label({ label: 'winston-demo' })
  ),
  transports: [
    qWinstonTransport
  ],
});

export default logger;