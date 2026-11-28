import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

import thresholds from "./.github/coverage-thresholds.json" with { type: "json" };

/**
 * Source files import each other with explicit `.js` specifiers, which
 * `module: NodeNext` requires. Vite does not rewrite those to `.ts`, so tests
 * that import from `src` would fail to resolve. This plugin maps a relative
 * `.js` import onto the `.ts` file that actually exists on disk, letting the
 * tests run against source without a build step.
 */
const resolveTsFromJs = {
	name: "resolve-ts-from-js",
	enforce: "pre" as const,
	resolveId(source: string, importer: string | undefined) {
		if (!importer || !source.startsWith(".") || !source.endsWith(".js")) return;
		const absolute = path.resolve(path.dirname(importer), source);
		const asTs = `${absolute.slice(0, -".js".length)}.ts`;
		if (existsSync(asTs)) return asTs;
	},
};

export default defineConfig({
	plugins: [resolveTsFromJs],
	test: {
		include: ["src/**/*.test.ts", "test/**/*.test.ts", ".github/actions/**/*.test.ts"],
		environment: "node",
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			reporter: ["text", "lcov", "json-summary"],
			reportsDirectory: "coverage",
			thresholds,
		},
	},
});
