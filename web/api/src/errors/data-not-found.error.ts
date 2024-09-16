export default class DataNotFound extends Error {
	private _customMessage: string | undefined;
	public constructor(customMessage: string) {
		super(customMessage);
		this._customMessage = customMessage;
	}

	public get customMessage(): string | undefined {
		return this._customMessage;
	}
}
