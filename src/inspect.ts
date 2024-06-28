import util from "util";

export type InspectOptions = [showHidden?: boolean, depth?: number, color?: boolean];

/**
 * Inspects a object
 * @param obj Object to inspect
 * @param options.showHidden Show hidden properties of object
 * @param options.depth Depth to inspect object
 * @param options.color Color resulting output
 */

export const iObj = (obj: unknown, ...options: InspectOptions): string => {
	if (options[0] === undefined || options[0] === null) options[0] = false;
	if (options[1] === undefined || options[1] === null) options[1] = 5;
	if (options[2] === undefined || options[2] === null) options[2] = true;
	return util.inspect(obj, ...options);
};

/**
 * Logs a inspected object to console
 * @param obj Object to inspect
 * @param options.showHidden Show hidden properties of object
 * @param options.depth Depth to inspect object
 * @param options.color Color resulting output
 */
export const lObj = (obj: unknown, ...options: InspectOptions): void => console.log(iObj(obj, ...options));

/**
 * Single line inspect object.
 * @param obj Object to inspect
 * @param options.showHidden Show hidden properties of object
 * @param options.depth Depth to inspect object
 * @param options.color Color resulting output
 */
export const sliObj = (obj: unknown, ...options: InspectOptions): string =>
	iObj(obj, ...options)
		.replace(/\r?\n/g, " ")
		.replace(/  +/g, " ");
