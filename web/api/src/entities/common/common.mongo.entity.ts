import { dbField } from "../../decorators/db-field.decorator";
import { jsonField } from "../../decorators/json-data.decorator";
import UUID from "../../types/uuid.type";

/**
 * Common parent class which should be extended by all the MongoDB entity classes
 */
export default class CommonMongoEntity {
	// eslint-disable-next-line @typescript-eslint/naming-convention

	@jsonField()
	@dbField('_id')
	public id!: UUID;

	@jsonField()
	@dbField('created_on')
	public createdOn!: Date;

	@jsonField()
	@dbField('updated_on')
	public updatedOn!: Date;
}
