const a = 17.625
const b = 243.04

/**
 * Get `dryBulbTemp` from `dewBulbTemp` and `relativeHumidity`
 * @param {number} dewPointTemp Dew point temperature in degrees celsius
 * @param {number} relativeHumidity Relative humidity in whole number percent 0-100
 * @returns {number} `dryBulbTemp` - Dry bulb temperature in degrees celsius  
 * 
 * @url https://bmcnoldy.rsmas.miami.edu/humidity_conversions.pdf
 */
const dryBulbTemp = (dewPointTemp, relativeHumidity) => {
	const lnRH = Math.log(relativeHumidity/100)
	const aTdbTd = (a*dewPointTemp)/(b+dewPointTemp)
	return (b*(aTdbTd-lnRH))/(a + lnRH - aTdbTd)
}

/**
 * Get `dewPointTemp` from `dryBulbTemp` and `relativeHumidity`
 * @param {number} dryBulbTemp Dry bulb temperature in degrees celsius
 * @param {number} relativeHumidity Relative humidity in whole number percent 0-100
 * @returns {number} `dewPointTemp` - Dew point temperature in degrees celsius  
 * 
 * @url https://bmcnoldy.rsmas.miami.edu/humidity_conversions.pdf
 */
const dewPointTemp = (dryBulbTemp, relativeHumidity) => {
	const lnRH = Math.log(relativeHumidity/100)
	const aTbT = (a*dryBulbTemp)/(b+dryBulbTemp)
	return (b*(lnRH+aTbT))/(a - lnRH - aTbT)
}

/**
 * Get `relativeHumidity` from `dryBulbTemp` and `dewPointTemp`
 * @param {number} dryBulbTemp Dry bulb temperature in degrees celsius
 * @param {number} dewPointTemp Dew point temperature in degrees celsius  
 * @returns {number} `dryBulbTemp` - Relative humidity in whole number percent 0-100
 * 
 * @url https://bmcnoldy.rsmas.miami.edu/humidity_conversions.pdf
 */
const relativeHumidity = (dryBulbTemp, dewPointTemp) => {
	const aTdbTd = (a*dewPointTemp)/(b+dewPointTemp)
	const aTbT = (a*dryBulbTemp)/(b+dryBulbTemp)
	return 100*(Math.exp(aTdbTd)/Math.exp(aTbT))
}

module.exports = { dewPointTemp, dryBulbTemp, relativeHumidity }