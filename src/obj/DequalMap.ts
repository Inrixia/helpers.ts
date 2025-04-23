import { dequal } from "dequal";

/**
 * A Map that uses deep equality to check for key existence.
 * Important if you want to distinguish between objects that serialization does not differentiate.
 *
 * Note performance potentially degrades when the number of entries increases
 * as it has to iterate through all keys if the key isnt immediately in the underlying map.
 */
export class DequalMap<K extends object, V> extends Map<K, V> {
	private _keys: Set<K> = new Set();

	constructor(entries?: ReadonlyArray<readonly [K, V]> | null) {
		super();
		if (entries) {
			for (const [key, value] of entries) this.set(key, value);
		}
	}

	public findKey(key: K): K | undefined {
		if (super.has(key)) return key;
		for (const storedKey of this._keys) {
			if (dequal(storedKey, key)) return storedKey;
		}
	}

	override set(key: K, value: V): this {
		const _key = this.findKey(key);
		if (_key !== undefined) {
			super.set(_key, value);
			return this;
		}
		super.set(key, value);
		this._keys.add(key);
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
	}

	override has(key: K): boolean {
		return this.findKey(key) !== undefined;
	}

	override delete(key: K): boolean {
		const _key = this.findKey(key);
		if (_key === undefined) return false;
		this._keys.delete(_key);
		super.delete(_key);
		return true;
	}

	override clear(): void {
		super.clear();
		this._keys.clear();
	}
}
