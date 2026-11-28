export class Promize<T> implements Promise<T> {
	private _promise!: Promise<T>;
	public res!: (value: T | PromiseLike<T>) => void;
	public rej!: (reason?: any) => void;

	/**
	 * Resolves immediately when a value is supplied.
	 *
	 * `new Promize(undefined)` resolves with `undefined`. Constructing with no
	 * argument leaves the promise pending until `res` is called. The two cases
	 * are distinguished by argument presence rather than by an `undefined` check.
	 */
	constructor(...args: [value: T] | []) {
		this.set(...args);
	}

	/**
	 * Recreate the underlying promise
	 * @param resValue If supplied (even as `undefined`), resolves the internal promise with it.
	 *
	 * Any handler attached to the previous promise is left pending forever, so
	 * re-attach your handlers after calling this.
	 */
	set(...args: [value: T] | []): void {
		this.reset();
		// `=== 1` rather than `> 0`: the length equality is what narrows the tuple
		// union to [T], so args[0] types as T with no cast.
		if (args.length === 1) this.res(args[0]);
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
