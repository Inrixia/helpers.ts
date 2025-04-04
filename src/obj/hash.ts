/**
 * Checks if `key` has been seen before.
 */
const hash = new Map();
export const isDuplicate = (key: unknown): boolean => {
	if (!hash.has(key)) hash.set(key, true);
	else return true;
	return false;
};
