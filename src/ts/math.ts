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
