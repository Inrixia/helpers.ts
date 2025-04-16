export type { AddOne, MinusOne, TimesTen } from "./math.js";
export type { NumRangeInclusive, RangeOf } from "./numRange.js";

export type ValueOf<T> = T[keyof T];
export type ValueOfA<T extends unknown[] | readonly unknown[]> = T[number];

export type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

export type RecursiveReadonly<T> = T extends (infer R)[]
	? ReadonlyArray<RecursiveReadonly<R>>
	: T extends object
	? { readonly [K in keyof T]: RecursiveReadonly<T[K]> }
	: T;
export type RecursiveRequired<T> = T extends any[] ? T : T extends object ? { [K in keyof T]-?: RecursiveRequired<T[K]> } : T;
export type RecursivePartial<T> = T extends any[] ? T : T extends object ? { [K in keyof T]?: RecursivePartial<T[K]> } : T;

export type ToStrUnion<T extends string | number | bigint | boolean | null | undefined> = `${T}`;

export type FirstChar<T> = T extends `${infer C}${string}` ? C : never;
export type LastChar<T> = T extends `${string}${infer C}` ? C : never;

/**
 * Takes in a string padded with 0's and returns the unpadded string;
 */
export type UnPad<N extends string> = N extends "0" ? "0" : N extends `0${infer A}` ? UnPad<A> : N;

export type AsyncFunction = (...args: unknown[]) => Promise<unknown>;

export type RequiredKeys<T> = keyof T extends infer K extends PropertyKey ? (K extends K ? (T extends Record<K, unknown> ? K : never) : never) : never;
export type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;
export type RequiredOnly<T> = Pick<T, RequiredKeys<T> & keyof T>;
export type OptionalOnly<T> = Pick<T, OptionalKeys<T> & keyof T>;

export type AnyKey = string | number | symbol;
export type UnknownRecord = Record<AnyKey, unknown>;
export type AnyRecord = Record<AnyKey, any>;

export type Unload = () => MaybePromise<unknown>;

export type MaybePromise<T> = T | Promise<T>;

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
