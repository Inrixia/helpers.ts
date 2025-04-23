export class Promize<T> implements Promise<T> {
	private _promise!: Promise<T>;
	public res!: (value: T | PromiseLike<T>) => void;
	public rej!: (reason?: any) => void;

	/**
	 * Immdiately resolves the promise with the given value if provided.
	 */
	constructor(resValue?: T) {
		this.set(resValue);
	}

	/**
	 * Recreate the underlying promise
	 * @param resValue If not undefined, resolves the internal promise with given value on creation.
	 */
	set(resValue?: T): void {
		this.reset();
		if (resValue !== undefined) this.res(resValue);
	}

	/**
	 * Recreate the underlying promise
	 */
	reset(): void {
		const withRes = Promise.withResolvers<T>();
		this._promise = withRes.promise;
		this.res = withRes.resolve;
		this.rej = withRes.reject;
	}

	then: Promise<T>["then"] = (onRes, onRej) => this._promise.then(onRes, onRej);
	catch: Promise<T>["catch"] = (onRej) => this._promise.catch(onRej);
	finally: Promise<T>["finally"] = (onFinal) => this._promise.finally(onFinal);

	// Required for Promise compatibility
	[Symbol.toStringTag]: string = "Promise";
}
