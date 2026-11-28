/**
 * A Map-like structure that uses `JSON.stringify` for its keys.
 * This allows using objects as keys, provided they can be consistently stringified.
 *
 * Note: the order of properties in an object affects its JSON string
 * representation, so keys must have a consistent property order to be found
 * again. Keys that `JSON.stringify` cannot handle (BigInt, circular structures)
 * throw when used.
 *
 * This used to extend `Map<string, V>` while overriding the key parameters with
 * `K`, which required a `@ts-expect-error` on every method and meant `keys()` and
 * `entries()` handed back JSON strings instead of the keys that were set. It now
 * holds one entry per stringified key, carrying both the original key and the
 * value, so there is a single source of truth to keep in step.
 */
export class StringifyMap<K, V> {
	private readonly _entries: Map<string, { key: K; value: V }> = new Map();

	/**
	 * Creates a new StringifyMap instance.
	 * @param entries An iterable of key-value pairs to initialize the map with. Keys will be stringified.
	 */
	constructor(entries?: readonly (readonly [K, V])[] | null) {
		if (entries) {
			for (const [key, value] of entries) this.set(key, value);
		}
	}

	private static _stringify<K>(key: K): string {
		// JSON.stringify returns undefined for undefined, functions and symbols.
		// Normalise to a string so it can be used as a map key.
		return JSON.stringify(key) ?? "undefined";
	}

	/** The number of key/value pairs. */
	public get size(): number {
		return this._entries.size;
	}

	/** Sets the value for the key. Returns the map. */
	public set(key: K, value: V): this {
		this._entries.set(StringifyMap._stringify(key), { key, value });
		return this;
	}

	/** Returns the value associated with the key, or undefined if there is none. */
	public get(key: K): V | undefined {
		return this._entries.get(StringifyMap._stringify(key))?.value;
	}

	/** Returns a boolean indicating whether an element with the specified key exists. */
	public has(key: K): boolean {
		return this._entries.has(StringifyMap._stringify(key));
	}

	/** Removes the specified element. Returns true if it existed. */
	public delete(key: K): boolean {
		return this._entries.delete(StringifyMap._stringify(key));
	}

	/** Removes all key/value pairs. */
	public clear(): void {
		this._entries.clear();
	}

	/** Returns the keys that were originally set. */
	public *keys(): IterableIterator<K> {
		for (const entry of this._entries.values()) yield entry.key;
	}

	/** Returns the stored values. */
	public *values(): IterableIterator<V> {
		for (const entry of this._entries.values()) yield entry.value;
	}

	/** Returns `[key, value]` pairs using the keys that were originally set. */
	public *entries(): IterableIterator<[K, V]> {
		for (const entry of this._entries.values()) yield [entry.key, entry.value];
	}

	/** Calls `callback` for each pair, passing the key that was originally set. */
	public forEach(callback: (value: V, key: K, map: this) => void, thisArg?: unknown): void {
		for (const entry of this._entries.values()) callback.call(thisArg, entry.value, entry.key, this);
	}

	/** Returns an iterator over `[key, value]` pairs. */
	public [Symbol.iterator](): IterableIterator<[K, V]> {
		return this.entries();
	}

	/** Returns a string representing the object. */
	get [Symbol.toStringTag](): string {
		return "StringifyMap";
	}
}
