export class Promize<T> implements Promise<T> {
	private _promise!: Promise<T>;
	public res!: (value: T | PromiseLike<T>) => void;
	public rej!: (reason?: any) => void;

	constructor(resValue?: T) {
		this.set(resValue);
	}

	/**
	 * Recreate the underlying promise
	 * @param resValue If not undefined, resolves the internal promise with given value on creation.
	 */
	set(resValue?: T): void {
		this._promise = new Promise<T>((res, rej) => {
			this.res = res;
			this.rej = rej;
		});
		if (resValue !== undefined) this.res(resValue);
	}

	then: Promise<T>["then"] = (onRes, onRej) => this._promise.then(onRes, onRej);
	catch: Promise<T>["catch"] = (onRej) => this._promise.catch(onRej);
	finally: Promise<T>["finally"] = (onFinal) => this._promise.finally(onFinal);

	// Required for Promise compatibility
	[Symbol.toStringTag]: string = "Promise";
}
