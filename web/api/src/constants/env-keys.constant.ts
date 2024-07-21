/**
 * Define each key of environment variable (.env.*) in this class,
 * and use it wherever need to access environment variable
 */
export class EnvKeys {
	public static readonly appName = 'APP_NAME';
	public static readonly port = 'PORT';
	public static readonly mongoConStr = 'MONGO_CON_STR';
	public static readonly mongoDbName = 'MONGO_DB';
	public static readonly kafkaClientId = 'KAFKA_CLIENT_ID';
	public static readonly kafkaBrokers = 'KAFKA_BROKERS';
}
