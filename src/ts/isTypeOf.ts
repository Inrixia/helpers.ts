import { TypeOfStr, TypeMap, typeOf } from "./typeOf.js";

export const isUndefined = <T>(O: T | undefined): O is undefined => O === undefined;
export const isNull = <T>(O: T | null): O is null => O === null;
export const isNullish = <T>(O: T | null | undefined): O is null | undefined => O === undefined || O === null;

export const notUndefined = <T>(O: T | undefined): O is T => O !== undefined;
export const notNull = <T>(O: T | null): O is T => O !== null;
export const notNullish = <T>(O: T | null | undefined): O is T => O !== undefined && O !== null;

export const isTrue = <T>(O: T | true): O is true => O === true;
export const isFalse = <T>(O: T | false): O is false => O === false;

export const isT =
	<TStr extends TypeOfStr>(type: TStr) =>
	(O: unknown): O is TypeMap[TStr] =>
		typeOf(O) === type;

export const isObject = isT("object");
