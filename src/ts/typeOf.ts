import { UnknownRecord } from "./types.js";

/**
 * Returns the type of `item` respecting `Array`, `null` and `undefined` unlike typeof.
 * @param item
 * @returns Type of item
 */
export const typeOf = (
	item: unknown
): "undefined" | "null" | "Inf" | "NaN" | "number" | "bigint" | "array" | "string" | "boolean" | "symbol" | "object" | "function" => {
	switch (item) {
		case undefined:
			return "undefined";
		case null:
			return "null";
		case Infinity:
			return "Inf";
	}
	const typof = typeof item;
	switch (typof) {
		case "number":
			if (isNaN(item as number)) return "NaN";
			return typof;
		case "object":
			if (Array.isArray(item)) return "array";
			return typof;
	}
	return typof;
};
export type TypeOfStr = ReturnType<typeof typeOf>;
export type Types = undefined | null | number | bigint | unknown[] | string | boolean | symbol | UnknownRecord | Function;
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
	function: Function;
};
