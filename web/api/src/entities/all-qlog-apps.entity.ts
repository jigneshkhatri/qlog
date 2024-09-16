import { jsonField } from "../decorators/json-data.decorator";
import { dbField } from "../decorators/db-field.decorator";
import CommonMongoEntity from "./common/common.mongo.entity";

export default class AllQLogApps extends CommonMongoEntity {
    @jsonField()
    @dbField('kafka_topic_name')
	public kafkaTopicName!: string;
    
    @jsonField()
    @dbField('app_name')
	public appName!: string;
}