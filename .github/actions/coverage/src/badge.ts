/**
 * Writes the shields.io endpoint badges from vitest's coverage-summary.json and test-results.json.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { percentage, type Summary } from "./report.ts";

export type BadgeJson = {
	schemaVersion: 1;
	label: string;
	message: string;
	color: string;
};

export type TestResults = {
	success?: boolean;
	numTotalTests?: number;
	numPassedTests?: number;
};

/** shields colours, by how happy the number is */
export const colourFor = (pct: number): string =>
	pct >= 90
		? "brightgreen"
		: pct >= 80
			? "green"
			: pct >= 70
				? "yellowgreen"
				: pct >= 60
					? "yellow"
					: pct >= 50
						? "orange"
						: "red";

/** Trailing zeros off, so 70% doesn't render as "70.00%" */
const format = (pct: number) => `${Number(pct.toFixed(1))}%`;

export const badge = (label: string, pct: number): BadgeJson => ({
	schemaVersion: 1,
	label,
	message: format(pct),
	color: colourFor(pct),
});

export const testsBadge = (results: TestResults): BadgeJson | undefined => {
	if (typeof results.numPassedTests !== "number") return undefined;
	const suffix =
		typeof results.numTotalTests === "number" && results.numTotalTests !== results.numPassedTests
			? `/${results.numTotalTests}`
			: "";
	return {
		schemaVersion: 1,
		label: "tests",
		message: `${results.numPassedTests}${suffix} passing`,
		color: "brightgreen",
	};
};

export const writeBadges = async (
	badgeDir: string,
	summary: Summary,
	testResults: TestResults | undefined,
	root = process.cwd(),
): Promise<void> => {
	const write = async (file: string, contents: BadgeJson) => {
		await mkdir(badgeDir, { recursive: true });
		const target = path.join(badgeDir, file);
		await writeFile(target, `${JSON.stringify(contents, null, "\t")}\n`);
		console.log(`Wrote ${path.relative(root, target) || target}`);
	};

	const linesPct = summary.total.lines.pct ?? percentage(summary.total.lines);
	const branchesPct = summary.total.branches.pct ?? percentage(summary.total.branches);

	await write("coverage.json", badge("coverage", linesPct));
	// A second, stricter view: branch coverage is where a suite is usually weakest
	await write("coverage-branches.json", badge("branches", branchesPct));

	if (testResults) {
		const tests = testsBadge(testResults);
		if (tests) await write("tests.json", tests);
	}
};
