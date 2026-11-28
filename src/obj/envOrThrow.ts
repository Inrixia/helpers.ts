/**
 * Fetch process.env[envName] or throw if it is unusable.
 *
 * A variable that is set but blank counts as unusable: setting
 * `process.env.X = ""` used to satisfy this function and return an empty string.
 *
 * @param allowEmpty Accept a set-but-blank value instead of throwing. Only an unset variable throws.
 */
export const envOrThrow = (envName: string, allowEmpty = false): string => {
	const envValue = process.env[envName];
	if (envValue === undefined) throw new Error(`Environment variable "${envName}" is not set`);
	if (!allowEmpty && envValue.trim() === "") throw new Error(`Environment variable "${envName}" is set but empty`);
	return envValue;
};
