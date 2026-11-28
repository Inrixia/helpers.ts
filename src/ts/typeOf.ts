import { UnknownRecord } from "./types.js";

/**
 * Returns the type of `item` respecting `Array`, `null` and `undefined` unlike typeof.
 * @param item
 * @returns Type of item
 */
export const typeOf = (
	item: unknown
): "undefined" | "null" | "Inf" | "NaN" | "number" | "bigint" | "array" | "string" | "boolean" | "symbol" | "object" | "function" => {
	if (item === undefined) return "undefined";
	if (item === null) return "null";
	const typof = typeof item;
	switch (typof) {
		case "number":
			// `switch (item) { case Infinity: }` only ever matched positive
			// infinity, so -Infinity was reported as a plain number.
			if (item === Number.POSITIVE_INFINITY || item === Number.NEGATIVE_INFINITY) return "Inf";
			if (Number.isNaN(item)) return "NaN";
			return typof;
		case "object":
			if (Array.isArray(item)) return "array";
			return typof;
	}
	return typof;
};
export type TypeOfStr = ReturnType<typeof typeOf>;
export type Types = undefined | null | number | bigint | unknown[] | string | boolean | symbol | UnknownRecord | ((...args: any[]) => unknown);
export type TypeMap = {
	undefined: undefined;
	null: null;
	Inf: number;
	NaN: number;
	number: number;
	bigint: bigint;
	array: unknown[];
	string: string;
	boolean: boolean;
	symbol: symbol;
	object: UnknownRecord;
	function: (...args: any[]) => unknown;
};
