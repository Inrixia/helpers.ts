/**
 * @param array
 * @returns string containing ranges of numbers.
 * @example
 * const range = toRange([1, 2, 3, 12, 6, 7, 5, 27, 28, 29, 40, 41, 25, 42, 12])
 * // range = "1-3 & 5-7 & 12 & 25 & 27-29 & 40-42"
 */
export const toRange = (array: number[]): string => {
	array = array
		.filter((a, pos) => array.indexOf(a) === pos)
		.sort((a, b) => a - b)
		.map((a) => +a);
	let sum = `${array[0]}`;
	let lastValue = array[0];
	for (let i = 1; i <= array.length; i++) {
		if (!(array[i] - 1 === array[i - 1])) {
			if (array[i - 1] !== lastValue) sum += `-${array[i - 1]}`;
			if (array[i] !== undefined) sum += ` & ${array[i]}`;
			lastValue = array[i];
		}
	}
	return sum;
};
