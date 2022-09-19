import { Constructor, Primitive } from "./ts.js";

export { getExpect } from "./test/matchers.js";

declare module "vitest" {
	interface ExpectStatic extends Chai.ExpectStatic, AsymmetricMatchersContaining {
		any<C>(constructor: C extends Constructor ? C : any): C extends Constructor ? Primitive<InstanceType<C>> : C;
	}
	interface AsymmetricMatchersContaining {
		arrayContaining<T = unknown>(expected: Array<T>): T[];
		objectContaining<T = unknown>(expected: T): T;
		stringMatching<T extends string>(expected: T): T;
	}
}
