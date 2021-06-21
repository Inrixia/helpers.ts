export type ValueOf<T> = T[keyof T];
export type ValueOfA<T extends unknown[] | readonly unknown[]> = T[number];

export type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

type BuildPowersOf2LengthArrays<N extends number, R extends never[][]> = R[0][N] extends never ? R : BuildPowersOf2LengthArrays<N, [[...R[0], ...R[0]], ...R]>;
type ConcatLargestUntilDone<N extends number, R extends never[][], B extends never[]> = B["length"] extends N
	? B
	: [...R[0], ...B][N] extends never
	? ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? (U extends never[][] ? U : never) : never, B>
	: ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? (U extends never[][] ? U : never) : never, [...R[0], ...B]>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Replace<R extends any[], T> = { [K in keyof R]: T };
type TupleOf<T, N extends number> = number extends N
	? T[]
	: {
			[K in N]: BuildPowersOf2LengthArrays<K, [[never]]> extends infer U ? (U extends never[][] ? Replace<ConcatLargestUntilDone<K, U, []>, T> : never) : never;
	  }[N];
export type RangeOf<N extends number> = Partial<TupleOf<unknown, N>>["length"];
export type NumRangeInclusive<FROM extends number, TO extends number> = Exclude<RangeOf<TO>, RangeOf<FROM>> | FROM;

export type ToStrUnion<T extends string | number | bigint | boolean | null | undefined> = `${T}`;

export type FirstChar<T> = T extends `${infer C}${string}` ? C : never;
export type LastChar<T> = T extends `${string}${infer C}` ? C : never;

/**
 * Takes in a string padded with 0's and returns the unpadded string;
 */
export type UnPad<N extends string> = N extends "0" ? "0" : N extends `0${infer A}` ? UnPad<A> : N;

type Zero<S, Z> = S extends `${infer A}${infer B}` ? (B extends "" ? Z : `${Zero<A, Z>}${Zero<B, Z>}`) : "";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ZZero<S, Z> = S extends `${infer _A}${infer B}` ? Zero<B, Z> : "";

type Increment<T> = T extends "0"
	? "1"
	: T extends "1"
	? "2"
	: T extends "2"
	? "3"
	: T extends "3"
	? "4"
	: T extends "4"
	? "5"
	: T extends "5"
	? "6"
	: T extends "6"
	? "7"
	: T extends "7"
	? "8"
	: T extends "8"
	? "9"
	: never;
export type AddOne<S = string> = S extends "9" ? "10" : _AddOne<S>;
type _AddOne<S = string> = S extends `${infer A}${infer B}`
	? `${Increment<B> extends never ? (_AddOne<B> extends never ? Increment<A> : A) : A}${Increment<B> extends never
			? _AddOne<B> extends never
				? ZZero<S, "0">
				: _AddOne<B>
			: Increment<B>}`
	: never;

type Decrement<T = string> = T extends "1"
	? "0"
	: T extends "2"
	? "1"
	: T extends "3"
	? "2"
	: T extends "4"
	? "3"
	: T extends "5"
	? "4"
	: T extends "6"
	? "5"
	: T extends "7"
	? "6"
	: T extends "8"
	? "7"
	: T extends "9"
	? "8"
	: never;
export type MinusOne<S = string> = S extends "10" ? "9" : _MinusOne<S>;
type _MinusOne<S = string> = __MinusOne<S> extends `0${infer A}` ? `${A}` : __MinusOne<S>;
type __MinusOne<S = string> = S extends `${infer A}${infer B}`
	? `${Decrement<B> extends never ? (__MinusOne<B> extends never ? Decrement<A> : A) : A}${Decrement<B> extends never
			? __MinusOne<B> extends never
				? ZZero<S, "9">
				: __MinusOne<B>
			: Decrement<B>}`
	: never;

export type TimesTen<S> = S extends string | number ? `${S}0` : never;

/**
 * Returns a type guard to validate a passed key is a keyof given record
 */
export const generateIsKeyof =
	<T extends Record<string | number | symbol, unknown>>(record: T) =>
	(key: keyof T | string | number | symbol): key is keyof T => {
		return record[key as keyof T] !== undefined;
	};
