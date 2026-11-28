import { isObject } from "../ts/isTypeOf.js";
import { UnknownRecord } from "../ts/types.js";

/**
 * Replaces values in a given `templatestring` with contentKeys from a given `contentKeys` object.
 * @param contentKeys Object containing key value pairs of contentKeys to fill template string with
 * @param templatestring string containing templates to fill
 * @example
 * const contentKeys = {
 * 	"title": "This is a title",
 *  "info": {
 *   "desc": "This is some info!"
 *  }
 * }
 * const template = "Wow! {title}... Here is some info: {info.desc}"
 *
 * fillTemplate(contentKeys, template) // => Wow! This is a title... Here is some info: This is some info!"
 */

export const fillTemplate = (contentKeys: UnknownRecord, templatestring: string, parent = ""): string => {
	for (const key of Object.keys(contentKeys)) {
		const value = contentKeys[key];
		if (isObject(value)) templatestring = fillTemplate(value, templatestring, `${parent}${key}.`);
		// A literal search string instead of a RegExp, so a key containing regex
		// metacharacters can't throw or over-match. The replacer is a function so
		// replacement patterns in the value ($$, $&, $1, $`) stay literal.
		else templatestring = templatestring.replaceAll(`{${parent}${key}}`, () => String(value));
	}
	return templatestring;
};
