import QBunyanStream from '@qlog/bunyan-stream';
import bunyan from 'bunyan';

await QBunyanStream.init({
  bootstrapServers: 'localhost:9094',
  appName: 'bunyan-demo'
});

const logger = bunyan.createLogger({
  name: 'bunyanDemo',
  streams: [{
    type: 'stream',
    stream: QBunyanStream.stream(),
    level: 'debug'
  }],
});

export default logger;