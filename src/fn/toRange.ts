/**
 * @param array
 * @returns string containing ranges of numbers.
 * @example
 * const range = toRange([1, 2, 3, 12, 6, 7, 5, 27, 28, 29, 40, 41, 25, 42, 12])
 * // range = "1-3 & 5-7 & 12 & 25 & 27-29 & 40-42"
 */
export const toRange = (array: number[]): string => {
	// NaN and the infinities can never be part of a range, and duplicates would
	// otherwise need filtering during the walk below.
	const values = [...new Set(array.filter(Number.isFinite))].sort((a, b) => a - b);
	// `${array[0]}` on an empty array built the string "undefined".
	if (values.length === 0) return "";

	const parts: string[] = [];
	let start = values[0];
	let end = values[0];
	for (let i = 1; i < values.length; i++) {
		const value = values[i];
		if (value === end + 1) {
			end = value;
			continue;
		}
		parts.push(start === end ? `${start}` : `${start}-${end}`);
		start = value;
		end = value;
	}
	parts.push(start === end ? `${start}` : `${start}-${end}`);

	return parts.join(" & ");
};
