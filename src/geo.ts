export interface DMS {
	degrees: number;
	minutes: number;
	seconds: number;
	/** `-1` for negative coordinates, `1` otherwise. `degrees`, `minutes` and `seconds` are magnitudes. */
	sign: 1 | -1;
}

/**
 * Converts latitude or longitude to degrees, minutes & seconds.
 * @param coord Latitude or longitude coordinate
 *
 * @returns Coordinate in degrees, minutes & seconds, plus the sign of `coord`
 */
export const toDMS = (coord: number): DMS => {
	const sign: 1 | -1 = coord < 0 ? -1 : 1;
	const absolute = Math.abs(coord);
	let degrees = Math.floor(absolute);
	const minutesNotTruncated = (absolute - degrees) * 60;
	let minutes = Math.floor(minutesNotTruncated);
	// Round rather than floor, so 7.68 seconds doesn't report as 7.
	let seconds = Math.round((minutesNotTruncated - minutes) * 60);
	// Rounding can reach 60, which isn't a valid seconds or minutes value.
	if (seconds === 60) {
		seconds = 0;
		minutes += 1;
	}
	if (minutes === 60) {
		minutes = 0;
		degrees += 1;
	}
	return { degrees, minutes, seconds, sign };
};

// Converts numeric degrees to radians
export const toRad = (val: number): number => (val * Math.PI) / 180;

/**
 * Returns the distance between two LatLong's in kilometers
 * @param pos1 [lat, long] coordinates
 * @param pos2 [lat, long] coordinates
 */
export const getDistance = (pos1: [number, number], pos2: [number, number]): number => {
	const [lat1, lon1] = pos1;
	const [lat2, lon2] = pos2;
	const R = 6371; // km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};
