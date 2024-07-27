import { dbField } from "../decorators/db-field.decorator";
import CommonMongoEntity from "./common/common.mongo.entity";

export default class QLog extends CommonMongoEntity {

    @dbField('level')
    public level!: string;

    @dbField('message')
	public message!: string;

    @dbField('logger_name')
	public loggerName!: string;

    @dbField('class_name')
	public className!: string;

    @dbField('method_name')
	public methodName!: string;

    @dbField('line_number')
	public lineNumber!: number;

    @dbField('log_time')
	public logTime!: Date;

    @dbField('log_created_at')
	public logCreatedAt!: Date;
}