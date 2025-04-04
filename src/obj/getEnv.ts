import { isObject } from "../ts/isTypeOf.js";
import { UnknownRecord } from "../ts/types.js";

type EnvDict = { [key: string]: string | EnvDict };
/**
 * Converts process.env variables into a object
 * @example process.env["some_subproperty"] = "hello"
 * returns { some: { subProperty: "hello" } }
 */

export const getEnv = (): EnvDict => {
	// Define our return object env variables are applied to.
	const envObject = {} as EnvDict;
	// Iterate over env keys
	for (const envKey in process.env) {
		// Set our reference object to be equal to the envObject to begin with.
		let objRef = envObject;
		// Reference to parent object to allow reassigning values that should be objects.
		let pObjRef: [UnknownRecord, string] | undefined = undefined;
		// Break apart the envKey into its keys. Ex some_subProperty = ["some", "subProperty"]
		// This regex handles cases where _ is in the key, it only matches the first _ per key allowing for keys with one or more _ in them
		const keys = envKey.split(/(?<=[^__])_/g);
		// For every key except the last...
		for (let i = 0; i < keys.length - 1; i++) {
			// Set the key on the objRef to a empty object if its undefined.
			if (!isObject(objRef)) {
				// If objRef is not a object. Use the parent object to set it to a object containing itself as _.
				if (pObjRef !== undefined) objRef = pObjRef[0][pObjRef[1]] = { _: objRef };
				pObjRef = [objRef, keys[i]];
			} else {
				pObjRef = [objRef, keys[i]];
				objRef = <EnvDict>(objRef[keys[i]] ??= {});
			}
		}
		// Set the last key to equal the original value
		// If objRef is not a object. Use the parent object to set it to a object containing itself as _.
		if (!isObject(objRef) && pObjRef !== undefined) objRef = pObjRef[0][pObjRef[1]] = { _: objRef };
		const envValue = process.env[envKey];
		if (envValue !== undefined) objRef[keys[keys.length - 1]] = envValue;
	}
	return <EnvDict>envObject;
};
