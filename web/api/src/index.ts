import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { getEnvironment, getEnvValue } from './configs/env.config';
import { EnvKeys } from './constants/env-keys.constant';
import MongoConfig from './configs/mongo.config';
import KafkaConfig from './configs/kafka.config';
import { newTopicSubscriptionScheduler } from './schedulers/kafka-consumer.scheduler';
import KafkaConsumer from './kafka-consumers/kafka-consumer';
import QLogController from './controllers/qlog.controller';
import allQLogAppsRouter from './routes/all-qlog-apps.route';
import qLogRouter from './routes/qlog.route';

// initialize express app
const app: Express = express();

// app port
const port = getEnvValue(EnvKeys.port) || 4000;

app.use(
	cors({
		origin: '*',
	})
);

// middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.get(`/qlog/:kafkaTopicName`, (req: Request, res: Response) => {
// 	const kafkaTopicName = req.params.kafkaTopicName
//     res.writeHead(200, {
//         'Content-Type': "text/event-stream",
//         'Cache-Control': "no-cache",
//         'Connection': "keep-alive"
//     });
// 	KafkaConsumer.getInstance().streamMessage(kafkaTopicName, res);
// });

app.use('/qlog-apps', allQLogAppsRouter);
app.use('/qlog', qLogRouter);

console.log('Active environment [%s]', getEnvironment());
const connectors = [MongoConfig.connect(getEnvValue(EnvKeys.mongoConStr) as string), KafkaConfig.connectConsumer()];
Promise.all(connectors).then(() => {
    app.listen(port, () => {
        console.log('Application is initialized. Server is running at [http://localhost:%s]', port);
    });
    startSchedulers(newTopicSubscriptionScheduler);
});

const startSchedulers = (...schedulers: (() => void)[]): void => {
	schedulers.forEach((scheduler) => {
		scheduler();
	});
};