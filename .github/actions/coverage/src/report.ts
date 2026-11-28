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
	/** How files group into rows of the area table, from parseAreas */
	areas?: readonly AreaRule[];
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

/** `src` groups everything under it as one area, `plugins/*` makes one area per entry directly under `plugins` */
export type AreaRule = { prefix: readonly string[]; split: boolean };

/** Most specific rule first, so `plugins/lib` wins over `plugins/*` for files under it */
export const parseAreas = (input: string | undefined): AreaRule[] =>
	(input ?? "")
		.split(/[\n,]+/)
		// A leading `- ` lets the input be written as a YAML style list inside a block scalar
		.map((entry) =>
			entry
				.trim()
				.replace(/^-\s*/, "")
				.replace(/^\/+|\/+$/g, ""),
		)
		.filter(Boolean)
		.map((entry) => {
			const split = entry === "*" || entry.endsWith("/*");
			const folder = split ? entry.slice(0, -1).replace(/\/+$/, "") : entry;
			return { prefix: folder === "" ? [] : folder.split("/"), split };
		})
		.sort((a, b) => b.prefix.length - a.prefix.length || Number(b.split) - Number(a.split));

/** Files no rule matches fall back to their top-level folder, so every file lands in some area */
const areaOf = (relativePath: string, rules: readonly AreaRule[]) => {
	const parts = relativePath.split("/");
	for (const { prefix, split } of rules) {
		if (parts.length < prefix.length || !prefix.every((part, index) => parts[index] === part)) continue;
		return parts.slice(0, prefix.length + (split ? 1 : 0)).join("/");
	}
	return parts[0];
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

/** A path the run wrote itself, which starts at the filesystem root rather than at the repo */
const absolutePath = /^(\/|[A-Za-z]:[\\/])/;

/**
 * Repo relative, with `/` separators.
 *
 * A run's own summary holds absolute paths, which are stripped against `root`. A summary uploaded by an earlier run holds
 * repo relative ones, already stripped there, so stripping them again would corrupt them. Both are accepted because
 * artifacts written before that normalisation existed are still inside their retention window.
 */
const repoRelative = (file: string, root: string) => {
	const normalised = file.split(path.sep).join("/");
	return absolutePath.test(normalised) ? path.relative(root, normalised).split(path.sep).join("/") : normalised;
};

/** File entries keyed by repo relative path with `/` separators, without the `total` entry */
const byFile = (summary: Summary, root: string) => {
	const files = new Map<string, Totals>();
	for (const [file, coverage] of Object.entries(summary)) {
		if (file !== "total") files.set(repoRelative(file, root), coverage);
	}
	return files;
};

/** Per-area totals, sorted by area name */
const byArea = (summary: Summary, root: string, rules: readonly AreaRule[]) => {
	const areas = new Map<string, Totals>();
	for (const [file, coverage] of byFile(summary, root)) {
		const area = areaOf(file, rules);
		let totals = areas.get(area);
		if (totals === undefined) areas.set(area, (totals = emptyCounts()));
		for (const metric of coverageMetrics) add(totals[metric], coverage[metric]);
	}
	return new Map([...areas.entries()].sort(([a], [b]) => a.localeCompare(b)));
};

/**
 * Change in percentage points, rounded the way it is shown so a change that prints as 0 counts as none.
 *
 * Undefined when the counts cannot produce a number. Coercing that to 0, which is what `|| 0` did, rendered unreadable
 * data as "nothing changed", which is the one answer it is not.
 */
export const change = (head: Counts, base: Counts): number | undefined => {
	const delta = Number((percentage(head) - percentage(base)).toFixed(1));
	if (!Number.isFinite(delta)) return undefined;
	// A rounded negative zero would otherwise read as a change
	return Object.is(delta, -0) ? 0 : delta;
};

const isNonZeroDelta = (delta: number | undefined): delta is number => delta !== undefined && delta !== 0;

const hasTotalsChanged = (head: Totals, base: Totals) => coverageMetrics.some((metric) => isNonZeroDelta(change(head[metric], base[metric])));

/** ` +0.4%`, ` -0.2% 🔻`, or nothing when it didn't move, or could not be worked out */
const formatChange = (delta: number | undefined) => (!isNonZeroDelta(delta) ? "" : delta > 0 ? ` +${delta}%` : ` ${delta}% 🔻`);

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
		// A metric that could not be compared is not a change either, so a file is skipped only when nothing moved
		if (deltas.every((delta) => !isNonZeroDelta(delta))) continue;
		changes.push({
			file,
			kind: deltas.some((delta) => delta !== undefined && delta < 0) ? "down" : "up",
			cells: coverageMetrics.map((metric, index) => `${format(percentage(coverage[metric]))}${formatChange(deltas[index])}`),
			sortKey: deltas[0] ?? 0,
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

/**
 * Whether coverage moved against the base branch in totals, areas, or files (`undefined` deltas are not a change).
 * Without a base summary, returns true so the PR still gets the full coverage comment.
 */
export const hasCoverageChanged = (summary: Summary | undefined, base: Summary | undefined, root: string, rules: readonly AreaRule[] = []): boolean => {
	if (base === undefined) return true;
	if (summary === undefined) return false;
	if (hasTotalsChanged(summary.total, base.total)) return true;

	const areas = byArea(summary, root, rules);
	const baseAreas = byArea(base, root, rules);
	if (areas.size !== baseAreas.size) return true;
	for (const [area, totals] of areas) {
		const old = baseAreas.get(area);
		if (old === undefined || hasTotalsChanged(totals, old)) return true;
	}

	return changedFiles(summary, base, root).length > 0;
};

export const buildComment = (summary: Summary | undefined, options: CommentOptions) => {
	if (summary === undefined) {
		return ["## Coverage", "", "> [!WARNING]", `> No coverage to report: ${options.unavailableBecause ?? "the tests did not produce a coverage report"}.`].join(
			"\n",
		);
	}

	const { root, base, thresholds } = options;
	const rules = options.areas ?? [];
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

	const areas = byArea(summary, root, rules);
	const baseAreas = base ? byArea(base, root, rules) : undefined;
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
