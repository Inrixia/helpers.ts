module.exports.Promize = class Promize {
	/**
	 * Returns a new instance of a `Promize`, a externally resolvable Promise.
	 * @param {boolean} resolved Sets the internal promise to be resolved on creation.
	 */
	constructor(resolved = false) {
		this.set(resolved)
	}
	/**
	 * Set the promise
	 * @param {boolean} resolved Resolve on creation.
	 */
	set(resolved = false) {
		this.p = new Promise((res, rej) => {
			this.res = res;
			this.rej = rej;
		})
		if (resolved === true) this.res()
	}
}