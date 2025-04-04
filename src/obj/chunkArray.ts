/**
 * Breaks `array` into smaller chunks based on `chunkSize`
 * @param array Array to break up.
 * @param chunkSize Maximum size of array chunks.
 *
 * @returns Array containing array chunks.
 */

export const chunkArray = <T extends unknown[] | string>(array: T, chunkSize: number): T[] => {
	if (array.length < chunkSize) return [array];
	let i, j;
	const returnArray: T[] = [];
	for (i = 0, j = array.length; i < j; i += chunkSize) returnArray.push(array.slice(i, i + chunkSize) as T);
	return returnArray;
};
