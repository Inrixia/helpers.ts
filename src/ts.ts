export type { RangeOf, NumRangeInclusive } from "./ts/numRange.js";
export type { AddOne, MinusOne, TimesTen } from "./ts/math.js";

export type ValueOf<T> = T[keyof T];
export type ValueOfA<T extends unknown[] | readonly unknown[]> = T[number];

export type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

export type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

export type ToStrUnion<T extends string | number | bigint | boolean | null | undefined> = `${T}`;

export type FirstChar<T> = T extends `${infer C}${string}` ? C : never;
export type LastChar<T> = T extends `${string}${infer C}` ? C : never;

/**
 * Takes in a string padded with 0's and returns the unpadded string;
 */
export type UnPad<N extends string> = N extends "0" ? "0" : N extends `0${infer A}` ? UnPad<A> : N;

/**
 * Returns a type guard to validate a passed key is a keyof given record
 */
export const generateIsKeyof =
	<T extends Record<string | number | symbol, unknown>>(record: T) =>
	(key: any): key is keyof T =>
		key in record;

export const isDefined = <T>(O: T | undefined): O is T => O !== undefined;

export type RequiredKeys<T> = keyof T extends infer K extends PropertyKey ? (K extends K ? (T extends Record<K, unknown> ? K : never) : never) : never;
export type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;
export type RequiredOnly<T> = Pick<T, RequiredKeys<T> & keyof T>;
export type OptionalOnly<T> = Pick<T, OptionalKeys<T> & keyof T>;

export type UnknownRecord = Record<string | number | symbol, unknown>;

export type Constructor = abstract new (...args: any) => any;
export type Primitives = StringConstructor | NumberConstructor | BooleanConstructor;
export type Primitive<T> = T extends string
	? string
	: T extends StringConstructor
	? string
	: T extends number
	? number
	: T extends NumberConstructor
	? number
	: T extends boolean
	? boolean
	: T extends BooleanConstructor
	? boolean
	: T;
