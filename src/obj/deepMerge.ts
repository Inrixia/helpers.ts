import { isObject } from "../ts/isTypeOf.js";
import { UnknownRecord } from "../ts/types.js";

type Seen = WeakMap<object, unknown>;

/**
 * Merges a source value into its target counterpart, or clones it when there is
 * no target counterpart.
 *
 * Visited source objects are tracked in `seen`, so a self-referencing structure
 * becomes a self-reference in the output instead of recursing until the stack
 * overflows.
 */
const mergeValue = (targetValue: unknown, sourceValue: unknown, seen: Seen): unknown => {
	if (Array.isArray(sourceValue)) {
		const cached = seen.get(sourceValue);
		if (cached !== undefined) return cached;
		const copy: unknown[] = [];
		seen.set(sourceValue, copy);
		for (const item of sourceValue) copy.push(mergeValue(undefined, item, seen));
		return copy;
	}
	if (isObject(sourceValue)) {
		// Recurse into the existing target object when there is one, otherwise
		// start from an empty object so source-only keys are cloned rather than
		// assigned by reference.
		return isObject(targetValue)
			? mergeRecords(<UnknownRecord>targetValue, <UnknownRecord>sourceValue, seen)
			: mergeRecords({}, <UnknownRecord>sourceValue, seen);
	}
	return sourceValue;
};

const mergeRecords = (target: UnknownRecord, source: UnknownRecord, seen: Seen): UnknownRecord => {
	const cached = seen.get(source);
	if (cached !== undefined) return <UnknownRecord>cached;
	const output: UnknownRecord = { ...target };
	seen.set(source, output);
	for (const key of Object.keys(source)) output[key] = mergeValue(target[key], source[key], seen);
	return output;
};

/**
 * Deep merge objects into target. Without modifying target.
 * @param target
 * @param source
 */

export const deepMerge = <T extends S, S extends UnknownRecord = Partial<T>>(target: T, source: S): T & S => {
	if (!isObject(target) || !isObject(source)) return Object.assign({}, target) as T & S;
	return mergeRecords(<UnknownRecord>target, <UnknownRecord>source, new WeakMap()) as T & S;
};
