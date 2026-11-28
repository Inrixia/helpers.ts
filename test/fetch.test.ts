import { describe, expect, it } from "vitest";
import { rejectNotOk, statusOK, toJson, toText } from "../src/fn/fetch.js";

describe("statusOK", () => {
	it("accepts 2xx statuses", () => {
		for (const status of [200, 201, 204, 299]) expect(statusOK(status)).toBe(true);
	});

	it("rejects statuses outside 2xx", () => {
		for (const status of [0, 100, 199, 300, 404, 500, 599]) expect(statusOK(status)).toBe(false);
	});

	it("rejects non-integer and non-finite statuses", () => {
		expect(statusOK(Number.NaN)).toBe(false);
		expect(statusOK(200.5)).toBe(false);
		expect(statusOK(Number.POSITIVE_INFINITY)).toBe(false);
	});

	// The parameter is typed number, so `status !== undefined` could never be
	// false, and a string at runtime got through via numeric coercion.
	it("rejects a string status", () => {
		expect(statusOK("200" as unknown as number)).toBe(false);
		expect(statusOK(undefined as unknown as number)).toBe(false);
	});
});

describe("rejectNotOk", () => {
	const fakeResponse = (status: number, statusText = "TEXT", url = "https://example.test/x") => ({ status, statusText, url }) as Response;

	it("returns the response for a 2xx status", () => {
		const response = fakeResponse(200);
		expect(rejectNotOk(response)).toBe(response);
	});

	it("throws for a non-2xx status", () => {
		expect(() => rejectNotOk(fakeResponse(404, "Not Found"))).toThrow(/404 Not Found/);
	});

	it("puts the url on the error cause", () => {
		try {
			rejectNotOk(fakeResponse(500, "Server Error", "https://example.test/thing"));
			expect.unreachable();
		} catch (error) {
			expect((error as Error).cause).toBe("https://example.test/thing");
		}
	});
});

describe("response body helpers", () => {
	it("delegates to the matching method", async () => {
		await expect(toJson({ json: () => Promise.resolve({ a: 1 }) })).resolves.toEqual({ a: 1 });
		await expect(toText({ text: () => Promise.resolve("body") })).resolves.toBe("body");
	});
});
