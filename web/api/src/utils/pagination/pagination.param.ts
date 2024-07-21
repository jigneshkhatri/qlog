/**
 * This class contains all the parameters required for the server-side pagination operations
 * for any of the API that fetches the data.
 */
export default class PaginationParams {
	/**
	 * The page number from all the pages for which data is being requested.
	 * Value for this field can be passed as an query parameter of the API.
	 */
	public pageNo!: number;

	/**
	 * The total number of records that should be returned in single page
	 * Value for this field can be passed as an query parameter of the API.
	 */
	public pageSize!: number;

	/**
	 * The name of the field(s) (comma separated if multiple) that are available in the response
	 * and using which ordering of the data should happen. The direction of the ordering can
	 * be mentioned as well.
	 * - Example 1: id desc,name asc,createdOn desc
	 * - Example 2: createdOn desc
	 * - Example 3: createdOn
	 *
	 * Value for this field can be passed as an query parameter of the API.
	 */
	public orderBy!: string | undefined;

	/**
	 * Add the fields/columns that need to be compulsarily appended in the query
	 * regardless of them being passed to the API by the user.
	 * These fields/columns will be appended in order by clause before the user-defined (orderBy)
	 * fields/columns.
	 * - Example 1: id desc,name desc
	 * - Example 2: createdOn desc
	 * - Example 3: createdOn
	 */
	public customOrderByBefore!: string | undefined;

	/**
	 * Add the fields/columns that need to be compulsarily appended in the query
	 * regardless of them being passed to the API by the user.
	 * These fields/columns will be appended in order by clause after the user-defined (orderBy)
	 * fields/columns.
	 * - Example 1: id desc,name desc
	 * - Example 2: createdOn desc
	 * - Example 3: createdOn
	 */
	public customOrderByAfter!: string | undefined;

	/**
	 * This field will contain total number of records (regardless of pagination) that
	 * particular search query can return. The value for this field will automatically
	 * set by the query execution and will be returned in the API response.
	 */
	public totalRecords!: number | undefined;
}
