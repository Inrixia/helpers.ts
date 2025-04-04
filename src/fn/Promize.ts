export class Promize<T> {
	public p!: Promise<T>;
	res!: (value: T) => void;
	rej!: (reason?: any) => void;

	/**
	 * Returns a new instance of a `Promize`, a externally resolvable Promise.
	 * @param resValue If not undefined, resolves the internal promise with given value on creation.
	 */
	constructor(resValue?: T) {
		this.set(resValue);
	}

	/**
	 * Recreate the promise
	 * @param resValue If not undefined, resolves the internal promise with given value on creation.
	 */
	set(resValue?: T): void {
		this.p = new Promise<T>((res, rej) => {
			this.res = res;
			this.rej = rej;
		});
		if (resValue !== undefined) this.res(resValue);
	}
}
