import QPinoTransport from '@qlog/pino-transport';
import pino from 'pino';

const qPinoTransport = await QPinoTransport.init({
  bootstrapServers: 'localhost:9094',
  appName: 'pino-demo'
});

const logger = pino(qPinoTransport);

export default logger;