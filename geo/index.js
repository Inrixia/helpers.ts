/**
 * Converts latitude or longitude to degrees, minutes & seconds.
 * @param {number} coord Latitude or longitude coordinate
 * 
 * @returns {{ degrees: number, minutes: number, seconds: number }} Coordinate in degrees, minutes & seconds
 */
const toDMS = coord => {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    return { degrees, minutes, seconds };
}

// Converts numeric degrees to radians
const toRad = val => val * Math.PI / 180;

/**
 * Returns the distance between two LatLong's in kilometers
 * @param {[number, number]} pos1 [lat, long] coordinates
 * @param {[number, number]} pos2 [lat, long] coordinates
 * @returns {number}
 */
const getDistance = (pos1, pos2) => {
    const [lat1, lon1] = pos1
	const [lat2, lon2] = pos2
	const R = 6371; // km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

module.exports = { getDistance, toDMS }