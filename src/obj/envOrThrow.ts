/**
 * Fetch process.env[envName] or throw if its undefined
 */
export const envOrThrow = (envName: string): string => {
	const envValue = process.env[envName];
	if (envValue === undefined) throw new Error(`Enviroment variable "${envName}" is undefined!`);
	return envValue;
};
