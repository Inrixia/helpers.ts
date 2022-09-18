import { expect } from "vitest";

import type { ValueOfA, Primitives, Primitive } from "../ts.js";

export type Matchers = {
	typeOrNull: <T extends Primitives>(matcher: T) => Primitive<T> | null;
	typeOrUndefined: <T extends Primitives>(matcher: T) => Primitive<T> | undefined;
	objectContainingOrEmpty: <T>(matcher: T) => T | {};
	objectContainingOrUndefined: <T>(matcher: T) => T | undefined;
	objectContainingOrNull: <T>(matcher: T) => T | null;
	objectContainingOrEmptyOrUndefined: <T>(matcher: T) => T | {} | undefined;
	keylessObjectContaining: <T>(matcher: T) => Record<string, T>;
	arrayContainingOrEmpty: <T>(matcher: [T]) => T[] | [];
	arrayContainingOrEmptyOrUndefined: <T>(matcher: [T]) => T[] | [] | undefined;
	enum: <T extends readonly unknown[]>(matcher: T) => ValueOfA<T>;
};
const OK = {
	message: () => "Ok",
	pass: true,
};
export const matchers: Record<keyof Matchers, any> = {
	typeOrNull(received: any, argument: any) {
		if (received === null) return OK;
		expect(received).toStrictEqual(expect.any(argument));
		return OK;
	},
	typeOrUndefined(received: any, argument: any) {
		if (received === undefined) return OK;
		expect(received).toStrictEqual(expect.any(argument));
		return OK;
	},
	objectContainingOrEmpty(received: any, argument: any) {
		if (Object.keys(received).length === 0) return OK;
		expect(received).toStrictEqual(expect.objectContaining(argument));
		return OK;
	},
	objectContainingOrUndefined(received: any, argument: any) {
		if (received === undefined) return OK;
		expect(received).toStrictEqual(expect.objectContaining(argument));
		return OK;
	},
	objectContainingOrNull(received: any, argument: any) {
		if (received === null) return OK;
		expect(received).toStrictEqual(expect.objectContaining(argument));
		return OK;
	},
	objectContainingOrEmptyOrUndefined(received: any, argument: any) {
		if (received === undefined || Object.keys(received).length === 0) return OK;
		expect(received).toStrictEqual(expect.objectContaining(argument));
		return OK;
	},
	keylessObjectContaining(received: Record<string, any>, argument: any) {
		for (const key in received) {
			expect(received[key]).toStrictEqual(argument);
		}
		return OK;
	},
	arrayContainingOrEmpty<T>(received: any, argument: any[]) {
		if (received.length === 0) return OK;
		expect(received).toStrictEqual(expect.arrayContaining(argument));
		return OK;
	},
	arrayContainingOrEmptyOrUndefined(received: any, argument: any[]) {
		if (received === undefined || received.length === 0) return OK;
		expect(received).toStrictEqual(expect.arrayContaining(argument));
		return OK;
	},
	enum(received: any, argument: any[]) {
		expect(argument).toContain(received);
		return OK;
	},
};
