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