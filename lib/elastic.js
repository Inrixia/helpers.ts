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
 * @param {{logProgress?: boolean, destoryIfExists: boolean createParams: {index: string, body: { mappings: {}, settings?: {} }}}} [options] Options for creation
 */
const createIndex = (elastic, options) => new Promise(async (res, rej) => {
	if (!options) throw new Error(`Options required!`)
	if (!options.createParams) throw new Error(`Elastic parameters required! (options.createParams)`)
	if (!options.logProgress) options.logProgress = false
	if (options.destoryIfExists && (await elastic.indices.exists({ index: options.createParams.index }).catch(err => rej({ where: 'indices.exists', err }))).body) {
		if (options.logProgress) process.stdout.write(`Deleting index "${options.createParams.index}"...`)
		await elastic.indices.delete({ index: options.createParams.index }).catch(err => rej({ where: 'indices.delete', err }));
		if (options.logProgress) process.stdout.write(` Deleted!\nCreating index "${options.createParams.index}"...`)
		await elastic.indices.create(options.createParams).catch(err => rej({ where: 'indices.create', err }));
		if (options.logProgress) process.stdout.write(` Created!\n`)
	} else {
		if (options.logProgress) process.stdout.write(`Creating index "${options.createParams.index}"...`)
		await elastic.indices.create(options.createParams).catch(err => rej({ where: 'indices.create', err }));
		if (options.logProgress) process.stdout.write(` Created!\n`)
	}
	res()
})

module.exports = { bulkIndex, scrollSearch, createIndex }