const EventEmitter = require('events')

/**
 * Indexes a large amount of entities in a single query
 * @param {Object[]} entities Array containing entities to index
 * @param {string} indexName Name of index to index entities.
 * 
 * @returns {Promise<number>} Promise that resolves time taken to index entities in ms.
 */
const bulkIndex = async (elastic, entities, indexName, refresh=false) => elastic.bulk({ 
	refresh: refresh, 
	body: entities.flatMap(entity => [{ index: { _index: indexName } }, entity]) 
})

/**
 * Queries elastic using `params`.
 * @param {*} params Query object.
 * 
 * @returns Iterator that yeilds a result until query exhausted.
 */
async function* scrollSearch(elastic, params) {
	let response = (await elastic.search(params)).body
	let nextResponse
	while (true) {
		nextResponse = elastic.scroll({
			body: {
				scroll_id: response._scroll_id
			},
			scroll: params.scroll
		}).catch(err => console.log(err.meta.body.error))
		if (!response._scroll_id) break
		if (response.hits.hits.length === 0) break
		yield response
		response = (await nextResponse).body
	}
}

/**
 * Function to recreate a elasticsearch index.
 * @param {ElasticClient} elastic Elasticsearch client
 * @param {{index: string, body: { mappings?: {}, settings?: {} }}} createParams Elastic parameters for creation of index
 * @param {{logProgress?: boolean, destoryIfExists: boolean}} [options] Options for creation
 */
const createIndex = (elastic, createParams, options) => new Promise(async (res, rej) => {
	if (!options) throw new Error(`Options required!`)
	if (!createParams) throw new Error(`Elastic parameters required! (createParams)`)
	if (!options.logProgress) options.logProgress = false
	if (options.destoryIfExists && (await elastic.indices.exists({ index: createParams.index }).catch(err => rej({ where: 'indices.exists', err }))).body) {
		if (options.logProgress) process.stdout.write(`Deleting index "${createParams.index}"...`)
		await elastic.indices.delete({ index: createParams.index }).catch(err => rej({ where: 'indices.delete', err }));
		if (options.logProgress) process.stdout.write(` Deleted!\nCreating index "${createParams.index}"...`)
		await elastic.indices.create(createParams).catch(err => rej({ where: 'indices.create', err }));
		if (options.logProgress) process.stdout.write(` Created!\n`)
	} else {
		if (options.logProgress) process.stdout.write(`Creating index "${createParams.index}"...`)
		await elastic.indices.create(createParams).catch(err => rej({ where: 'indices.create', err }));
		if (options.logProgress) process.stdout.write(` Created!\n`)
	}
	res()
})

/**
 * Returns scrollsearch results in simulated time based on when result timestamp.
 * @param {ElasticClient} elastic Elasticsearch client to use
 * @param {{ index: string, scroll: string, body: object }} query Query object to use for scroll search
 * @param {string} timestampKey Key to use for fetching timestamp from objects
 * @param {number} options.timescale Rate at which "time" progreesses
 * @returns {EventEmitter} EventEmitter which emits 'entity' events containing resulting hits
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
const stream = async (elastic, query, timestampKey, options={ timescale: 1, logProgress: false }) => {
	if (options.timescale === undefined) options.timescale = 1
	if (typeof options.timescale !== 'number') throw new Error('options.timescale must be a number!')
	if (timestampKey === undefined) throw new Error('timestampKey is undefined!')
	let timeOffset;
	let startDate;
	const entityReceiver = new EventEmitter();
	if (options.logProgress) console.log(`Beginning elastic scroll for entity streaming...`)
	for await (const result of scrollSearch(elastic, query)) {
		if (options.logProgress) console.log(`Query iteration finished, streaming ${result.hits.hits.length} entities.`)
		if (timeOffset === undefined) {
			timeOffset = (new Date()-new Date(result.hits.hits[0]._source[timestampKey]))
			startDate = Date.now()
		}
		for (entity of result.hits.hits) {
			const offsetEntityTime = new Date(entity._source[timestampKey]).getTime()+timeOffset
			while (Date.now()+((Date.now()-startDate)*options.timescale) < offsetEntityTime) {};
			// process.stdout.write(`Current Time: ${new Date(Date.now()+((Date.now()-startDate)*options.timescale)).toISOString()} <- ${options.timescale}x ${new Date().toISOString()}\nEntity  Time: ${new Date(offsetEntityTime).toISOString()} <-    ${new Date(entity._source[timestampKey]).toISOString()}\n\n`)
			entityReceiver.emit('entity', entity._source)
		}
	}
	return entityReceiver
}

module.exports = { bulkIndex, scrollSearch, createIndex, stream }