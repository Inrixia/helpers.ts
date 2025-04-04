export const runFor = async (fn: () => true | undefined, timeoutMs: number) => {
	const expires = Date.now() + timeoutMs;
	while (true) {
		if (fn()) return;
		if (Date.now() > expires) return;
		await new Promise((res) => setTimeout(res));
	}
};
