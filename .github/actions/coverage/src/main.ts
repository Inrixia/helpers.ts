/**
 * CLI entrypoint for the shared coverage composite action.
 *
 * Subcommands:
 *   report  - writes coverage/comment.md (or coverage/unchanged on PRs with no change), appends to GITHUB_STEP_SUMMARY, emits publish=true|false
 *   publish - writes shields endpoint badges and raises floors in thresholds-file
 */
import { appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { writeBadges, type TestResults } from "./badge.ts";
import { buildComment, hasCoverageChanged, isSummary, missed, parseExtraAreas } from "./report.ts";
import { raiseThresholds, readThresholds } from "./thresholds.ts";

const readJson = async (file: string): Promise<unknown> => {
	try {
		return JSON.parse(await readFile(file, "utf8"));
	} catch {
		return undefined;
	}
};

const isTestSuccess = (value: unknown): value is TestResults => typeof value === "object" && value !== null && (value as TestResults).success === true;

const root = process.cwd();
const summaryPath = path.resolve(root, process.env.COVERAGE_SUMMARY || "coverage/coverage-summary.json");
const testResultsPath = path.resolve(root, process.env.COVERAGE_TEST_RESULTS || "coverage/test-results.json");
const baseSummaryPath = path.resolve(root, process.env.COVERAGE_BASE_SUMMARY || "coverage/base/coverage-summary.json");
const commentPath = path.resolve(root, "coverage", "comment.md");
const unchangedPath = path.resolve(root, "coverage", "unchanged");
const thresholdsPath = path.resolve(root, process.env.COVERAGE_THRESHOLDS_FILE || ".github/coverage-thresholds.json");
const badgesDir = path.resolve(root, process.env.COVERAGE_BADGES_DIR || ".github/badges");
const extraAreas = parseExtraAreas(process.env.COVERAGE_EXTRA_AREAS);

const command = process.argv[2];

if (command === "report") {
	const parsed = await readJson(summaryPath);
	const summary = isSummary(parsed) ? parsed : undefined;
	const unavailableBecause =
		parsed === undefined
			? `${path.relative(root, summaryPath)} was not written (the test step failed before coverage)`
			: `${path.relative(root, summaryPath)} is not a coverage summary`;

	const parsedBase = await readJson(baseSummaryPath);
	const base = isSummary(parsedBase) ? parsedBase : undefined;
	if (parsedBase !== undefined && base === undefined) {
		console.warn(`${path.relative(root, baseSummaryPath)} is not a coverage summary, reporting without a change`);
	}

	const thresholds = await readThresholds(thresholdsPath);
	const comment = buildComment(summary, {
		root,
		unavailableBecause,
		base,
		baseRef: process.env.COVERAGE_BASE_REF || undefined,
		baseSha: process.env.COVERAGE_BASE_SHA || undefined,
		extraAreas,
		thresholds,
	});

	const isPush = process.env.GITHUB_EVENT_NAME === "push";
	const shouldWriteComment = isPush || hasCoverageChanged(summary, base, root, extraAreas);

	await mkdir(path.dirname(commentPath), { recursive: true });
	if (shouldWriteComment) {
		await rm(unchangedPath, { force: true });
		await writeFile(commentPath, `${comment}\n`);
		console.log(`Wrote ${path.relative(root, commentPath)}`);
	} else {
		await rm(commentPath, { force: true });
		// Empty marker so the comment workflow can tell "unchanged, delete sticky comment" apart from "nothing ran"
		await writeFile(unchangedPath, "");
		const reason = summary === undefined ? "no valid coverage summary" : "coverage did not change against base";
		console.log(`Skipped ${path.relative(root, commentPath)}: ${reason}`);
	}

	const stepSummary = process.env.GITHUB_STEP_SUMMARY;
	if (stepSummary) await appendFile(stepSummary, `${comment.trim()}\n`);

	const failures = summary ? missed(summary.total, thresholds) : [];
	if (failures.length !== 0) {
		// Reporting only: vitest already fails the test step when coverage misses the thresholds
		console.warn(`Coverage is below the floors: ${failures.join(", ")}`);
	}

	const testResults = await readJson(testResultsPath);
	const canPublish = process.env.GITHUB_EVENT_NAME === "push" && summary !== undefined && isTestSuccess(testResults) && failures.length === 0;

	console.log(`publish=${canPublish}`);
	const githubOutput = process.env.GITHUB_OUTPUT;
	if (githubOutput) await appendFile(githubOutput, `publish=${canPublish}\n`);
} else if (command === "publish") {
	const parsed = await readJson(summaryPath);
	if (!isSummary(parsed)) {
		console.error(`Could not read valid coverage summary at ${path.relative(root, summaryPath)}`);
		process.exitCode = 1;
	} else {
		const rawResults = await readJson(testResultsPath);
		const testResults = typeof rawResults === "object" && rawResults !== null ? (rawResults as TestResults) : undefined;
		await writeBadges(badgesDir, parsed, testResults, root);
		await raiseThresholds(thresholdsPath, parsed.total, root);
	}
} else {
	console.error("Usage: node src/main.ts <report|publish>");
	process.exitCode = 1;
}
