import { UnknownRecord } from "./types";

/**
 * Returns a type guard to validate a passed key is a keyof given record
 */
export const isKeyOf =
	<T extends UnknownRecord>(record: T) =>
	(key: any): key is keyof T =>
		key in record;
