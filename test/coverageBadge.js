/**
 * Writes the shields.io endpoint badges the README links to, from the coverage run's summary.
 *
 * Run after `pnpm test:coverage`, which writes coverage/coverage-summary.json. The json files
 * under .github/badges are committed, because shields reads them over jsDelivr.
 *
 * Usage: pnpm coverage:badge
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const summaryPath = path.join(root, "coverage", "coverage-summary.json");
const badgeDir = path.join(root, ".github", "badges");

/** shields colours, highest threshold first */
const COLOUR_THRESHOLDS = [
	[90, "brightgreen"],
	[80, "green"],
	[70, "yellowgreen"],
	[60, "yellow"],
	[50, "orange"],
];

/** shields colour for a percentage, by how happy the number is */
const colourFor = (percentage) => COLOUR_THRESHOLDS.find(([minimum]) => percentage >= minimum)?.[1] ?? "red";

/** Trailing zeros off, so 70% doesn't render as "70.00%" */
const format = (percentage) => `${Number(percentage.toFixed(1))}%`;

const badge = (label, percentage) => ({
	schemaVersion: 1,
	label,
	message: format(percentage),
	color: colourFor(percentage),
});

const write = async (file, contents) => {
	await mkdir(badgeDir, { recursive: true });
	await writeFile(path.join(badgeDir, file), `${JSON.stringify(contents, null, "\t")}\n`);
	console.log(`Wrote .github/badges/${file}`);
};

let summary;
try {
	summary = JSON.parse(await readFile(summaryPath, "utf8"));
} catch {
	console.error("Could not read coverage/coverage-summary.json. Run `pnpm test:coverage` first.");
	process.exit(1);
}

await write("coverage.json", badge("coverage", summary.total.lines.pct));
// A second, stricter view: branch coverage is usually where a suite is weakest
await write("coverage-branches.json", badge("branches", summary.total.branches.pct));
