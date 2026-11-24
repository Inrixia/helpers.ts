const a = 17.625;
const b = 243.04;

/**
 * Relative humidity has to be above 0 because the formula takes ln(RH / 100),
 * and log(0) is -Infinity, which turned every result into NaN.
 */
const assertRelativeHumidity = (relativeHumidity: number): void => {
	if (!Number.isFinite(relativeHumidity) || relativeHumidity <= 0 || relativeHumidity > 100) {
		throw new RangeError(`relativeHumidity must be a finite number greater than 0 and at most 100, received ${relativeHumidity}`);
	}
};

/**
 * Every formula here divides by `(b + temperature)`, so a non-finite value
 * produced NaN and the singular point produced Infinity. Validating the
 * temperature too keeps the functions total instead of letting those through.
 */
const assertTemperature = (name: string, value: number): void => {
	if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number, received ${value}`);
	if (b + value === 0) throw new RangeError(`${name} cannot be ${-b}, the formula is singular there`);
};

/**
 * Get `dryBulbTemp` from `dewBulbTemp` and `relativeHumidity`
 * @param dewPointTemp Dew point temperature in degrees celsius
 * @param relativeHumidity Relative humidity in whole number percent, greater than 0 and at most 100
 * @returns `dryBulbTemp` - Dry bulb temperature in degrees celsius
 * @throws {RangeError} If `relativeHumidity` is out of range, or `dewPointTemp` is not a usable number
 *
 * @url https://bmcnoldy.rsmas.miami.edu/humidity_conversions.pdf
 */
export const dryBulbTemp = (dewPointTemp: number, relativeHumidity: number): number => {
	assertTemperature("dewPointTemp", dewPointTemp);
	assertRelativeHumidity(relativeHumidity);
	const lnRH = Math.log(relativeHumidity / 100);
	const aTdbTd = (a * dewPointTemp) / (b + dewPointTemp);
	return (b * (aTdbTd - lnRH)) / (a + lnRH - aTdbTd);
};

/**
 * Get `dewPointTemp` from `dryBulbTemp` and `relativeHumidity`
 * @param dryBulbTemp Dry bulb temperature in degrees celsius
 * @param relativeHumidity Relative humidity in whole number percent, greater than 0 and at most 100
 * @returns `dewPointTemp` - Dew point temperature in degrees celsius
 * @throws {RangeError} If `relativeHumidity` is out of range, or `dryBulbTemp` is not a usable number
 *
 * @url https://bmcnoldy.rsmas.miami.edu/humidity_conversions.pdf
 */
export const dewPointTemp = (dryBulbTemp: number, relativeHumidity: number): number => {
	assertTemperature("dryBulbTemp", dryBulbTemp);
	assertRelativeHumidity(relativeHumidity);
	const lnRH = Math.log(relativeHumidity / 100);
	const aTbT = (a * dryBulbTemp) / (b + dryBulbTemp);
	return (b * (lnRH + aTbT)) / (a - lnRH - aTbT);
};

/**
 * Get `relativeHumidity` from `dryBulbTemp` and `dewPointTemp`
 * @param dryBulbTemp Dry bulb temperature in degrees celsius
 * @param dewPointTemp Dew point temperature in degrees celsius, at or below `dryBulbTemp`
 * @returns Relative humidity in whole number percent, 0-100
 * @throws {RangeError} If `dewPointTemp` is above `dryBulbTemp`, or either temperature is not usable
 *
 * @url https://bmcnoldy.rsmas.miami.edu/humidity_conversions.pdf
 */
export const relativeHumidity = (dryBulbTemp: number, dewPointTemp: number): number => {
	assertTemperature("dryBulbTemp", dryBulbTemp);
	assertTemperature("dewPointTemp", dewPointTemp);
	// By definition the dew point can't exceed the dry bulb. When it did, this
	// returned a relative humidity above 100% instead of rejecting the input.
	if (dewPointTemp > dryBulbTemp) {
		throw new RangeError(`dewPointTemp (${dewPointTemp}) must not be above dryBulbTemp (${dryBulbTemp})`);
	}
	const aTdbTd = (a * dewPointTemp) / (b + dewPointTemp);
	const aTbT = (a * dryBulbTemp) / (b + dryBulbTemp);
	return 100 * (Math.exp(aTdbTd) / Math.exp(aTbT));
};
