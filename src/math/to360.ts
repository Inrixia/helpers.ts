/**
 * Converts `angle` to 0°-360°
 * @param angle
 * @returns `angle` in 0-360°
 */
export const to360 = (angle: number): number => {
	angle = angle % 360;
	return angle < 0 ? angle + 360 : angle;
};
