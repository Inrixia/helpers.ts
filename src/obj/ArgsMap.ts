/**
 * A Map implementation using an array of arguments (`any[]`) as its key.
 * Uses a nested Map structure, allowing keys with any JavaScript value.
 * Performance is typically proportional to the number of arguments in the key.
 *
 * @template K - The type of the key (array of any).
 * @template V - The type of the value.
 */
export class ArgsMap<K extends any[], V> {
	// Removed: implements Map<K, V>
	private readonly root: Map<any, any> = new Map();
	private _size: number = 0;
	// Special symbol to mark the node holding the actual value for a key array.
	private static readonly END_MARKER: unique symbol = Symbol("ArgsMap.end");

	/** Returns the number of key/value pairs in the ArgsMap object. */
	public get size(): number {
		return this._size;
	}

	/** Sets the value for the key in the ArgsMap object. Returns the value. */
	public setReturnValue(key: K, value: V): V {
		this.set(key, value);
		return value;
	}

	/** Sets the value for the key in the ArgsMap object. Returns the ArgsMap object. */
	public set(key: K, value: V): this {
		let currentMap = this.root;
		for (const arg of key) {
			let nextNode = currentMap.get(arg);
			// Ensure nextNode is a Map, creating or overwriting if necessary.
			if (!(nextNode instanceof Map)) currentMap.set(arg, (nextNode = new Map<any, any>()));
			currentMap = nextNode;
		}

		// Increment size only if this key path is new.
		if (!currentMap.has(ArgsMap.END_MARKER)) this._size++;
		currentMap.set(ArgsMap.END_MARKER, value);
		return this;
	}

	/** Returns the value associated with the key, or undefined if there is none. */
	public get(key: K): V | undefined {
		let currentMap = this.root;
		for (const arg of key) {
			const nextNode = currentMap.get(arg);
			if (!(nextNode instanceof Map)) return undefined; // Path doesn't exist
			currentMap = nextNode;
		}
		return currentMap.get(ArgsMap.END_MARKER);
	}

	/** Returns a boolean indicating whether an element with the specified key exists or not. */
	public has(key: K): boolean {
		let currentMap = this.root;
		for (const arg of key) {
			const nextNode = currentMap.get(arg);
			if (!(nextNode instanceof Map)) return false;
			currentMap = nextNode;
		}
		return currentMap.has(ArgsMap.END_MARKER);
	}

	/** Returns true if an element in the ArgsMap object existed and has been removed, or false if the element does not exist. */
	public delete(key: K): boolean {
		const { deleted } = this._deleteRecursive(this.root, key, 0);
		if (deleted) this._size--;
		return deleted;
	}

	/** Recursive helper for delete, cleaning up empty parent maps. */
	private _deleteRecursive(currentMap: Map<any, any>, key: K, index: number): { deleted: boolean; nodeIsEmpty: boolean } {
		if (index === key.length) {
			const deleted = currentMap.delete(ArgsMap.END_MARKER);
			return { deleted, nodeIsEmpty: currentMap.size === 0 };
		}

		const arg = key[index];
		const nextNode = currentMap.get(arg);

		// Key path not found
		if (!(nextNode instanceof Map)) return { deleted: false, nodeIsEmpty: false };

		const result = this._deleteRecursive(nextNode, key, index + 1);
		// If deletion occurred and the child map became empty, remove it.
		if (result.deleted && result.nodeIsEmpty) currentMap.delete(arg);

		return { deleted: result.deleted, nodeIsEmpty: currentMap.size === 0 };
	}

	/** Removes all key/value pairs from the ArgsMap object. */
	public clear(): void {
		this.root.clear();
		this._size = 0;
	}

	/** Returns a new Iterator object that contains the [key, value] pairs for each element in the ArgsMap object in insertion order. */
	public *entries(): IterableIterator<[K, V]> {
		yield* this._traverseEntries([] as any, this.root);
	}

	/** Recursive helper for depth-first entry iteration. */
	private *_traverseEntries(currentPath: K, node: Map<any, any>): IterableIterator<[K, V]> {
		if (node.has(ArgsMap.END_MARKER)) yield [currentPath, node.get(ArgsMap.END_MARKER)];

		for (const [keyPart, nextNode] of node.entries()) {
			if (keyPart !== ArgsMap.END_MARKER && nextNode instanceof Map) {
				// Recurse with a *new* path array to avoid mutation issues.
				yield* this._traverseEntries([...currentPath, keyPart] as K, nextNode);
			}
		}
	}

	/** Returns a new Iterator object that contains the [key, value] pairs for each element in the ArgsMap object in insertion order. */
	public [Symbol.iterator](): IterableIterator<[K, V]> {
		return this.entries();
	}

	/** Returns a string representing the object. */
	get [Symbol.toStringTag](): string {
		return "ArgsMap";
	}
}
