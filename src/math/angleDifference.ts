/**
 * Calculates the difference between two angles (0°-360°), `angle1` & `angle2` returned result is in decimal degrees and is signed.
 * @param angle1 First angle to compare
 * @param angle2 Second angle to compare
 * @param signed If the result is signed or absolute
 * @returns The difference in degrees
 */
export const angleDifference = (angle1: number, angle2: number, signed = true): number => {
	let difference = Math.abs(angle1 - angle2) % 360;
	difference = difference > 180 ? 360 - difference : difference;

	// Calculate sign
	if (signed) return (angle1 - angle2 >= 0 && angle1 - angle2 <= 180) || (angle1 - angle2 <= -180 && angle1 - angle2 >= -360) ? difference : difference * -1;
	return difference;
};
