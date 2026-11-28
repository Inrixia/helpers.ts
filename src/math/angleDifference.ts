/**
 * Calculates the difference between two angles, `angle1` & `angle2`. The result is in
 * decimal degrees and is signed unless `signed` is false.
 *
 * Inputs don't have to be in 0-360°; they're normalised first, so 400° and 40° behave
 * the same. The signed result is in the range (-180, 180].
 *
 * @param angle1 First angle to compare
 * @param angle2 Second angle to compare
 * @param signed If the result is signed or absolute
 * @returns The difference in degrees
 */
export const angleDifference = (angle1: number, angle2: number, signed = true): number => {
	// Normalise into 0-360 before taking the difference. The previous version
	// worked on the raw inputs and tested them against 0-360 windows to decide
	// the sign, so anything outside that range took the wrong branch.
	const normalised = (((angle1 - angle2) % 360) + 360) % 360;
	// Fold the upper half back so the short way round is chosen.
	const difference = normalised > 180 ? normalised - 360 : normalised;
	return signed ? difference : Math.abs(difference);
};
