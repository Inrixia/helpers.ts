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
	const text = String(num);
	// Pad the magnitude and keep the sign at the front. Prepending zeros to the
	// whole string put them in front of the minus sign instead: -5 became "0-5".
	const negative = text.startsWith("-");
	const magnitude = negative ? text.slice(1) : text;
	const width = Math.max(0, zeros - (negative ? 1 : 0));
	const padded = magnitude.padStart(width, "0");
	return negative ? `-${padded}` : padded;
};
