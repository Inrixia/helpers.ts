import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readRepoFile = (file: string): string => readFileSync(path.join(packageRoot, file), "utf8");
const pkg = JSON.parse(readRepoFile("package.json")) as {
	scripts: Record<string, string>;
	devDependencies: Record<string, string>;
};

describe("lint tooling", () => {
	// .eslintrc.json was committed but eslint, the TypeScript parser and prettier
	// were never in devDependencies, so none of it could run.
	it("declares the tooling as dev dependencies", () => {
		expect(pkg.devDependencies).toHaveProperty("eslint");
		expect(pkg.devDependencies).toHaveProperty("typescript-eslint");
		expect(pkg.devDependencies).toHaveProperty("prettier");
		expect(pkg.devDependencies).toHaveProperty("eslint-config-prettier");
	});

	it("exposes lint and format scripts", () => {
		expect(pkg.scripts.lint).toBe("eslint .");
		expect(pkg.scripts["lint:fix"]).toBe("eslint . --fix");
		expect(pkg.scripts.format).toContain("prettier --write");
	});

	it("uses a flat config, which is what ESLint 9+ expects", () => {
		expect(existsSync(path.join(packageRoot, "eslint.config.js"))).toBe(true);
	});

	it("no longer ships the legacy eslintrc", () => {
		expect(existsSync(path.join(packageRoot, ".eslintrc.json"))).toBe(false);
	});

	it("keeps prettier and eslint from fighting each other", () => {
		// eslint-config-prettier must be applied last; if it is imported and
		// applied, the config file references it.
		expect(readRepoFile("eslint.config.js")).toContain("eslint-config-prettier");
	});
});
