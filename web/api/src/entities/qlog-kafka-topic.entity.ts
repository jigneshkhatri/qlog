import { dbField } from "../decorators/db-field.decorator";
import CommonMongoEntity from "./common/common.mongo.entity";

export default class QLogKafkaTopic extends CommonMongoEntity {
    @dbField('topic_name')
	public topicName!: string;
}