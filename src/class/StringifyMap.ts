/**
 * A minimal extension of Map that utilizes JSON.stringify for its keys.
 * This allows using objects as keys, provided they can be consistently stringified.
 * Note: The order of properties in an object affects its JSON string representation.
 * Ensure keys have a consistent property order or structure for reliable lookups.
 */
export class StringifyMap<K, V> extends Map<string, V> {
	/**
	 * Creates a new StringifyMap instance.
	 * @param entries An iterable of key-value pairs to initialize the map with. Keys will be stringified.
	 */
	constructor(entries?: readonly (readonly [K, V])[] | null) {
		// Convert [K, V] pairs to [string, V] pairs before calling super constructor
		const stringifiedEntries = entries ? Array.from(entries).map(([key, value]): [string, V] => [JSON.stringify(key), value]) : null;
		super(stringifiedEntries);
	}

	/**
	 * Returns the value associated with the key, or undefined if there is none.
	 * The key is stringified before lookup.
	 */
	// @ts-expect-error TS doesnt like me extending Map<string, V> but saying we accept K. K will always be stringified so...
	get(key: K): V | undefined {
		return super.get(JSON.stringify(key));
	}

	/**
	 * Sets the value for the key in the Map object. Returns the Map object.
	 * The key is stringified before being stored.
	 */
	// @ts-expect-error TS doesnt like me extending Map<string, V> but saying we accept K. K will always be stringified so...
	set(key: K, value: V): this {
		return super.set(JSON.stringify(key), value);
	}

	/**
	 * Returns a boolean indicating whether an element with the specified key exists or not.
	 * The key is stringified before checking for existence.
	 */
	// @ts-expect-error TS doesnt like me extending Map<string, V> but saying we accept K. K will always be stringified so...
	has(key: K): boolean {
		return super.has(JSON.stringify(key));
	}

	/**
	 * Removes the specified element from a Map object by key.
	 * Returns true if an element in the Map object existed and has been removed, or false if the element does not exist.
	 * The key is stringified before attempting deletion.
	 */
	// @ts-expect-error TS doesnt like me extending Map<string, V> but saying we accept K. K will always be stringified so...
	delete(key: K): boolean {
		return super.delete(JSON.stringify(key));
	}
}
