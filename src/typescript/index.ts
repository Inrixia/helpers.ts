export type ValueOf<T> = T extends unknown[] | readonly unknown[] ? T[number] : T[keyof T];

type BuildPowersOf2LengthArrays<N extends number, R extends never[][]> = R[0][N] extends never ? R : BuildPowersOf2LengthArrays<N, [[...R[0], ...R[0]], ...R]>;
type ConcatLargestUntilDone<N extends number, R extends never[][], B extends never[]> =
  B["length"] extends N ? B : [...R[0], ...B][N] extends never
    ? ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? U extends never[][] ? U : never : never, B>
    : ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? U extends never[][] ? U : never : never, [...R[0], ...B]>;
type Replace<R extends any[], T> = { [K in keyof R]: T }
type TupleOf<T, N extends number> = number extends N ? T[] : {
  [K in N]: 
  BuildPowersOf2LengthArrays<K, [[never]]> extends infer U ? U extends never[][]
  ? Replace<ConcatLargestUntilDone<K, U, []>, T> : never : never;
}[N]
export type NumRangeOf<N extends number> = Partial<TupleOf<unknown, N>>["length"];
export type NumRange<FROM extends number, TO extends number> = Exclude<NumRangeOf<TO>, NumRangeOf<FROM>>

export type ToStrUnion<T extends string | number | bigint | boolean | null | undefined> = `${T}`;