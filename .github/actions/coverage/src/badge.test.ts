import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { badge, colourFor, testsBadge, writeBadges } from "./badge.ts";
import type { Summary } from "./report.ts";

const tempDirs: string[] = [];

const makeDir = async () => {
	const dir = await mkdtemp(path.join(os.tmpdir(), "coverage-badge-"));
	tempDirs.push(dir);
	return dir;
};

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("colourFor", () => {
	it.each([
		[90, "brightgreen"],
		[80, "green"],
		[70, "yellowgreen"],
		[60, "yellow"],
		[50, "orange"],
		[49.9, "red"],
	])("maps %s%% to %s", (pct, expected) => {
		expect(colourFor(pct)).toBe(expected);
	});
});

describe("badge", () => {
	it("formats percentages without trailing zeros", () => {
		expect(badge("coverage", 70)).toEqual({ schemaVersion: 1, label: "coverage", message: "70%", color: "yellowgreen" });
		expect(badge("branches", 83.46)).toEqual({ schemaVersion: 1, label: "branches", message: "83.5%", color: "green" });
	});
});

describe("testsBadge", () => {
	it("formats passing counts", () => {
		expect(testsBadge({ numTotalTests: 10, numPassedTests: 10 })).toEqual({
			schemaVersion: 1,
			label: "tests",
			message: "10 passing",
			color: "brightgreen",
		});
		expect(testsBadge({ numTotalTests: 10, numPassedTests: 8 })).toEqual({
			schemaVersion: 1,
			label: "tests",
			message: "8/10 passing",
			color: "brightgreen",
		});
	});
});

describe("writeBadges", () => {
	it("writes coverage, branch, and test badges", async () => {
		const dir = await makeDir();
		const summary: Summary = {
			total: {
				lines: { covered: 92, total: 100, pct: 92 },
				statements: { covered: 90, total: 100, pct: 90 },
				branches: { covered: 75, total: 100, pct: 75 },
				functions: { covered: 80, total: 100, pct: 80 },
			},
		};

		await writeBadges(dir, summary, { numTotalTests: 42, numPassedTests: 42 }, dir);

		expect(JSON.parse(await readFile(path.join(dir, "coverage.json"), "utf8"))).toEqual({
			schemaVersion: 1,
			label: "coverage",
			message: "92%",
			color: "brightgreen",
		});
		expect(JSON.parse(await readFile(path.join(dir, "coverage-branches.json"), "utf8"))).toEqual({
			schemaVersion: 1,
			label: "branches",
			message: "75%",
			color: "yellowgreen",
		});
		expect(JSON.parse(await readFile(path.join(dir, "tests.json"), "utf8"))).toEqual({
			schemaVersion: 1,
			label: "tests",
			message: "42 passing",
			color: "brightgreen",
		});
	});
});
