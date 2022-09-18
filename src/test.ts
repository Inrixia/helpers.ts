import { expect } from "vitest";
import { matchers, type Matchers } from "./test/matchers.js";
import { Constructor, Primitive } from "./ts.js";

expect.extend(matchers);
export const eExpect = <Vi.ExpectStatic & Matchers>expect;

declare global {
	namespace Vi {
		interface ExpectStatic extends Chai.ExpectStatic, AsymmetricMatchersContaining {
			any<C>(constructor: C extends Constructor ? C : any): C extends Constructor ? Primitive<InstanceType<C>> : C;
		}
		interface AsymmetricMatchersContaining {
			arrayContaining<T = unknown>(expected: Array<T>): T[];
			objectContaining<T = unknown>(expected: T): T;
			stringMatching<T extends string>(expected: T): T;
		}
	}
}
