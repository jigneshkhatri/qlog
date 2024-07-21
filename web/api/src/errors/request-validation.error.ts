export type ErroredParam = {
	field: string;
	message: string;
};

/**
 * This error should be thrown whenever there is any error while validating request body of any API
 */
export default class RequestValidationError extends Error {
	private _code: string;

	private _queryParams: ErroredParam[] | undefined;

	private _body: ErroredParam[] | undefined;

	/**
	 * All the error codes and default message for this error
	 */
	public static readonly errors = {
		CGRVE0001: {
			code: 'CGRVE0001',
			message: 'Validation failure',
		},
	};
	public constructor(code: string, message?: string, queryParams?: ErroredParam[], body?: ErroredParam[]) {
		super(message ? message : RequestValidationError.errors.CGRVE0001.message);
		this._code = code;
		this._queryParams = queryParams;
		this._body = body;
	}

	/**
	 * Unique error code
	 */
	public get code(): string {
		return this._code;
	}

	/**
	 * Field and message for query parameters which have error or fails validation
	 */
	public get queryParams(): ErroredParam[] | undefined {
		return this._queryParams;
	}

	/**
	 * Field and message for parameters belonging to request body which have error or fails validation
	 */
	public get body(): ErroredParam[] | undefined {
		return this._body;
	}
}
