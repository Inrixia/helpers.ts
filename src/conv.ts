const a = 17.625;
const b = 243.04;

/**
 * Get `dryBulbTemp` from `dewBulbTemp` and `relativeHumidity`
 * @param dewPointTemp Dew point temperature in degrees celsius
 * @param relativeHumidity Relative humidity in whole number percent 0-100
 * @returns `dryBulbTemp` - Dry bulb temperature in degrees celsius  
 * 
 * @url https://bmcnoldy.rsmas.miami.edu/humidity_conversions.pdf
 */
export const dryBulbTemp = (dewPointTemp: number, relativeHumidity: number): number => {
	const lnRH = Math.log(relativeHumidity/100);
	const aTdbTd = (a*dewPointTemp)/(b+dewPointTemp);
	return (b*(aTdbTd-lnRH))/(a + lnRH - aTdbTd);
};

/**
 * Get `dewPointTemp` from `dryBulbTemp` and `relativeHumidity`
 * @param dryBulbTemp Dry bulb temperature in degrees celsius
 * @param relativeHumidity Relative humidity in whole number percent 0-100
 * @returns `dewPointTemp` - Dew point temperature in degrees celsius  
 * 
 * @url https://bmcnoldy.rsmas.miami.edu/humidity_conversions.pdf
 */
export const dewPointTemp = (dryBulbTemp: number, relativeHumidity: number): number => {
	const lnRH = Math.log(relativeHumidity/100);
	const aTbT = (a*dryBulbTemp)/(b+dryBulbTemp);
	return (b*(lnRH+aTbT))/(a - lnRH - aTbT);
};

/**
 * Get `relativeHumidity` from `dryBulbTemp` and `dewPointTemp`
 * @param dryBulbTemp Dry bulb temperature in degrees celsius
 * @param dewPointTemp Dew point temperature in degrees celsius  
 * @returns `dryBulbTemp` - Relative humidity in whole number percent 0-100
 * 
 * @url https://bmcnoldy.rsmas.miami.edu/humidity_conversions.pdf
 */
export const relativeHumidity = (dryBulbTemp: number, dewPointTemp: number): number => {
	const aTdbTd = (a*dewPointTemp)/(b+dewPointTemp);
	const aTbT = (a*dryBulbTemp)/(b+dryBulbTemp);
	return 100*(Math.exp(aTdbTd)/Math.exp(aTbT));
};