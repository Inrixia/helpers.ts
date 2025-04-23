import { isObject } from "../ts/isTypeOf";
import { UnknownRecord } from "../ts/types";
/**
 * Deep merge objects into target. Without modifying target.
 * @param target
 * @param source
 */

export const deepMerge = <T extends S, S extends UnknownRecord = Partial<T>>(target: T, source: S): T & S => {
	const output = Object.assign({}, target);
	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach((key) => {
			if (isObject(source[key])) {
				if (!(key in target)) Object.assign(output, { [key]: source[key] });
				else (<UnknownRecord>output)[key] = deepMerge(<UnknownRecord>target[key], <UnknownRecord>source[key]);
			} else Object.assign(output, { [key]: source[key] });
		});
	}
	return output;
};
