import { UnknownRecord } from "../ts/types";

/**
 * Set the types of a given `object` based on the types of an identical `types` object. Usful in conjunction with `getEnv` to convert a object only containing strings/objects to actual types.
 */
export const rebuildTypes = (object: UnknownRecord, types: UnknownRecord): void => {
	for (const key in object) {
		if (types[key] === undefined) continue;
		switch (typeof types[key]) {
			case "number":
				(<number>object[key]) = +(<any>object[key]);
				break;
			case "string":
				(<string>object[key]) = String(object[key]);
				break;
			case "boolean":
				(<boolean>object[key]) = object[key] === true || object[key] === "true";
				break;
			default:
				rebuildTypes(<UnknownRecord>object[key], <UnknownRecord>types[key]);
				break;
		}
	}
};
