/**
 * Fetch process.env[envName] or throw if it is unusable.
 *
 * A variable that is set but blank counts as unusable: setting
 * `process.env.X = ""` used to satisfy this function and return an empty string.
 */
export const envOrThrow = (envName: string): string => {
	const envValue = process.env[envName];
	if (envValue === undefined) throw new Error(`Environment variable "${envName}" is not set`);
	if (envValue.trim() === "") throw new Error(`Environment variable "${envName}" is set but empty`);
	return envValue;
};
