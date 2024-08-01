import QWinstonTransportStream from '@qlog/winston-transport-stream';
import winston from 'winston';

await QWinstonTransportStream.init({ 
  bootstrapServers: 'localhost:9094', 
  appName: 'winston-demo' 
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Stream({
        stream: QWinstonTransportStream.stream()
      })
    ],
});

export default logger;