import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const coverageMetrics = ["lines", "statements", "branches", "functions"] as const;

export type CoverageMetric = (typeof coverageMetrics)[number];

export type Thresholds = Partial<Record<CoverageMetric, number>>;

type SummaryTotals = Record<CoverageMetric, { pct?: number; covered: number; total: number }>;

const headroom = 1;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const isEnoent = (error: unknown): boolean => isRecord(error) && error.code === "ENOENT";

/** Reads vitest-shaped coverage thresholds from JSON; returns undefined when missing or invalid. */
export const readThresholds = async (filePath: string): Promise<Thresholds | undefined> => {
	let raw: string;
	try {
		raw = await readFile(filePath, "utf8");
	} catch (error) {
		if (isEnoent(error)) return undefined;
		console.warn(`Could not read thresholds file ${filePath}:`, error);
		return undefined;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		console.warn(`Invalid JSON in thresholds file ${filePath}:`, error);
		return undefined;
	}

	if (!isRecord(parsed)) {
		console.warn(`Thresholds file ${filePath} must be a JSON object`);
		return undefined;
	}

	const thresholds: Thresholds = {};
	for (const metric of coverageMetrics) {
		const value = parsed[metric];
		if (value === undefined) continue;
		if (typeof value !== "number" || !Number.isFinite(value)) {
			console.warn(`Threshold "${metric}" in ${filePath} is not a finite number`);
			return undefined;
		}
		thresholds[metric] = value;
	}
	return thresholds;
};

/** Raises floors in place up to floor(measured) - 1; no-op if file does not exist or nothing improved. */
export const raiseThresholds = async (filePath: string, total: SummaryTotals, root = process.cwd()): Promise<string[]> => {
	let raw: string;
	try {
		raw = await readFile(filePath, "utf8");
	} catch (error) {
		if (isEnoent(error)) return [];
		throw new Error(`read thresholds file ${filePath}`, { cause: error });
	}

	const current: unknown = JSON.parse(raw);
	if (!isRecord(current)) {
		throw new Error(`Thresholds file ${filePath} must be a JSON object`);
	}

	const next: Record<string, unknown> = { ...current };
	const raised: string[] = [];

	for (const metric of coverageMetrics) {
		const floor = current[metric];
		if (typeof floor !== "number" || !Number.isFinite(floor)) continue;

		const entry = total[metric];
		const measured = entry.pct ?? (entry.total === 0 ? 100 : (entry.covered / entry.total) * 100);
		// Keep 1 point of headroom so minor platform/v8 variance doesn't trip the floor
		const candidate = Math.max(0, Math.floor(measured) - headroom);
		if (candidate <= floor) continue;

		raised.push(`${metric} ${floor}% -> ${candidate}% (measured ${measured.toFixed(2)}%)`);
		next[metric] = candidate;
	}

	if (raised.length > 0) {
		await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`);
		console.log(`Raised the floors in ${path.relative(root, filePath) || filePath}:`);
		for (const line of raised) console.log(`  ${line}`);
	} else {
		console.log("Coverage has not moved above the floors, nothing to raise");
	}

	return raised;
};
