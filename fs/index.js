const fs = require('fs');

/**
 * Async wrapper for reading files.
 * @param {string|number|Buffer|URL} path A path to a file. If a URL is provided, it must use the `file: `protocol. If a file descriptor is provided, the underlying file will not be closed automatically.
 * @param {{ encoding?: null, flag?: string }} options An object that may contain an optional flag. If a flag is not provided, it defaults to `'r'`
 * @return {Promise<Buffer|NodeJS.ErrnoException>}
 */
const readFileAsync = (path, options) => new Promise((res, rej) => fs.readFile(path, options, (err, data) => err?rej(err):res(data)))

module.exports = { readFileAsync }