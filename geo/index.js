/** Converts numeric degrees to radians */
if(typeof(Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function() {
        return this * Math.PI / 180;
    }
}

/**
 * Returns the distance between two LatLong's in kilometers
 * @param {{ latitude: number, longitude: number }} start 
 * @param {{ latitude: number, longitude: number }} end 
 * @returns {number}
 */
const getDistance = (start, end) => {
	const earthRadius = 6371; // KM
	
    let lat1 = parseFloat(start.latitude);
    let lat2 = parseFloat(end.latitude);
    const lon1 = parseFloat(start.longitude);
    const lon2 = parseFloat(end.longitude);

    let dLat = (lat2 - lat1).toRad();
    let dLon = (lon2 - lon1).toRad();
    lat1 = lat1.toRad();
    lat2 = lat2.toRad();

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return earthRadius * c;
};

module.exports = { getDistance }