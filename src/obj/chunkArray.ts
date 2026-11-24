/**
 * Breaks `array` into smaller chunks based on `chunkSize`
 * @param array Array to break up.
 * @param chunkSize Maximum size of array chunks.
 *
 * @returns Array containing array chunks.
 */

export const chunkArray = <T extends unknown[] | string>(array: T, chunkSize: number): T[] => {
	if (!Number.isInteger(chunkSize) || chunkSize < 1) throw new RangeError(`chunkSize must be a positive integer, received ${chunkSize}`);
	if (array.length < chunkSize) return [array];
	const chunks: T[] = [];
	for (let offset = 0; offset < array.length; offset += chunkSize) {
		chunks.push(array.slice(offset, offset + chunkSize) as T);
	}
	return chunks;
};
