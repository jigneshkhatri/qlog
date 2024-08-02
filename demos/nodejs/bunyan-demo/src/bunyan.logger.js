import QBunyanTransportStream from '@qlog/bunyan-transport-stream';
import bunyan from 'bunyan';

await QBunyanTransportStream.init({
  bootstrapServers: 'localhost:9094',
  appName: 'bunyan-demo'
});

const logger = bunyan.createLogger({
  name: 'bunyan-demo',
  streams: [{
    type: 'stream',
    stream: QBunyanTransportStream.stream(),
    level: 'trace'
  }],
});

export default logger;