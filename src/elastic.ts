import type { Client, SearchParams, SearchResponse, IndicesCreateParams } from "elasticsearch";
import type { UnknownRecord } from "./ts.js";

import { EventEmitter } from "events";

/**
 * Indexes a large amount of entities in a single query
 * @param entities Array containing entities to index
 * @param indexName Name of index to index entities.
 *
 * @returns Promise that resolves time taken to index entities in ms.
 */
export const bulkIndex = async (elastic: Client, entities: UnknownRecord[], indexName: string, refresh = false): Promise<number> =>
	elastic.bulk({
		refresh: refresh,
		body: entities.flatMap((entity) => [{ index: { _index: indexName } }, entity]),
	});

/**
 * Queries elastic using `params`.
 * @param params Query object.
 *
 * @returns Iterator that yeilds a result until query exhausted.
 */
export async function* scrollSearch(elastic: Client, params: SearchParams): AsyncGenerator<SearchResponse<unknown>> {
	if (params.scroll === undefined) throw new Error("params.scroll is required!");
	let response = await elastic.search(params);
	let nextResponse;
	while (true) {
		nextResponse = elastic.scroll({
			scrollId: response._scroll_id!,
			scroll: params.scroll,
		});
		if (!response._scroll_id) break;
		if (response.hits.hits.length === 0) break;
		yield response;
		response = await nextResponse;
	}
}

/**
 * Function to recreate a elasticsearch index.
 * @param elastic Elasticsearch client
 * @param createParams Elastic parameters for creation of index
 * @param options Options for creation
 */
export const createIndex = async (
	elastic: Client,
	createParams: IndicesCreateParams,
	options: { logProgress?: boolean; destoryIfExists: boolean }
): Promise<void> => {
	if (!options) throw new Error("Options required!");
	if (!createParams) throw new Error("Elastic parameters required! (createParams)");
	if (!options.logProgress) options.logProgress = false;
	if (options.destoryIfExists) {
		try {
			await elastic.indices.exists({ index: createParams.index });
		} catch (err) {
			if (err instanceof Error) err.message = "Failed to check if old index exists!\n" + err.message;
			throw err;
		}
		if (options.logProgress) process.stdout.write(`Deleting index "${createParams.index}"...`);
		try {
			await elastic.indices.delete({ index: createParams.index });
		} catch (err) {
			if (err instanceof Error) err.message = "Failed to delete old index!\n" + err.message;
			throw err;
		}
		if (options.logProgress) process.stdout.write(` Deleted!\nCreating index "${createParams.index}"...`);
		try {
			await elastic.indices.create(createParams);
		} catch (err) {
			if (err instanceof Error) err.message = "Failed to create new index!\n" + err.message;
			throw err;
		}
		if (options.logProgress) process.stdout.write(" Created!\n");
	} else {
		if (options.logProgress) process.stdout.write(`Creating index "${createParams.index}"...`);
		try {
			await elastic.indices.create(createParams);
		} catch (err) {
			if (err instanceof Error) err.message = "Failed to create new index!\n" + err.message;
			throw err;
		}
		if (options.logProgress) process.stdout.write(" Created!\n");
	}
};

/**
 * Returns scrollsearch results in simulated time based on when result timestamp.
 * @param elastic Elasticsearch client to use
 * @param query Query object to use for scroll search
 * @param timestampKey Key to use for fetching timestamp from objects
 * @param options.timescale Rate at which "time" progreesses
 * @returns EventEmitter which emits 'entity' events containing resulting hits
 * @example
 * 	const elasticClient = new ElasticClient({ node: 'http://127.0.0.1:9200' })
 * 	const timestamp = "reportedTime"
 * 	const query = {
 * 		index: "documents_index",
 * 		scroll: '10m',
 * 		body: {
 * 			"query": { "match_all": {} },
 * 			"sort": [{ [timestamp]: {"order": "asc"} }],
 * 			"size": 10000
 * 		}
 * 	}
 * 	stream(elasticClient, query, timestamp, 2).on('entity', console.log) // <- Emitted results based on time moving at 2x normal speed
 */
export const stream = (
	elastic: Client,
	query: SearchParams,
	timestampKey: string,
	options: { timescale: number; logProgress: boolean } = { timescale: 1, logProgress: false }
): EventEmitter => {
	const entityReceiver = new EventEmitter();
	(async () => {
		if (options.timescale === undefined) options.timescale = 1;
		if (typeof options.timescale !== "number") throw new Error("options.timescale must be a number!");
		if (timestampKey === undefined) throw new Error("timestampKey is undefined!");
		let timeOffset: number | undefined;
		let startDate = Date.now();

		if (options.logProgress) console.log("Beginning elastic scroll for entity streaming...");
		for await (const result of scrollSearch(elastic, query) as AsyncGenerator<SearchResponse<{ [timestampKey: string]: number }>>) {
			if (options.logProgress) console.log(`Query iteration finished, streaming ${result.hits.hits.length} entities.`);
			if (timeOffset === undefined) {
				timeOffset = Date.now() - new Date(result.hits.hits[0]._source[timestampKey]).getTime();
				startDate = Date.now();
			}
			for (const entity of result.hits.hits) {
				const offsetEntityTime = new Date(entity._source[timestampKey]).getTime() + timeOffset;
				while (Date.now() + (Date.now() - startDate) * options.timescale < offsetEntityTime) {
					// Spin while waiting to emit next entity
				}
				entityReceiver.emit("entity", entity._source);
			}
		}
	})();
	return entityReceiver;
};
