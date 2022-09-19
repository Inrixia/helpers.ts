import type { expect } from "vitest";

import type { ValueOfA, Primitives, Primitive, UnknownRecord } from "../ts.js";

export type Matchers = {
	typeOrNull: <T extends Primitives>(matcher: T) => Primitive<T> | null;
	typeOrUndefined: <T extends Primitives>(matcher: T) => Primitive<T> | undefined;
	objectContainingOrEmpty: <T>(matcher: T) => T | UnknownRecord;
	objectContainingOrUndefined: <T>(matcher: T) => T | undefined;
	objectContainingOrNull: <T>(matcher: T) => T | null;
	objectContainingOrEmptyOrNullish: <T>(matcher: T) => T | UnknownRecord | undefined | null;
	keylessObjectContaining: <T>(matcher: T) => Record<string, T>;
	arrayContainingOrEmpty: <T>(matcher: [T]) => T[] | [];
	arrayContainingOrEmptyOrUndefined: <T>(matcher: [T]) => T[] | [] | undefined;
	enum: <T extends readonly unknown[]>(matcher: T) => ValueOfA<T>;
};
const OK = {
	message: () => "Ok",
	pass: true,
};
export const getExpect = (expect: Vi.ExpectStatic): Vi.ExpectStatic & Matchers => {
	const matchers: Record<keyof Matchers, any> = {
		typeOrNull(received: unknown, argument: unknown) {
			if (received === null) return OK;
			expect(received).toStrictEqual(expect.any(argument));
			return OK;
		},
		typeOrUndefined(received: unknown, argument: unknown) {
			if (received === undefined) return OK;
			expect(received).toStrictEqual(expect.any(argument));
			return OK;
		},
		objectContainingOrEmpty(received: unknown[], argument: unknown) {
			if (Object.keys(received).length === 0) return OK;
			expect(received).toStrictEqual(expect.objectContaining(argument));
			return OK;
		},
		objectContainingOrUndefined(received: unknown, argument: unknown) {
			if (received === undefined) return OK;
			expect(received).toStrictEqual(expect.objectContaining(argument));
			return OK;
		},
		objectContainingOrNull(received: unknown, argument: unknown) {
			if (received === null) return OK;
			expect(received).toStrictEqual(expect.objectContaining(argument));
			return OK;
		},
		objectContainingOrEmptyOrNullish(received: unknown, argument: unknown) {
			if (received === undefined || received === null || Object.keys(received).length === 0) return OK;
			expect(received).toStrictEqual(expect.objectContaining(argument));
			return OK;
		},
		keylessObjectContaining(received: UnknownRecord, argument: unknown) {
			for (const key in received) {
				expect(received[key]).toStrictEqual(argument);
			}
			return OK;
		},
		arrayContainingOrEmpty(received: unknown[], argument: any[]) {
			if (received.length === 0) return OK;
			expect(received).toStrictEqual(expect.arrayContaining(argument));
			return OK;
		},
		arrayContainingOrEmptyOrUndefined(received: unknown[], argument: unknown[]) {
			if (received === undefined || received.length === 0) return OK;
			expect(received).toStrictEqual(expect.arrayContaining(argument));
			return OK;
		},
		enum(received: unknown, argument: unknown[]) {
			expect(argument).toContain(received);
			return OK;
		},
	};
	expect.extend(matchers);
	return <Vi.ExpectStatic & Matchers>expect;
};
