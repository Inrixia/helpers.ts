/**
 * Pad a number with 0's
 * @param num Number to pad.
 * @param zeros Number of digits returned number should have.
 *
 * @returns Padded number
 * @example
 * let paddedNumber = nPad(5)
 * // paddedNumber = "05"
 * let triplePaddedNumber = nPad(6, 3)
 * // triplePaddedNumber = "006"
 */
export const nPad = (num: number | string, zeros = 2): string => {
	num = num.toString();
	while (num.length < zeros) num = "0" + num;
	return num;
};
