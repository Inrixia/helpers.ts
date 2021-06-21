export class Promize {
	public p!: Promise<unknown>;
	res!: (value?: unknown) => void;
	rej!: (reason?: any) => void;

	/**
	 * Returns a new instance of a `Promize`, a externally resolvable Promise.
	 * @param resolved Sets the internal promise to be resolved on creation.
	 */
	constructor(resolved = false) {
		this.set(resolved);
	}

	/**
	 * Set the promise
	 * @param resolved Resolve on creation.
	 */
	set(resolved = false): void {
		this.p = new Promise((res, rej) => {
			this.res = res;
			this.rej = rej;
		});
		if (resolved === true) this.res();
	}
}
