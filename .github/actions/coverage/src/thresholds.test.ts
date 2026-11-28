import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { raiseThresholds, readThresholds } from "./thresholds.ts";

const tempDirs: string[] = [];

const makeDir = async () => {
	const dir = await mkdtemp(path.join(os.tmpdir(), "coverage-thresholds-"));
	tempDirs.push(dir);
	return dir;
};

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("readThresholds", () => {
	it("returns undefined when the thresholds file does not exist", async () => {
		const dir = await makeDir();
		expect(await readThresholds(path.join(dir, "missing.json"))).toBeUndefined();
	});

	it("reads valid thresholds from JSON", async () => {
		const dir = await makeDir();
		const file = path.join(dir, "thresholds.json");
		await writeFile(file, JSON.stringify({ lines: 80, statements: 78, branches: 70, functions: 75 }));
		expect(await readThresholds(file)).toEqual({ lines: 80, statements: 78, branches: 70, functions: 75 });
	});
});

describe("raiseThresholds", () => {
	it("is a no-op when the thresholds file does not exist", async () => {
		const dir = await makeDir();
		const raised = await raiseThresholds(path.join(dir, "missing.json"), {
			lines: { covered: 9, total: 10, pct: 90 },
			statements: { covered: 9, total: 10, pct: 90 },
			branches: { covered: 9, total: 10, pct: 90 },
			functions: { covered: 9, total: 10, pct: 90 },
		});
		expect(raised).toEqual([]);
	});

	it("raises improved floors to floor(measured) - 1, preserves 2-space JSON, and stays idempotent", async () => {
		const dir = await makeDir();
		const file = path.join(dir, "thresholds.json");
		await writeFile(file, '{\n  "lines": 80,\n  "statements": 85,\n  "branches": 0,\n  "functions": 79\n}\n');

		const total = {
			lines: { covered: 839, total: 1000, pct: 83.9 },
			statements: { covered: 840, total: 1000, pct: 84.0 },
			branches: { covered: 5, total: 1000, pct: 0.5 },
			functions: { covered: 800, total: 1000, pct: 80.0 },
		};

		const first = await raiseThresholds(file, total, dir);
		expect(first).toEqual(["lines 80% -> 82% (measured 83.90%)"]);

		const written = await readFile(file, "utf8");
		expect(written).toBe('{\n  "lines": 82,\n  "statements": 85,\n  "branches": 0,\n  "functions": 79\n}\n');

		const second = await raiseThresholds(file, total, dir);
		expect(second).toEqual([]);
	});
});
