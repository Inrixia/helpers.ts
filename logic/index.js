module.exports.Promize = class Promize {
	constructor() {
		this.set()
	}
	/**
	 * Set the promise
	 * @param {boolean} resolved Resolve on creation.
	 */
	set(resolved=false) {
		this.p = new Promise((res, rej) => {
			this.res = res;
			this.rej = rej;
		})
		if (resolved === true) this.res()
	}
}