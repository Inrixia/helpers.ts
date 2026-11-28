/**
 * Builds the coverage comment text from a coverage-summary.json, and, when given the base branch's summary, how each
 * number changed against it. Pure, so it can be tested; main.ts does the file and env work.
 */
import path from "node:path";

import { coverageMetrics, type CoverageMetric, type Thresholds } from "./thresholds.ts";

export type Counts = { covered: number; total: number; pct?: number };
export type Totals = Record<CoverageMetric, Counts>;
export type Summary = Record<string, Totals>;

export type CommentOptions = {
	/** Folder the summary's absolute paths are made relative to */
	root: string;
	/** Why there is no summary, when there is none */
	unavailableBecause?: string;
	/** The base branch's summary, to show what changed against it */
	base?: Summary;
	/** Base branch name, set on pull request runs */
	baseRef?: string;
	/** Commit the base summary was measured on */
	baseSha?: string;
	/** Top-level folders whose files group one level deeper in the area table */
	areas?: ReadonlySet<string>;
	/** Coverage floors from thresholds-file, if configured */
	thresholds?: Thresholds;
};

/** Whether a parsed file is the summary vitest wrote, rather than anything else that happened to parse */
export const isSummary = (value: unknown): value is Summary => {
	const total = (value as Summary | undefined)?.total;
	return total !== undefined && coverageMetrics.every((metric) => typeof total[metric]?.covered === "number");
};

/** How many changed files the comment lists before cutting off */
export const maxFileRows = 20;

export const parseAreas = (input: string | undefined): Set<string> =>
	new Set(
		(input ?? "")
			.split(/[\n,]+/)
			.map((entry) => entry.trim().replace(/^\/+|\/+$/g, ""))
			.filter(Boolean),
	);

const areaOf = (relativePath: string, deepAreas: ReadonlySet<string>) => {
	const parts = relativePath.split("/");
	return deepAreas.has(parts[0]) && parts[1] !== undefined ? `${parts[0]}/${parts[1]}` : parts[0];
};

export const percentage = (counts: Counts) => (counts.total === 0 ? 100 : (counts.covered / counts.total) * 100);
const format = (pct: number) => `${Number(pct.toFixed(1))}%`;

const add = (target: Counts, counts: Counts) => {
	target.covered += counts.covered;
	target.total += counts.total;
};

const emptyCounts = (): Totals => ({
	lines: { covered: 0, total: 0 },
	statements: { covered: 0, total: 0 },
	branches: { covered: 0, total: 0 },
	functions: { covered: 0, total: 0 },
});

/** File entries keyed by repo relative path with `/` separators, without the `total` entry */
const byFile = (summary: Summary, root: string) => {
	const files = new Map<string, Totals>();
	for (const [file, coverage] of Object.entries(summary)) {
		if (file !== "total") files.set(path.relative(root, file).split(path.sep).join("/"), coverage);
	}
	return files;
};

/** Per-area totals, sorted by area name */
const byArea = (summary: Summary, root: string, deepAreas: ReadonlySet<string>) => {
	const areas = new Map<string, Totals>();
	for (const [file, coverage] of byFile(summary, root)) {
		const area = areaOf(file, deepAreas);
		let totals = areas.get(area);
		if (totals === undefined) areas.set(area, (totals = emptyCounts()));
		for (const metric of coverageMetrics) add(totals[metric], coverage[metric]);
	}
	return new Map([...areas.entries()].sort(([a], [b]) => a.localeCompare(b)));
};

/** Change in percentage points, rounded the way it is shown so a change that prints as 0 counts as none */
const change = (head: Counts, base: Counts) => Number((percentage(head) - percentage(base)).toFixed(1)) || 0;

/** ` +0.4%`, ` -0.2% 🔻`, or nothing when it didn't move */
const formatChange = (delta: number) => (delta > 0 ? ` +${delta}%` : delta < 0 ? ` ${delta}% 🔻` : "");

/**
 * Cell text comes from file paths, which a pull request author controls. Escape what would end the cell or start markup,
 * so a path can't break out of the table or add anything to a comment posted with a write token.
 */
const escapeCell = (text: string) => text.replace(/\|/g, "\\|").replace(/[`<>]/g, (character) => `\\${character}`);

const row = (label: string, cells: string[]) => `| ${label} | ${cells.join(" | ")} |`;

const header = (first: string) =>
	`| ${first} | ${coverageMetrics.map((metric) => metric[0].toUpperCase() + metric.slice(1)).join(" | ")} |\n| --- | ${coverageMetrics.map(() => "--:").join(" | ")} |`;

const areaCells = (totals: Totals, base?: Totals) =>
	coverageMetrics.map(
		(metric) =>
			`${format(percentage(totals[metric]))} (${totals[metric].covered}/${totals[metric].total})${base ? formatChange(change(totals[metric], base[metric])) : ""}`,
	);

const removedCells = () => coverageMetrics.map((_, index) => (index === 0 ? "removed" : ""));

/** The metrics that missed their floor, e.g. `branches 67.5% (floor 70%)` */
export const missed = (totals: Totals, thresholds: Thresholds | undefined) => {
	if (!thresholds) return [];
	return coverageMetrics
		.filter((metric) => {
			const floor = thresholds[metric];
			return floor !== undefined && percentage(totals[metric]) < floor;
		})
		.map((metric) => `${metric} ${format(percentage(totals[metric]))} (floor ${thresholds[metric]}%)`);
};

type FileChange = { file: string; kind: "down" | "up" | "new" | "removed"; cells: string[]; sortKey: number };

/** Files whose coverage moved against the base, drops first (biggest lines drop first), then new, then up, then removed */
const changedFiles = (summary: Summary, base: Summary, root: string) => {
	const head = byFile(summary, root);
	const before = byFile(base, root);
	const changes: FileChange[] = [];
	for (const [file, coverage] of head) {
		const old = before.get(file);
		if (old === undefined) {
			changes.push({
				file,
				kind: "new",
				cells: coverageMetrics.map((metric) => format(percentage(coverage[metric]))),
				sortKey: percentage(coverage.lines),
			});
			continue;
		}
		const deltas = coverageMetrics.map((metric) => change(coverage[metric], old[metric]));
		if (deltas.every((delta) => delta === 0)) continue;
		changes.push({
			file,
			kind: deltas.some((delta) => delta < 0) ? "down" : "up",
			cells: coverageMetrics.map((metric, index) => `${format(percentage(coverage[metric]))}${formatChange(deltas[index])}`),
			sortKey: deltas[0],
		});
	}
	for (const file of before.keys()) {
		if (!head.has(file)) changes.push({ file, kind: "removed", cells: removedCells(), sortKey: 0 });
	}
	const order = { down: 0, new: 1, up: 2, removed: 3 };
	return changes.sort(
		(a, b) =>
			order[a.kind] - order[b.kind] ||
			// up sorts by biggest gain, the rest by smallest number first
			(a.kind === "up" ? b.sortKey - a.sortKey : a.sortKey - b.sortKey) ||
			a.file.localeCompare(b.file),
	);
};

const fileSection = (changes: FileChange[]) => {
	if (changes.length === 0) return [];
	const counts = (["down", "up", "new", "removed"] as const)
		.map((kind) => [kind, changes.filter((item) => item.kind === kind).length] as const)
		.filter(([, count]) => count !== 0)
		.map(([kind, count]) => `${count} ${kind}`)
		.join(", ");
	const shown = changes.slice(0, maxFileRows);
	const lines = [
		// Open when coverage dropped somewhere, that is the part worth reading
		`<details${changes.some((item) => item.kind === "down") ? " open" : ""}><summary>Files with changed coverage: ${counts}</summary>`,
		"",
		header("File"),
		...shown.map((item) => row(`${escapeCell(item.file)}${item.kind === "new" ? " (new)" : ""}`, item.cells)),
	];
	if (changes.length > shown.length) lines.push("", `…and ${changes.length - shown.length} more`);
	lines.push("", "</details>", "");
	return lines;
};

export const buildComment = (summary: Summary | undefined, options: CommentOptions) => {
	if (summary === undefined) {
		return [
			"## Coverage",
			"",
			"> [!WARNING]",
			`> No coverage to report: ${options.unavailableBecause ?? "the tests did not produce a coverage report"}.`,
		].join("\n");
	}

	const { root, base, thresholds } = options;
	const deepAreas = options.areas ?? new Set<string>();
	const total = summary.total;
	const totalChange = (metric: CoverageMetric) => (base ? formatChange(change(total[metric], base.total[metric])) : "");
	const failures = missed(total, thresholds);
	const lines = [
		"## Coverage",
		"",
		`**${format(percentage(total.lines))} lines**${totalChange("lines")} · ${coverageMetrics
			.filter((metric) => metric !== "lines")
			.map((metric) => `${format(percentage(total[metric]))} ${metric}${totalChange(metric)}`)
			.join(" · ")}`,
		"",
	];

	if (failures.length !== 0) {
		lines.push("> [!WARNING]", `> Below the configured floors: ${failures.join(", ")}.`, "");
	}

	const areas = byArea(summary, root, deepAreas);
	const baseAreas = base ? byArea(base, root, deepAreas) : undefined;
	lines.push(header("Area"), row("**All**", areaCells(total, base?.total)));
	for (const [area, totals] of areas) {
		const old = baseAreas?.get(area);
		lines.push(row(`${escapeCell(area)}${baseAreas && old === undefined ? " (new)" : ""}`, areaCells(totals, old)));
	}
	for (const area of baseAreas?.keys() ?? []) {
		if (!areas.has(area)) lines.push(row(escapeCell(area), removedCells()));
	}
	lines.push("");

	if (base) lines.push(...fileSection(changedFiles(summary, base, root)));

	const footerParts: string[] = [];
	if (thresholds) {
		const floors = coverageMetrics
			.filter((metric) => thresholds[metric] !== undefined)
			.map((metric) => `${metric} ${thresholds[metric]}%`)
			.join(", ");
		if (floors) footerParts.push(`Floors: ${floors}.`);
	}
	const baseName = escapeCell(`${options.baseRef ?? "base"}${options.baseSha ? ` @ ${options.baseSha.slice(0, 7)}` : ""}`);
	if (base) footerParts.push(`Compared with ${baseName}.`);
	else if (options.baseRef) footerParts.push(`No coverage from ${escapeCell(options.baseRef)} to compare against.`);
	footerParts.push("Report: the run's coverage artifact.");

	lines.push(`<sub>${footerParts.join(" ")}</sub>`);
	return lines.join("\n");
};
