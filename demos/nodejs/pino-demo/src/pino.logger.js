import QPinoTransportStream from '@qlog/pino-transport';
import pino from 'pino';

await QPinoTransportStream.init({
  bootstrapServers: 'localhost:9094',
  appName: 'pino-demo'
});

pino
const logger = pino({
  name: 'pino-demo',
  level: 'trace',
}, QPinoTransportStream.stream());

export default logger;