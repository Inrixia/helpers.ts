import { dequal } from "dequal";

/**
 * A Map that uses deep equality to check for key existence.
 * Important if you want to distinguish between objects that serialization does not differentiate.
 *
 * Note performance potentially degrades when the number of entries increases
 * as it has to iterate through all keys if the key isnt immediately in the underlying map.
 */
export class DequalMap<K extends object, V> extends Map<K, V> {
	constructor(entries?: ReadonlyArray<readonly [K, V]> | null) {
		super();
		if (entries) {
			for (const [key, value] of entries) this.set(key, value);
		}
	}

	public findKey(key: K): K | undefined {
		if (super.has(key)) return key;
		// Iterate the map's own keys. A separate Set of keys used to be kept
		// alongside the map purely so it could be iterated here, which duplicated
		// what Map already stores and had to be updated in set/delete/clear.
		for (const storedKey of super.keys()) {
			if (dequal(storedKey, key)) return storedKey;
		}
		return undefined;
	}

	override set(key: K, value: V): this {
		const _key = this.findKey(key);
		if (_key !== undefined) {
			super.set(_key, value);
			return this;
		}
		super.set(key, value);
		return this;
	}

	/** Identical to calling this.set but returns the value instead of this. */
	setReturnValue(key: K, value: V): V {
		this.set(key, value);
		return value;
	}

	override get(key: K): V | undefined {
		const existingKey = this.findKey(key);
		if (existingKey !== undefined) return super.get(existingKey);
		return undefined;
	}

	override has(key: K): boolean {
		return this.findKey(key) !== undefined;
	}

	override delete(key: K): boolean {
		const _key = this.findKey(key);
		if (_key === undefined) return false;
		return super.delete(_key);
	}
}
