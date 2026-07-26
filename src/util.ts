import type {
  ThrottleFunc, DebounceFunc, IsNumberOptions,
  ZResResponse, ZResIsValidResOptions,
  SimpleType, MazeyDate,
  MazeyObject, MazeyFnParams, MazeyFnReturn, MazeyFunction,
  RepeatUntilOptions,
} from "./typing";

interface CloneCache {
  get(source: object): unknown;
  set(source: object, clone: unknown): void;
}

function createCloneCache(): CloneCache {
  if (typeof WeakMap !== "undefined") {
    return new WeakMap<object, unknown>();
  }

  const sources: object[] = [];
  const clones: unknown[] = [];
  return {
    get(source) {
      const index = sources.indexOf(source);
      return index === -1 ? undefined : clones[index];
    },
    set(source, clone) {
      sources.push(source);
      clones.push(clone);
    },
  };
}

function getRegExpFlags(value: RegExp): string {
  if (typeof value.flags === "string") {
    return value.flags;
  }

  const modernRegExp = value as RegExp & {
    hasIndices?: boolean;
    unicodeSets?: boolean;
  };
  let flags = "";
  if (modernRegExp.hasIndices) flags += "d";
  if (value.global) flags += "g";
  if (value.ignoreCase) flags += "i";
  if (value.multiline) flags += "m";
  if (value.dotAll) flags += "s";
  if (value.unicode) flags += "u";
  if (modernRegExp.unicodeSets) flags += "v";
  if (value.sticky) flags += "y";
  return flags;
}

function getCloneKeys(source: object): PropertyKey[] {
  const keys: PropertyKey[] = Object.getOwnPropertyNames(source);
  if (typeof Object.getOwnPropertySymbols === "function") {
    return keys.concat(Object.getOwnPropertySymbols(source));
  }
  return keys;
}

const objectConstructorSource = Function.prototype.toString.call(Object);

function getDateTime(value: object): number | null {
  try {
    return Date.prototype.getTime.call(value);
  } catch (e) {
    return null;
  }
}

function getRegExpSource(value: object): string | null {
  const sourceGetter = Object.getOwnPropertyDescriptor(RegExp.prototype, "source")?.get;
  if (!sourceGetter) {
    return null;
  }
  try {
    return sourceGetter.call(value);
  } catch (e) {
    return null;
  }
}

function hasBuiltinBrand(value: object, prototype: object, property: string): boolean {
  const getter = Object.getOwnPropertyDescriptor(prototype, property)?.get;
  if (!getter) {
    return false;
  }
  try {
    getter.call(value);
    return true;
  } catch (e) {
    return false;
  }
}

function isPlainObjectValue(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null) {
    return true;
  }
  const constructor = Object.prototype.hasOwnProperty.call(prototype, "constructor")
    ? prototype.constructor
    : null;
  return typeof constructor === "function" &&
    Function.prototype.toString.call(constructor) === objectConstructorSource;
}

function isCustomInstanceValue(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  const constructor = prototype?.constructor;
  if (typeof constructor !== "function") {
    return false;
  }
  return Function.prototype.toString.call(constructor).indexOf("[native code]") === -1;
}

/**
 * Copy/Clone Object deeply.
 *
 * Custom class instances are copied as plain objects containing their own
 * properties. Unsupported native instances are preserved by reference.
 *
 * Usage:
 *
 * ```javascript
 * import { deepCopy } from "mazey";
 *
 * const ret1 = deepCopy(["a", "b", "c"]);
 * const ret2 = deepCopy("abc");
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * ["a", "b", "c"]
 * abc
 * ```
 *
 * @param {object} obj The value to clone.
 * @returns {object} Returns the deep cloned value.
 * @category Util
 */
export function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  return cloneValue(obj, createCloneCache());
}

function cloneValue<T>(value: T, seen: CloneCache): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  const source = value as object;
  const cached = seen.get(source);
  if (cached !== undefined) {
    return cached as T;
  }

  const dateTime = getDateTime(source);
  if (dateTime !== null) {
    const result = new Date(dateTime);
    seen.set(source, result);
    return result as T;
  }
  const regexpSource = getRegExpSource(source);
  if (regexpSource !== null) {
    const regexpValue = value as unknown as RegExp;
    const result = new RegExp(regexpSource, getRegExpFlags(regexpValue));
    result.lastIndex = regexpValue.lastIndex;
    seen.set(source, result);
    return result as T;
  }
  if (
    typeof ArrayBuffer !== "undefined" &&
    hasBuiltinBrand(source, ArrayBuffer.prototype, "byteLength")
  ) {
    const result = ArrayBuffer.prototype.slice.call(value, 0);
    seen.set(source, result);
    return result as T;
  }
  if (
    typeof SharedArrayBuffer !== "undefined" &&
    hasBuiltinBrand(source, SharedArrayBuffer.prototype, "byteLength")
  ) {
    const result = SharedArrayBuffer.prototype.slice.call(value, 0);
    seen.set(source, result);
    return result as T;
  }
  if (
    typeof ArrayBuffer !== "undefined" &&
    typeof ArrayBuffer.isView === "function" &&
    ArrayBuffer.isView(value)
  ) {
    const buffer = cloneValue(value.buffer, seen);
    const isDataView = typeof DataView !== "undefined" &&
      hasBuiltinBrand(source, DataView.prototype, "byteLength");
    const result = isDataView
      ? new DataView(buffer, value.byteOffset, value.byteLength)
      : new (value.constructor as {
        new(buffer: ArrayBufferLike, byteOffset: number, length: number): ArrayBufferView;
      })(buffer, value.byteOffset, (value as unknown as { length: number }).length);
    seen.set(source, result);
    return result as T;
  }
  if (
    typeof Map !== "undefined" &&
    hasBuiltinBrand(source, Map.prototype, "size")
  ) {
    const result = new Map();
    seen.set(source, result);
    Map.prototype.forEach.call(value, (mapValue, key) => {
      result.set(cloneValue(key, seen), cloneValue(mapValue, seen));
    });
    return result as T;
  }
  if (
    typeof Set !== "undefined" &&
    hasBuiltinBrand(source, Set.prototype, "size")
  ) {
    const result = new Set();
    seen.set(source, result);
    Set.prototype.forEach.call(value, setValue => {
      result.add(cloneValue(setValue, seen));
    });
    return result as T;
  }

  const isArray = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  const isPlainObject = isPlainObjectValue(source);
  const isCustomInstance = !isArray && !isPlainObject && isCustomInstanceValue(source);
  if (!isArray && !isPlainObject && !isCustomInstance) {
    // Unsupported native instances may depend on internal slots.
    seen.set(source, value);
    return value;
  }

  const result = isArray
    ? new Array(value.length)
    : Object.create(isCustomInstance ? Object.prototype : prototype);
  seen.set(source, result);
  getCloneKeys(source).forEach(key => {
    if (isArray && key === "length") return;
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (!descriptor) return;
    if ("value" in descriptor) {
      descriptor.value = cloneValue(descriptor.value, seen);
    }
    Object.defineProperty(result, key, descriptor);
  });
  return result as T;
}

/**
 * Recursively freeze an object and its nested enumerable values.
 *
 * Primitive values and objects that are already frozen are returned unchanged.
 *
 * Usage:
 *
 * ```javascript
 * import { deepFreeze } from "mazey";
 *
 * const config = deepFreeze({
 *   api: {
 *     timeout: 5000,
 *   },
 * });
 *
 * console.log(Object.isFrozen(config));
 * console.log(Object.isFrozen(config.api));
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * true
 * ```
 *
 * @param value The value to freeze.
 * @returns The original value with its nested enumerable values frozen.
 * @category Util
 */
export function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  // Freeze first so circular references terminate at Object.isFrozen().
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

/**
 * Shallowly assign defined properties from one or more sources.
 *
 * The target is mutated. Only own enumerable string-keyed properties are
 * considered, and `undefined` values are skipped. Other falsy values such as
 * `null`, an empty string, `0`, and `false` are assigned.
 *
 * Usage:
 *
 * ```javascript
 * import { assignDefined } from "mazey";
 *
 * const options = assignDefined(
 *   { retries: 3, verbose: true },
 *   { retries: undefined, verbose: false },
 * );
 *
 * console.log(options);
 * ```
 *
 * Output:
 *
 * ```text
 * { retries: 3, verbose: false }
 * ```
 *
 * @param target The object to mutate.
 * @param sources Sources applied from left to right.
 * @returns The mutated target.
 * @category Util
 */
export function assignDefined<T extends object>(
  target: T,
  ...sources: ReadonlyArray<Partial<T> | undefined>
): T {
  sources.forEach(source => {
    if (source === undefined) return;

    Object.keys(source).forEach(key => {
      const value = (source as Record<string, unknown>)[key];
      if (value !== undefined) {
        const writableTarget = target as unknown as Record<string, unknown>;
        if (
          key === "__proto__" &&
          !Object.prototype.hasOwnProperty.call(target, key)
        ) {
          Object.defineProperty(target, key, {
            configurable: true,
            enumerable: true,
            value,
            writable: true,
          });
        } else {
          writableTarget[key] = value;
        }
      }
    });
  });
  return target;
}

/**
 * Alias of `deepCopy`.
 *
 * @hidden
 */
export function deepCopyObject<T>(obj: T): T {
  return deepCopy(obj);
}

/**
 * Convert CamelCase to KebabCase.
 *
 * Usage:
 *
 * ```javascript
 * import { convertCamelToKebab } from "mazey";
 *
 * const ret1 = convertCamelToKebab("ABC");
 * const ret2 = convertCamelToKebab("aBC");
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * a-b-c
 * a-b-c
 * ```
 *
 * @param {string} camelCase "aBC" or "ABC"
 * @returns {string} "a-b-c"
 * @category Util
 */
export function convertCamelToKebab(camelCase: string): string {
  const kebabCase = camelCase.replace(/([A-Z])/g, "-$1").toLowerCase();
  return kebabCase[0] === "-" ? kebabCase.substring(1) : kebabCase;
}

/**
 * Convert KebabCase to CamelCase.
 *
 * Usage:
 *
 * ```javascript
 * import { convertKebabToCamel } from "mazey";
 *
 * const ret1 = convertKebabToCamel("a-b-c");
 * const ret2 = convertKebabToCamel("a-bb-cc");
 * console.log(ret1, ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * aBC aBbCc
 * ```
 *
 * @param {string} kebabCase "a-bb-cc"
 * @returns {string} "aBbCc"
 * @category Util
 */
export function convertKebabToCamel(kebabCase: string): string {
  const camelCase = kebabCase.replace(/-([a-z])/g, (_all, letter) => letter.toUpperCase());
  return camelCase.endsWith("-") ? camelCase.slice(0, -1) : camelCase;
}

/**
 * Alias of `convertCamelToKebab`.
 *
 * @hidden
 */
export function camelCaseToKebabCase(camelCase: string): string {
  return convertCamelToKebab(camelCase);
}

/**
 * Convert CamelCase to Underscore.
 *
 * Usage:
 *
 * ```javascript
 * import { convertCamelToUnder } from "mazey";
 *
 * const ret1 = convertCamelToUnder("ABC");
 * const ret2 = convertCamelToUnder("aBC");
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * a_b_c
 * a_b_c
 * ```
 *
 * @param {string} camelCase "aBC" or "ABC"
 * @returns {string} "a_b_c"
 * @category Util
 */
export function convertCamelToUnder(camelCase: string): string {
  const kebabCase = camelCase.replace(/([A-Z])/g, "_$1").toLowerCase();
  return kebabCase[0] === "_" ? kebabCase.substring(1) : kebabCase;
}

/**
 * Convert Underscore to CamelCase.
 *
 * Usage:
 *
 * ```javascript
 * import { convertUnderToCamel } from "mazey";
 *
 * const ret1 = convertUnderToCamel("a_b_c");
 * const ret2 = convertUnderToCamel("a_bb_cc");
 * console.log(ret1, ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * aBC aBbCc
 * ```
 *
 * @param {string} underCase "a_bb_cc"
 * @returns {string} "aBbCc"
 * @category Util
 */
export function convertUnderToCamel(underCase: string): string {
  const camelCase = underCase.replace(/_([a-z])/g, (_all, letter) => letter.toUpperCase());
  return camelCase;
}

/**
 * Alias of `convertCamelToUnder`.
 *
 * @hidden
 */
export function camelCase2Underscore(camelCase: string): string {
  return convertCamelToUnder(camelCase);
}

/**
 * Convert text to a deterministic uppercase ASCII JavaScript identifier.
 *
 * Characters outside `A-Z`, `a-z`, `0-9`, `_`, and `$` become `_`. A result
 * beginning with a digit is prefixed with `_`; an empty input therefore returns `_`.
 *
 * Usage:
 *
 * ```javascript
 * import { toJavaScriptGlobalName } from "mazey";
 *
 * const globalName = toJavaScriptGlobalName("@scope/my-library");
 * console.log(globalName);
 * ```
 *
 * Output:
 *
 * ```text
 * _SCOPE_MY_LIBRARY
 * ```
 *
 * @param value Text such as a package name or bundle filename.
 * @returns An uppercase identifier suitable for an IIFE global name.
 * @throws TypeError when `value` is not a string.
 * @category Util
 */
export function toJavaScriptGlobalName(value: string): string {
  if (typeof value !== "string") {
    throw new TypeError("value must be a string");
  }

  const identifier = value.replace(/[^A-Za-z0-9_$]/g, "_").toUpperCase();
  return /^[A-Za-z_$]/.test(identifier) ? identifier : `_${identifier}`;
}

/**
 * Remove leading and trailing whitespace or specified characters from string.
 *
 * Note: This method is used to replace the native `String.prototype.trim()`. But it is not necessary to use it in modern browsers.
 *
 * Usage:
 *
 * ```javascript
 * import { mTrim } from "mazey";
 *
 * const ret1 = mTrim(" 1 2 3 ");
 * const ret2 = mTrim("abc ");
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * 1 2 3
 * abc
 * ```
 *
 * @param {string} str The string to trim.
 * @returns {string} Trimmed string.
 * @category Util
 * @hidden
 */
export function mTrim(str: string): string {
  str = str.replace(/^\s+/, ""); // Remove leading whitespace.
  let end = str.length - 1;
  const ws = /\s/;
  while (ws.test(str.charAt(end))) {
    end--; // Index of the last non-whitespace character.
  }
  return str.slice(0, end + 1);
}

/**
 * Check whether it is a valid JSON string.
 *
 * Usage:
 *
 * ```javascript
 * import { isJSONString } from "mazey";
 *
 * const ret1 = isJSONString(`['a', 'b', 'c']`);
 * const ret2 = isJSONString(`["a", "b", "c"]`);
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * false
 * true
 * ```
 *
 * @param {string} str The string to check.
 * @returns {boolean} Return the result of checking.
 * @category Util
 */
export function isJSONString(str: string): boolean {
  if (typeof str !== "string") {
    return false;
  }
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    /* pass */
  }
  return false;
}

/**
 * Alias of `isJSONString`.
 *
 * @hidden
 */
export function isJsonString(str: string): boolean {
  return isJSONString(str);
}

/**
 * Parse a JSON string and return a caller-defined fallback when parsing fails.
 *
 * Usage:
 *
 * ```javascript
 * import { parseJsonSafe } from "mazey";
 *
 * const data = parseJsonSafe('{"enabled":true}');
 * const fallback = parseJsonSafe("invalid", {});
 * ```
 *
 * @param value JSON string to parse.
 * @param fallback Value returned when parsing fails. Defaults to `null`.
 * @returns The parsed JSON value or the supplied fallback.
 * @category Util
 */
export function parseJsonSafe<T, F = null>(
  value: string,
  fallback: F = null as F
): T | F {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Generate a random string of number, `genRndNumString(7)` => "7658495".
 *
 * Usage:
 *
 * ```javascript
 * import { genRndNumString } from "mazey";
 *
 * const ret1 = genRndNumString(4);
 * const ret2 = genRndNumString(7);
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * 9730
 * 2262490
 * ```
 *
 * @param {number} n Length
 * @returns {string} Return the random string.
 * @category Util
 */
export function genRndNumString(n = 5): string {
  if (!Number.isFinite(n) || n <= 0) {
    return "";
  }
  n = Math.floor(n);
  let ret = "";
  while (n--) {
    ret += Math.floor(Math.random() * 10);
  }
  return ret;
}

/**
 * Alias of `genRndNumString`.
 *
 * @hidden
 */
export function generateRndNum(n = 5): string {
  return genRndNumString(n);
}

/**
 * Generate a numeric identifier by combining the current timestamp with a
 * random numeric suffix.
 *
 * Usage:
 *
 * ```javascript
 * import { genUniqueNumString } from "mazey";
 *
 * const ret1 = genUniqueNumString();
 * const ret2 = genUniqueNumString(3);
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * 1538324722364123
 * 1538324722364123
 * ```
 *
 * @param {number} n Length of the random numeric suffix.
 * @returns {string} A timestamp-based numeric identifier.
 * @category Util
 */
export function genUniqueNumString(n = 3): string {
  const [ now, rnd ] = [ mNow(), generateRndNum(n || 3) ];
  return now + rnd;
}

/**
 * Alias of `genUniqueNumString`.
 *
 * @hidden
 */
export function generateUniqueNum(n = 3): string {
  return genUniqueNumString(n);
}

/**
 * Get the current timestamp in milliseconds.
 *
 * Usage:
 *
 * ```javascript
 * import { mNow } from "mazey";
 *
 * const ret = mNow();
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 1585325367122
 * ```
 *
 * @returns {number} The current timestamp in milliseconds.
 * @category Util
 */
export function mNow(): number {
  let ret = 0;
  if (Date.now) {
    ret = Date.now();
  } else {
    ret = new Date().getTime();
  }
  return ret;
}

/**
 * Convert a floating-point ratio to a percentage string.
 *
 * Usage:
 *
 * ```javascript
 * import { floatToPercent } from "mazey";
 *
 * const ret1 = floatToPercent(0.2);
 * const ret2 = floatToPercent(0.2, 2);
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * 20%
 * 20.00%
 * ```
 *
 * @param {number} num Floating-point ratio to convert.
 * @param {number} fixSize Number of decimal places in the percentage.
 * @returns {string} The percentage string.
 * @category Util
 */
export function floatToPercent(num: number, fixSize = 0): string {
  let ret = "";
  if (fixSize) {
    ret = (num * 100).toFixed(fixSize);
  } else {
    ret = String(Math.floor(num * 100));
  }
  return `${ret}%`;
}

/**
 * Format a number with a fixed number of decimal places.
 *
 * Usage:
 *
 * ```javascript
 * import { floatFixed } from "mazey";
 *
 * const ret1 = floatFixed(0.2);
 * const ret2 = floatFixed(0.2, 2);
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * 0
 * 0.20
 * ```
 *
 * @param num Number or numeric string to format.
 * @param size Number of decimal places.
 * @returns The fixed-point string.
 * @category Util
 */
export function floatFixed(num: number | string, size = 0): string {
  return parseFloat(String(num)).toFixed(size);
}

/**
 * Limit how frequently a function can be invoked over time.
 *
 * Usage:
 *
 * ```javascript
 * import { throttle } from "mazey";
 *
 * const foo = throttle(() => {
 *   console.log("The function will be invoked at most once per every wait 1000 milliseconds.");
 * }, 1000, { leading: true });
 * ```
 *
 * Reference: [Lodash](https://lodash.com/docs/4.17.15#throttle)
 *
 * @param func Function to throttle.
 * @param wait Minimum interval between invocations, in milliseconds.
 * @param options.leading Whether to invoke on the leading edge.
 * @param options.trailing Whether to invoke on the trailing edge.
 * @returns The throttled function.
 * @category Util
 */
export function throttle<T extends (...args: MazeyFnParams) => MazeyFnReturn>(func: T, wait: number, options: { leading?: boolean; trailing?: boolean } = {}): ThrottleFunc<T> {
  options = Object.assign({}, options);
  let context: unknown | null = null;
  let args: Parameters<T> | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let [ result, previous ] = [ null, 0 ];
  const later = function(this: unknown) {
    previous = options.leading === false ? 0 : mNow();
    timeout = null;
    result = func.apply(this as T, args!);
    if (!timeout) {
      context = args = null;
    }
  };
  return function(this: unknown, ...argRest: Parameters<T>) {
    const now = mNow();
    if (!previous && options.leading === false) {
      previous = now;
    }
    const remaining = wait - (now - previous);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    context = this;
    args = argRest;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context as T, args!);
      if (!timeout) {
        context = args = null;
      }
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later.bind(context), remaining);
    }
    return result;
  };
}

/**
 * Delay function execution until the specified time has passed since the last
 * invocation.
 *
 * Usage:
 *
 * ```javascript
 * import { debounce } from "mazey";
 *
 * const foo = debounce(() => {
 *   console.log("The debounced function will only be invoked in 1000 milliseconds, the other invoking will disappear during the wait time.");
 * }, 1000, true);
 * ```
 *
 * @param func Function to debounce.
 * @param wait Delay after the last invocation, in milliseconds.
 * @param immediate Whether to invoke on the leading edge instead.
 * @returns The debounced function.
 * @category Util
 */
export function debounce<T extends (...args: MazeyFnParams) => MazeyFnReturn>(func: T, wait: number, immediate?: boolean): DebounceFunc<T> {
  let context: unknown | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let timestamp: number | null = null;
  let args: Parameters<T> | null = null;
  let result: ReturnType<T> | null = null;
  const later = function() {
    const last = mNow() - (timestamp as number);
    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context as T, args!);
        if (!timeout) {
          context = args = null;
        }
      }
    }
  };
  return function(this: unknown, ...argRest: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    context = this;
    args = argRest;
    timestamp = mNow();
    const callNow = immediate && !timeout;
    if (!timeout) {
      timeout = setTimeout(later, wait);
    }
    if (callNow) {
      result = func.apply(context as T, args!);
      context = args = null;
    }
    return result as ReturnType<T>;
  };
}

const defaultGetDateDifferenceOptions = {
  type: "d",
};

function normalizeDateDifferenceDate(value: number | string | Date): number | string | Date {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.replace(" ", "T");
  }
  return value;
}

/**
 * Calculate the interval between two dates or timestamps.
 *
 * The default `d` type returns the number of whole days. The `text` type
 * returns an English duration using days, hours, minutes, and seconds while
 * omitting zero-valued units. A zero interval returns `"0 seconds"`. Any other
 * type returns the number of whole seconds. Negative intervals and invalid
 * dates return an empty string.
 *
 * Usage:
 *
 * ```javascript
 * import { getDateDifference } from "mazey";
 *
 * const days = getDateDifference(0, 90061000);
 * const text = getDateDifference(0, 90061000, { type: "text" });
 * const compactText = getDateDifference(0, 90060000, { type: "text" });
 * const dateStringDays = getDateDifference(
 *   "2020-03-28 00:09:27",
 *   "2023-04-18 10:54:00"
 * );
 * console.log(days);
 * console.log(text);
 * console.log(compactText);
 * console.log(dateStringDays);
 * ```
 *
 * Output:
 *
 * ```text
 * 1
 * 1 day 1 hour 1 minute 1 second
 * 1 day 1 hour 1 minute
 * 1116
 * ```
 *
 * @param start Start date or timestamp.
 * @param end End date or timestamp.
 * @param options Formatting options. Use `d` for whole days or `text` for an English duration.
 * @returns Whole days, whole seconds, an English duration, or an empty string for a negative or invalid interval.
 * @remarks Strings in `YYYY-MM-DD HH:mm:ss` format are normalized and parsed as local time. Other date strings use the runtime's native `Date` parser; use timestamps or ISO strings with an explicit timezone when parsing must be portable.
 * @category Util
 */
export function getDateDifference(start: number | string | Date = 0, end: number | string | Date = 0, options: { type?: string } = defaultGetDateDifferenceOptions): number | string {
  options = Object.assign({}, defaultGetDateDifferenceOptions, options);
  const { type } = options;
  if (!isNumber(start)) start = new Date(normalizeDateDifferenceDate(start)).getTime();
  if (!isNumber(end)) end = new Date(normalizeDateDifferenceDate(end)).getTime();
  const t = Number(end) - Number(start);
  let ret = "";
  let [ d, h, m, s ] = new Array(4).fill(0);
  if (t >= 0) {
    d = Math.floor(t / 1000 / 60 / 60 / 24);
    h = Math.floor(t / 1000 / 60 / 60);
    m = Math.floor(t / 1000 / 60);
    s = Math.floor(t / 1000);
    switch (type) {
      case "d":
        ret = d;
        break;
      case "text":
        d = Math.floor(t / 1000 / 60 / 60 / 24);
        h = Math.floor((t / 1000 / 60 / 60) % 24);
        m = Math.floor((t / 1000 / 60) % 60);
        s = Math.floor((t / 1000) % 60);
        ret = [
          { value: d, unit: "day" },
          { value: h, unit: "hour" },
          { value: m, unit: "minute" },
          { value: s, unit: "second" },
        ]
          .filter(({ value }) => value > 0)
          .map(({ value, unit }) => formatDurationUnit(value, unit))
          .join(" ") || formatDurationUnit(0, "second");
        break;
      default:
        ret = s;
    }
  }
  return ret;
}

/**
 * Alias of `getDateDifference`.
 *
 * @hidden
 */
export function getFriendlyInterval(start: number | string | Date = 0, end: number | string | Date = 0, options: { type?: string } = defaultGetDateDifferenceOptions): number | string {
  return getDateDifference(start, end, options);
}

function formatDurationUnit(value: number, unit: string): string {
  const roundedValue = Math.round(value * 10) / 10;
  const unitLabel = roundedValue === 1 ? unit : `${unit}s`;
  return `${roundedValue} ${unitLabel}`;
}

/**
 * Format a duration in milliseconds using its largest applicable English unit.
 *
 * Values are rounded to at most one decimal place. Negative durations are
 * clamped to zero, and non-finite values return `"0 seconds"`.
 *
 * Usage:
 *
 * ```javascript
 * import { formatDurationFromMs } from "mazey";
 *
 * formatDurationFromMs(500);        // "0.5 seconds"
 * formatDurationFromMs(90000);      // "1.5 minutes"
 * formatDurationFromMs(3600000);    // "1 hour"
 * formatDurationFromMs(129600000);  // "1.5 days"
 * ```
 *
 * @param {number} durationMs Duration in milliseconds.
 * @returns {string} Concise duration using seconds, minutes, hours, or days.
 * @category Util
 */
export function formatDurationFromMs(durationMs: number): string {
  const normalizedDurationMs = Number.isFinite(durationMs) ? Math.max(durationMs, 0) : 0;
  const seconds = normalizedDurationMs / 1000;

  if (seconds >= 24 * 60 * 60) {
    return formatDurationUnit(seconds / 24 / 60 / 60, "day");
  }
  if (seconds >= 60 * 60) {
    return formatDurationUnit(seconds / 60 / 60, "hour");
  }
  if (seconds >= 60) {
    return formatDurationUnit(seconds / 60, "minute");
  }
  return formatDurationUnit(seconds, "second");
}

/**
 * Check whether a value is a number allowed by the supplied options.
 *
 * Usage:
 *
 * ```javascript
 * import { isNumber } from "mazey";
 *
 * const ret1 = isNumber(123);
 * const ret2 = isNumber("123");
 * // Default: NaN, Infinity is not Number
 * const ret3 = isNumber(Infinity);
 * const ret4 = isNumber(Infinity, { isInfinityAsNumber: true });
 * const ret5 = isNumber(NaN);
 * const ret6 = isNumber(NaN, { isNaNAsNumber: true, isInfinityAsNumber: true });
 * console.log(ret1, ret2, ret3, ret4, ret5, ret6);
 * ```
 *
 * Output:
 *
 * ```text
 * true false false true false true
 * ```
 *
 * @param {*} num Value to check.
 * @param options Controls whether `NaN`, `Infinity`, or other non-finite values count as numbers.
 * @returns {boolean} Whether the value is an allowed number.
 * @category Util
 */
export function isNumber(num: unknown, options: IsNumberOptions = {}): boolean {
  const { isNaNAsNumber = false, isInfinityAsNumber = false, isUnFiniteAsNumber = false } = options;
  if (typeof num !== "number") {
    return false;
  }
  if (!(isInfinityAsNumber === true || isUnFiniteAsNumber === true) && !isFinite(num)) {
    return false;
  }
  // Be compatible with previous versions.
  // if (!isUnFiniteAsNumber && !isFinite(num)) {
  //   return false;
  // }
  if (!isNaNAsNumber && isNaN(num)) {
    return false;
  }
  return true;
}

/**
 * Invoke a value only when it is a function.
 *
 * Usage:
 *
 * ```javascript
 * import { invokeFn } from "mazey";
 *
 * const ret = invokeFn(() => {
 *  console.log("invokeFn");
 * });
 * ```
 *
 * @param {function} fn Potential function to invoke.
 * @param params Arguments passed to the function.
 * @returns The function result, or `null` when `fn` is not callable.
 * @category Util
 */
export function invokeFn(fn: MazeyFunction | null | undefined, ...params: Parameters<MazeyFunction>): ReturnType<MazeyFunction> | null {
  let ret: ReturnType<MazeyFunction> | null = null;
  if (fn && typeof fn === "function") {
    ret = fn(...params);
  }
  return ret;
}

/**
 * Alias of `invokeFn`.
 *
 * @hidden
 */
export function doFn(fn: MazeyFunction | null | undefined, ...params: Parameters<MazeyFunction>): ReturnType<MazeyFunction> | null {
  return invokeFn(fn, ...params);
}

/**
 * Verify the validity of a non-empty array.
 *
 * Usage:
 *
 * ```javascript
 * import { isNonEmptyArray } from "mazey";
 *
 * const ret = isNonEmptyArray([1, 2, 3]);
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @category Util
 */
export function isNonEmptyArray<T>(arr: Array<T>): boolean {
  let ret = false;
  if (Array.isArray(arr) && arr.length) {
    ret = true;
  }
  return ret;
}

/**
 * Verify the validity of a pure object.
 *
 * Usage:
 *
 * ```javascript
 * import { isPureObject } from "mazey";
 *
 * const ret1 = isPureObject({ a: 1 });
 * const ret2 = isPureObject("abc");
 * const ret3 = isPureObject(null);
 * const ret4 = isPureObject([]);
 *
 * console.log(ret1, ret2, ret3, ret4);
 * ```
 *
 * Output:
 *
 * ```text
 * true false false false
 * ```
 *
 * @param {MazeyObject} obj The object to verify.
 * @returns {boolean} Return TRUE if the object is a pure object.
 * @category Util
 */
export function isPureObject(obj: MazeyObject): boolean {
  const c1 = Boolean(obj);
  const c2 = typeof obj === "object";
  const c3 = Object.prototype.toString.call(obj) === "[object Object]";
  return c1 && c2 && c3;
}

/**
 * Verify the validity of a function.
 *
 * Usage:
 *
 * ```javascript
 * import { isFunction } from "mazey";
 *
 * const ret1 = isFunction(() => {});
 * const ret2 = isFunction("abc");
 * const ret3 = isFunction(null);
 * console.log(ret1, ret2, ret3);
 * ```
 *
 * Output:
 *
 * ```text
 * true false false
 * ```
 *
 * @param {MazeyObject} fn The function to verify.
 * @returns {boolean} Return TRUE if the object is a function.
 * @category Util
 */
export function isFunction(fn: MazeyObject): boolean {
  return typeof fn === "function";
}

/**
 * Verify the validity of a string.
 *
 * Usage:
 *
 * ```javascript
 * import { isString } from "mazey";
 *
 * const ret1 = isString("abc");
 * const ret2 = isString({ a: 1 });
 * const ret3 = isString(null);
 * console.log(ret1, ret2, ret3);
 * ```
 *
 * Output:
 *
 * ```text
 * true false false
 * ```
 *
 * @param {MazeyObject} str The string to verify.
 * @returns {boolean} Return TRUE if the object is a string.
 * @category Util
 */
export function isString(str: MazeyObject): boolean {
  return typeof str === "string";
}

/**
 * Verify the validity of a boolean.
 *
 * Usage:
 *
 * ```javascript
 * import { isBool } from "mazey";
 *
 * const ret1 = isBool(true);
 * const ret2 = isBool({ a: 1 });
 * const ret3 = isBool("abc");
 * const ret4 = isBool(null);
 * console.log(ret1, ret2, ret3, ret4);
 * ```
 *
 * Output:
 *
 * ```text
 * true false false false
 * ```
 *
 * @param {MazeyObject} bool The boolean to verify.
 * @returns {boolean} Return TRUE if the object is a boolean.
 * @category Util
 */
export function isBool(bool: MazeyObject): boolean {
  return typeof bool === "boolean";
}

/**
 * Alias of `isBool`.
 */
export function isBoolean(bool: MazeyObject): boolean {
  return isBool(bool);
}

/**
 * Verify the validity of a value.
 *
 * Usage:
 *
 * ```javascript
 * import { isUdfOrNul } from "mazey";
 *
 * const ret1 = isUdfOrNul(undefined);
 * const ret2 = isUdfOrNul(null);
 * const ret3 = isUdfOrNul("abc");
 * console.log(ret1, ret2, ret3);
 * ```
 *
 * Output:
 *
 * ```text
 * true true false
 * ```
 *
 * @param {MazeyObject} val The value to verify.
 * @returns {boolean} Return TRUE if the object is undefined or null.
 * @category Util
 */
export function isUdfOrNul(val: MazeyObject): boolean {
  return val === undefined || val === null;
}

/**
 * Verify the validity of an array.
 *
 * Usage:
 *
 * ```javascript
 * import { isArray } from "mazey";
 *
 * const ret1 = isArray([1, 2, 3]);
 * const ret2 = isArray({ a: 1 });
 * const ret3 = isArray("abc");
 * const ret4 = isArray(null);
 * console.log(ret1, ret2, ret3, ret4);
 * ```
 *
 * Output:
 *
 * ```text
 * true false false false
 * ```
 *
 * @param {MazeyObject} obj The object to verify.
 * @returns {boolean} Return TRUE if the object is an array.
 * @category Util
 */
export function isArray(obj: MazeyObject): boolean {
  return Object.prototype.toString.call(obj) === "[object Array]";
}

/**
 * Verify the validity of a non-empty object.
 *
 * Usage:
 *
 * ```javascript
 * import { isNonEmptyObject } from "mazey";
 *
 * const ret1 = isNonEmptyObject({ a: 1 });
 * const ret2 = isNonEmptyObject({});
 * const ret3 = isNonEmptyObject("abc");
 * const ret4 = isNonEmptyObject(null);
 * console.log(ret1, ret2, ret3, ret4);
 * ```
 *
 * Output:
 *
 * ```text
 * true false false false
 * ```
 *
 * @param obj
 * @returns
 */
export function isNonEmptyObject(obj: MazeyObject): boolean {
  if (!isPureObject(obj)) {
    return false;
  }
  if (Object.keys(obj).length === 0) {
    return false;
  }
  return true;
}

/**
 * Convert newline characters `\n` into HTML line breaks `<br />`.
 *
 * Usage:
 *
 * ```javascript
 * import { convertToHtmlBreaks } from "mazey";
 *
 * const ret1 = convertToHtmlBreaks("a\nb\nc");
 * const ret2 = convertToHtmlBreaks("a\n\nbc");
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * a<br />b<br />c
 * a<br /><br />bc
 * ```
 *
 * @param {string} str The string to make a new line.
 * @returns {string} A newline with `br`.
 * @category Util
 */
export function convertToHtmlBreaks(str: string): string {
  if (!str) {
    return "";
  }
  const reg = new RegExp("\\n", "g");
  return str.replace(reg, "<br />");
}

/**
 * Alias of `convertToHtmlBreaks`.
 *
 * @hidden
 */
export function newLine(str: string): string {
  return convertToHtmlBreaks(str);
}

/**
 * Remove HTML tags from a string, and optionally newline characters.
 *
 * Usage:
 *
 * ```javascript
 * import { removeHTML } from "mazey";
 *
 * const ret = removeHTML("<div>hello world</div>");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * hello world
 * ```
 *
 * @param {string} str A string that may contain HTML tags.
 * @returns {string} The string with HTML tags removed.
 * @category Util
 */
export function removeHTML(str: string, options: { removeNewLine?: boolean } = {}): string {
  const { removeNewLine = false } = options;
  let ret = "";
  if (str) {
    ret = str.replace(/<\/?.+?>/g, "");
    if (removeNewLine) {
      ret = ret.replace(/[\r\n]/g, "");
    }
  }
  return ret;
}

/**
 * Alias of `removeHTML`.
 *
 * @hidden
 */
export function removeHtml(str: string, options: { removeNewLine?: boolean } = {}): string {
  return removeHTML(str, options);
}

/**
 * Alias of `removeHTML`.
 *
 * @hidden
 */
export function clearHTML(str: string, options: { removeNewLine?: boolean } = {}): string {
  return removeHTML(str, options);
}

/**
 * Alias of `removeHTML`.
 *
 * @hidden
 */
export function clearHtml(str: string, options: { removeNewLine?: boolean } = {}): string {
  return removeHTML(str, options);
}

/**
 * Sanitizes user input to prevent XSS attacks.
 *
 * Usage:
 *
 * ```javascript
 * import { sanitizeInput } from "mazey";
 *
 * const ret = sanitizeInput("<div>hello world</div>");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * &lt;div&gt;hello world&lt;/div&gt;
 * ```
 *
 * @param input - The input string to sanitize
 * @returns The sanitized input string
 * @category Util
 */
export function sanitizeInput(input: string): string {
  const regex = /[&<>"'/]/g;
  const replacements: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }
  return input.replace(regex, (match: keyof typeof replacements) => replacements[match]);
}

/**
 * Reverses the sanitization done by the `sanitizeInput` function.
 *
 * Usage:
 *
 * ```javascript
 * import { unsanitizeInput } from "mazey";
 *
 * const ret = unsanitizeInput("&lt;div&gt;hello world&lt;/div&gt;");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * <div>hello world</div>
 * ```
 *
 * @param input - The input string to unsanitize
 * @returns The unsanitized input string
 * @category Util
 */
export function unsanitizeInput(input: string): string {
  const regex = /(&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;)/g;
  const replacements: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&#x27;": "'",
    "&#x2F;": "/",
  };
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }
  return input.replace(regex, (match: keyof typeof replacements) => replacements[match]);
}

/**
 * Alias of `unsanitizeInput`.
 *
 * @hidden
 */
export function unsanitize(str: string): string {
  return unsanitizeInput(str);
}

/**
 * Truncate a string by weighted length, counting non-ASCII characters as two
 * units.
 *
 * Usage:
 *
 * ```javascript
 * import { cutZHString } from "mazey";
 *
 * const ret = cutZHString("hello world", 5);
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * hello
 * ```
 *
 * @param {string} str String to truncate.
 * @param {number} len Maximum weighted length.
 * @param {boolean} options.hasDot Whether to append truncation text.
 * @param {string} options.dotText Text appended when truncation occurs.
 * @returns {string} The truncated string.
 * @category Util
 */
export function cutZHString(str: string | null | undefined, len: number, options: { hasDot?: boolean, dotText?: string } = { hasDot: false, dotText: "..." }): string {
  options = Object.assign({ hasDot: false, dotText: "..." }, options);
  if (str == "" || !str) {
    return "";
  } else {
    let newLength = 0;
    let newStr = "";
    // eslint-disable-next-line no-control-regex
    const chineseRegex = /[^\x00-\xff]/g;
    let singleChar = "";
    const strLength = str.replace(chineseRegex, "**").length;
    for (let i = 0; i < strLength; i++) {
      singleChar = str.charAt(i).toString();
      if (singleChar.match(chineseRegex) != null) {
        newLength += 2;
      } else {
        newLength++;
      }
      if (newLength > len) {
        break;
      }
      newStr += singleChar;
    }

    if (options.hasDot && strLength > len) {
      newStr += options.dotText; // "...";
    }
    return newStr;
  }
}

/**
 * Alias of `cutZHString`.
 *
 * Usage:
 *
 * ```javascript
 * import { truncateZHString } from "mazey";
 *
 * const ret = truncateZHString("hello world", 5);
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * hello
 * ```
 *
 * @param {string} str String to truncate.
 * @param {number} len Maximum weighted length.
 * @param {boolean} hasDot Whether to append the default truncation text.
 * @returns {string} The truncated string.
 * @hidden
 */
export function truncateZHString(str: string | null | undefined, len: number, hasDot = false): string {
  return cutZHString(str, len, { hasDot });
}

/**
 * Alias of `truncateZHString`.
 *
 * @hidden
 */
export function cutCHSString(str: string | null | undefined, len: number, hasDot = false): string {
  return truncateZHString(str, len, hasDot);
}

/**
 * Verify the validity of axios response.
 *
 * Reference: [Handling Errors](https://axios-http.com/docs/handling_errors)
 *
 * @category Util
 * @hidden
 */
export function zAxiosIsValidRes(
  res: ZResResponse | undefined,
  options: ZResIsValidResOptions | null = {
    validStatusRange: [ 200, 300 ],
    validCode: [ 0 ],
  }
): boolean {
  const normalizedOptions = options || {};
  const {
    validStatusRange = [ 200, 300 ],
    validCode = [ 0 ],
  } = normalizedOptions;
  if (validStatusRange.length !== 2) {
    console.error("valid validStatusRange is required");
  }
  let ret = false;
  if (res && res.status && validStatusRange.length === 2 && res.status >= validStatusRange[0] && res.status < validStatusRange[1]) {
    const resData = res.data;
    if (resData && validCode.includes(resData.code)) {
      ret = true;
    }
  }
  return ret;
}

/**
 * Determine the validity of the data.
 *
 * Usage:
 *
 * ```javascript
 * import { isValidData } from "mazey";
 *
 * const validData = {
 *   a: {
 *     b: {
 *       c: 413
 *     }
 *   }
 * };
 * const isValidDataResA = isValidData(validData, ["a", "b", "c"], 2333);
 * const isValidDataResB = isValidData(validData, ["a", "b", "c"], 413);
 * const isValidDataResC = isValidData(validData, ["d", "d"], 413);
 * console.log("isValidDataResA:", isValidDataResA);
 * console.log("isValidDataResB:", isValidDataResB);
 * console.log("isValidDataResC:", isValidDataResC);
 * ```
 *
 * Output:
 *
 * ```text
 * isValidDataResA: false
 * isValidDataResB: true
 * isValidDataResC: false
 * ```
 *
 * @param {any} data Original Data
 * @param {string[]} attributes Data Attributes
 * @param {any} validValue Given Value for verifying.
 * @returns {boolean} Return TRUE if the data is valid.
 * @category Util
 */
export function isValidData(data: MazeyObject, attributes: string[], validValue: SimpleType): boolean {
  if (data === null || typeof data !== "object") {
    return false;
  }

  let foundValue = data;
  for (const attribute of attributes) {
    if (
      foundValue === null ||
      (typeof foundValue !== "object" && typeof foundValue !== "function") ||
      !Object.prototype.hasOwnProperty.call(foundValue, attribute)
    ) {
      return false;
    }
    foundValue = foundValue[attribute];
  }
  return foundValue === validValue;
}

/**
 * Options for formatting a byte count.
 *
 * @category Util
 */
export interface FormatByteSizeOptions {
  /** Unit scale. Defaults to `1024`. */
  base?: 1000 | 1024;
  /** Decimal places for rounded values. Must be an integer from 0 to 20. Defaults to `1`. */
  fractionDigits?: number;
  /** Returned for negative, non-finite, or otherwise invalid input. Defaults to an empty string. */
  invalidValue?: string;
}

const byteSizeUnits = [ "B", "KB", "MB", "GB", "TB" ];

/**
 * Format a non-negative byte count using `B`, `KB`, `MB`, `GB`, or `TB`.
 *
 * Scaling defaults to 1024 with one fractional digit. Byte values omit
 * insignificant trailing zeroes, while scaled values retain the requested
 * number of fractional digits. Values beyond terabytes remain expressed in
 * `TB`.
 *
 * Usage:
 *
 * ```javascript
 * import { formatByteSize } from "mazey";
 *
 * formatByteSize(0);       // "0 B"
 * formatByteSize(1536);    // "1.5 KB"
 * formatByteSize(1500000, { base: 1000, fractionDigits: 2 }); // "1.50 MB"
 * ```
 *
 * @param bytes Byte count to format.
 * @param options Formatting options.
 * @returns A formatted byte-size string, or `invalidValue` for invalid input.
 * @category Util
 */
export function formatByteSize(
  bytes: number,
  options: FormatByteSizeOptions = {},
): string {
  const {
    base = 1024,
    fractionDigits = 1,
    invalidValue = "",
  } = options;
  if (
    !Number.isFinite(bytes) ||
    bytes < 0 ||
    (base !== 1000 && base !== 1024) ||
    !Number.isInteger(fractionDigits) ||
    fractionDigits < 0 ||
    fractionDigits > 20
  ) {
    return invalidValue;
  }

  let value = bytes;
  let unitIndex = 0;
  while (value >= base && unitIndex < byteSizeUnits.length - 1) {
    value /= base;
    unitIndex += 1;
  }

  if (unitIndex === 0) {
    return `${Number(value.toFixed(fractionDigits))} ${byteSizeUnits[unitIndex]}`;
  }
  return `${value.toFixed(fractionDigits)} ${byteSizeUnits[unitIndex]}`;
}

/**
 * Deprecated alias of `formatByteSize`.
 *
 * @deprecated Use `formatByteSize` instead.
 * @param size Byte count to format.
 * @param options Formatting options.
 * @returns The result of `formatByteSize`.
 * @category Util
 */
export function getFileSize(
  size: number,
  options: FormatByteSizeOptions = {},
): string {
  return formatByteSize(size, options);
}

/**
 * Generate a Hash Code from a string.
 *
 * Usage:
 *
 * ```javascript
 * import { genHashCode } from "mazey";
 *
 * const ret = genHashCode("hello world");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 1794106052
 * ```
 *
 * Reference: [Generate a Hash from string in Javascript](https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery)
 *
 * @category Util
 */
export function genHashCode(str: string): number {
  let hash = 0,
    i,
    chr;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}

/**
 * Generate a lowercase SHA-256 hexadecimal digest with the Web Crypto API.
 *
 * Usage:
 *
 * ```javascript
 * import { sha256Hex } from "mazey";
 *
 * const digest = await sha256Hex("hello world");
 * console.log(digest);
 * ```
 *
 * Output:
 *
 * ```text
 * b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
 * ```
 *
 * @remarks Requires Web Crypto. String input also requires `TextEncoder`.
 * @param input Text or binary data to hash.
 * @returns A promise that resolves to the lowercase hexadecimal digest.
 * @throws When the required platform API is unavailable. Digest failures are propagated.
 * @category Util
 */
export async function sha256Hex(input: string | BufferSource): Promise<string> {
  const cryptoApi = typeof crypto === "undefined" ? null : crypto;
  if (!cryptoApi?.subtle || typeof cryptoApi.subtle.digest !== "function") {
    throw new Error("Web Crypto API is not available.");
  }

  let data: BufferSource = input as BufferSource;
  if (typeof input === "string") {
    if (typeof TextEncoder === "undefined") {
      throw new Error("TextEncoder is not available.");
    }
    data = new TextEncoder().encode(input);
  }

  const hashBuffer = await cryptoApi.subtle.digest("SHA-256", data);
  let digest = "";
  const bytes = new Uint8Array(hashBuffer);
  for (let index = 0; index < bytes.length; index++) {
    const hexByte = bytes[index].toString(16);
    digest += hexByte.length === 1 ? `0${hexByte}` : hexByte;
  }
  return digest;
}

const localDateStringPattern = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;
const zonedDateStringPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/;

function hasMatchingDateComponents(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond = 0,
  utc = false
): boolean {
  const date = new Date(0);
  if (utc) {
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(hour, minute, second, millisecond);
    return Number.isFinite(date.getTime())
      && date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day
      && date.getUTCHours() === hour
      && date.getUTCMinutes() === minute
      && date.getUTCSeconds() === second
      && date.getUTCMilliseconds() === millisecond;
  }

  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, second, millisecond);
  return Number.isFinite(date.getTime())
    && date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    && date.getHours() === hour
    && date.getMinutes() === minute
    && date.getSeconds() === second
    && date.getMilliseconds() === millisecond;
}

function createLocalDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): Date {
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, second, 0);
  return date;
}

function createZonedDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timezone: string
): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  if (timezone === "Z") {
    return date;
  }

  const direction = timezone[0] === "+" ? 1 : -1;
  const offsetMinutes =
    Number(timezone.slice(1, 3)) * 60 + Number(timezone.slice(4, 6));
  return new Date(date.getTime() - direction * offsetMinutes * 60 * 1000);
}

function toValidDate(value: unknown): Date | null {
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(value) && Number.isFinite(date.getTime())
      ? date
      : null;
  }

  if (typeof value === "object" && value !== null) {
    const dateTime = getDateTime(value);
    return dateTime !== null && Number.isFinite(dateTime)
      ? new Date(dateTime)
      : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const localMatch = localDateStringPattern.exec(trimmedValue);
  if (localMatch) {
    const [ year, month, day, hour = "0", minute = "0", second = "0" ] =
      localMatch.slice(1);
    const [ numericYear, numericMonth, numericDay, numericHour, numericMinute, numericSecond ] =
      [ year, month, day, hour, minute, second ].map(Number);
    if (!hasMatchingDateComponents(
      numericYear,
      numericMonth,
      numericDay,
      numericHour,
      numericMinute,
      numericSecond
    )) {
      return null;
    }
    return createLocalDate(
      numericYear,
      numericMonth,
      numericDay,
      numericHour,
      numericMinute,
      numericSecond
    );
  }

  const zonedMatch = zonedDateStringPattern.exec(trimmedValue);
  if (!zonedMatch) {
    return null;
  }

  const [ year, month, day, hour, minute, second = "0", fraction = "", timezone ] =
    zonedMatch.slice(1);
  const millisecond = Number(`${fraction}00`.slice(0, 3));
  if (!hasMatchingDateComponents(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    millisecond,
    true
  )) {
    return null;
  }

  if (timezone !== "Z") {
    const offsetHour = Number(timezone.slice(1, 3));
    const offsetMinute = Number(timezone.slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) {
      return null;
    }
  }

  return createZonedDate(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    millisecond,
    timezone
  );
}

/**
 * Check whether an unknown value represents a valid date.
 *
 * Valid inputs include `Date` instances, finite millisecond timestamps,
 * structured local date strings, and ISO 8601 strings with `Z` or a numeric
 * timezone offset. Structured strings are parsed into numeric components and
 * validated strictly, so invalid calendar dates are not normalized.
 *
 * Supported string forms are `YYYY-MM-DD`, `YYYY-MM-DD HH:mm[:ss]`,
 * `YYYY-MM-DDTHH:mm[:ss]`, and the same `T`-separated date-time with `Z` or
 * a `+HH:mm`/`-HH:mm` offset. Zoned strings may include 1-3 millisecond digits.
 *
 * Usage:
 *
 * ```javascript
 * import { isValidDate } from "mazey";
 *
 * const ret1 = isValidDate(1577877720000);
 * const ret2 = isValidDate("2020-01-01 11:22");
 * const ret3 = isValidDate("2020-02-30");
 * const ret4 = isValidDate(new Date("invalid"));
 *
 * console.log(ret1, ret2, ret3, ret4);
 * ```
 *
 * Output:
 *
 * ```text
 * true true false false
 * ```
 *
 * @param value A `Date`, millisecond timestamp, or supported structured date string.
 * @returns Whether the value represents a valid date.
 * @category Util
 */
export function isValidDate(value: unknown): boolean {
  return toValidDate(value) !== null;
}

/**
 * Check whether a date is today in the runtime's local timezone.
 *
 * Usage:
 *
 * ```javascript
 * import { isToday } from "mazey";
 *
 * const ret = isToday(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value has the current local year, month, and day. Invalid input returns `false`.
 * @remarks Hours, minutes, seconds, and milliseconds are ignored. Results depend on the runtime's local timezone.
 * @category Util
 */
export function isToday(date: MazeyDate): boolean {
  const target = toValidDate(date);
  if (!target) return false;
  const now = new Date();
  return target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth()
    && target.getDate() === now.getDate();
}

/**
 * Check whether a date is in the current local calendar year.
 *
 * Usage:
 *
 * ```javascript
 * import { isThisYear } from "mazey";
 *
 * const ret = isThisYear(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value has the current local year. Invalid input returns `false`.
 * @remarks Results depend on the runtime's local timezone.
 * @category Util
 */
export function isThisYear(date: MazeyDate): boolean {
  const target = toValidDate(date);
  return target !== null && target.getFullYear() === new Date().getFullYear();
}

/**
 * Check whether a date is in the current local calendar month and year.
 *
 * Usage:
 *
 * ```javascript
 * import { isThisMonth } from "mazey";
 *
 * const ret = isThisMonth(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value has the current local year and month. Invalid input returns `false`.
 * @remarks Results depend on the runtime's local timezone.
 * @category Util
 */
export function isThisMonth(date: MazeyDate): boolean {
  const target = toValidDate(date);
  if (!target) return false;
  const now = new Date();
  return target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth();
}

/**
 * Check whether a date is in the current Monday-first local calendar week.
 *
 * Usage:
 *
 * ```javascript
 * import { isThisWeek } from "mazey";
 *
 * const ret = isThisWeek(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value is in the current local week. Invalid input returns `false`.
 * @remarks The week begins on Monday and ends before the following Monday. Boundaries use local time and a half-open range.
 * @category Util
 */
export function isThisWeek(date: MazeyDate): boolean {
  const target = toValidDate(date);
  if (!target) return false;

  const startOfWeek = new Date();
  const daysSinceMonday = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
  const startOfNextWeek = new Date(startOfWeek.getTime());
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
  const targetTime = target.getTime();
  return targetTime >= startOfWeek.getTime()
    && targetTime < startOfNextWeek.getTime();
}

/**
 * Check whether a date is within the current local clock hour.
 *
 * Usage:
 *
 * ```javascript
 * import { isThisHour } from "mazey";
 *
 * const ret = isThisHour(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value has the current local year, month, day, and hour. Invalid input returns `false`.
 * @remarks Minutes, seconds, and milliseconds are ignored. Results depend on the runtime's local timezone.
 * @category Util
 */
export function isThisHour(date: MazeyDate): boolean {
  const target = toValidDate(date);
  if (!target) return false;
  const now = new Date();
  return target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth()
    && target.getDate() === now.getDate()
    && target.getHours() === now.getHours();
}

function formatApproximateDistance(value: number, unit: string): string {
  const roundedValue = Math.max(1, Math.round(value));
  return `about ${roundedValue} ${unit}${roundedValue === 1 ? "" : "s"}`;
}

/**
 * Format the absolute distance from a date to now in concise English words.
 *
 * Usage:
 *
 * ```javascript
 * import { formatDistanceToNow } from "mazey";
 *
 * const ret = formatDistanceToNow(new Date(Date.now() - 60 * 60 * 1000));
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * about 1 hour
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns The absolute approximate distance phrase, or an empty string for invalid input.
 * @remarks Past and future dates use the same wording without `ago` or `in`. Months and years use fixed approximate durations of 30 and 365 days.
 * @category Util
 */
export function formatDistanceToNow(date: MazeyDate): string {
  const target = toValidDate(date);
  if (!target) return "";

  const secondMs = 1000;
  const minuteMs = 60 * secondMs;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const distanceMs = Math.abs(target.getTime() - Date.now());

  if (distanceMs < 30 * secondMs) return "less than a minute";
  if (distanceMs < 90 * secondMs) return "about 1 minute";
  if (distanceMs < 45 * minuteMs) {
    return formatApproximateDistance(distanceMs / minuteMs, "minute");
  }
  if (distanceMs < 90 * minuteMs) return "about 1 hour";
  if (distanceMs < 24 * hourMs) {
    return formatApproximateDistance(distanceMs / hourMs, "hour");
  }
  if (distanceMs < 42 * hourMs) return "about 1 day";
  if (distanceMs < 30 * dayMs) {
    return formatApproximateDistance(distanceMs / dayMs, "day");
  }
  if (distanceMs < 45 * dayMs) return "about 1 month";
  if (distanceMs < 365 * dayMs) {
    return formatApproximateDistance(distanceMs / (30 * dayMs), "month");
  }
  if (distanceMs < 545 * dayMs) return "about 1 year";
  return formatApproximateDistance(distanceMs / (365 * dayMs), "year");
}

/**
 * Return the formatted date string in the given format.
 *
 * Supported format tokens:
 *
 * | Token  | Meaning                                | Range or example |
 * | ------ | -------------------------------------- | ---------------- |
 * | `yyyy` | Four-digit year                        | `2022`           |
 * | `MM`   | Two-digit month                        | `01`–`12`        |
 * | `dd`   | Two-digit day of the month             | `01`–`31`        |
 * | `HH`   | Two-digit hour using the 24-hour clock | `00`–`23`        |
 * | `hh`   | Two-digit hour using the 12-hour clock | `01`–`12`        |
 * | `mm`   | Two-digit minute                       | `00`–`59`        |
 * | `ss`   | Two-digit second                       | `00`–`59`        |
 * | `a`    | Uppercase meridiem indicator           | `AM` or `PM`     |
 *
 * The function creates a native `Date` and reads its local date and time
 * fields. Timestamp output can therefore differ between runtime time zones.
 *
 * Usage:
 *
 * ```javascript
 * import { formatDate } from "mazey";
 *
 * const ret1 = formatDate();
 * const ret2 = formatDate("Tue Jan 11 2022 14:12:26 GMT+0800 (China Standard Time)", "yyyy-MM-dd hh:mm:ss a");
 * const ret3 = formatDate(1641881235000, "yyyy-MM-dd hh:mm:ss a");
 * const ret4 = formatDate(new Date(2014, 1, 11), "MM/dd/yyyy");
 * console.log("Default formatDate value:", ret1);
 * console.log("String formatDate value:", ret2);
 * console.log("Number formatDate value:", ret3);
 * console.log("Date formatDate value:", ret4);
 * ```
 *
 * Output:
 *
 * ```text
 * Default formatDate value: 2023-01-11
 * String formatDate value: 2022-01-11 02:12:26 PM
 * Number formatDate value: 2022-01-11 02:07:15 PM
 * Date formatDate value: 02/11/2014
 * ```
 *
 * @param {MazeyDate} dateIns Original date value. Defaults to the current date and time.
 * @param {string} format Format string composed of supported format tokens. Defaults to `yyyy-MM-dd`.
 * @returns {string} The formatted date string.
 * @throws {RangeError} If `dateIns` is not a valid date.
 * @category Util
 */
export function formatDate(dateIns?: MazeyDate, format = "yyyy-MM-dd"): string {
  if (dateIns === undefined) {
    dateIns = new Date();
  }
  const tempDate = new Date(dateIns);
  if (!Number.isFinite(tempDate.getTime())) {
    throw new RangeError("Invalid date");
  }
  const hours = tempDate.getHours();
  const o: {
    [key: string]: string | number;
  } = {
    yyyy: tempDate.getFullYear(),
    MM: tempDate.getMonth() + 1,
    dd: tempDate.getDate() < 10 ? "0" + tempDate.getDate() : tempDate.getDate(),
    HH: hours < 10 ? "0" + hours : hours,
    hh: ((hours % 12) || 12) < 10 ? "0" + ((hours % 12) || 12) : (hours % 12) || 12,
    mm: tempDate.getMinutes() < 10 ? "0" + tempDate.getMinutes() : tempDate.getMinutes(),
    ss: tempDate.getSeconds() < 10 ? "0" + tempDate.getSeconds() : tempDate.getSeconds(),
    a: hours < 12 ? "AM" : "PM",
  };
  let tempFormat = format || "yyyy-MM-dd";
  Object.keys(o).forEach(key => {
    let value = o[key];
    if (key === "MM" && Number(value) <= 9) {
      value = `0${value}`;
    }
    tempFormat = tempFormat.split(key).join(String(value));
  });
  return tempFormat;
}

/**
 * Generate a local-time Calendar Versioning string from a date.
 *
 * The conceptual format is `yyyy.MMdd.HHmmss`. Leading zeroes are removed
 * from each segment to keep numeric Semantic Versioning identifiers valid.
 *
 * Usage:
 *
 * ```javascript
 * import { generateCalendarVersion } from "mazey";
 *
 * const ret = generateCalendarVersion(new Date(2026, 6, 11, 7, 40, 35));
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 2026.711.74035
 * ```
 *
 * @param {MazeyDate} dateIns Original date. Defaults to the current date.
 * @returns {string} Return the generated calendar version.
 * @throws {RangeError} If `dateIns` is not a valid date.
 * @category Util
 */
export function generateCalendarVersion(dateIns?: MazeyDate): string {
  const normalizedDateIns = dateIns === undefined
    ? new Date()
    : new Date(dateIns instanceof Date ? dateIns.getTime() : dateIns);
  return formatDate(normalizedDateIns, "yyyy.MMdd.HHmmss")
    .split(".")
    .map(segment => String(Number(segment)))
    .join(".");
}

/**
 * Check if the given string is a mobile phone number.
 *
 * Usage:
 *
 * ```javascript
 * import { isMobile } from "mazey";
 *
 * const ret1 = isMobile("13800138000");
 * const ret2 = isMobile("1380013800");
 * const ret3 = isMobile("138001380000");
 * const ret4 = isMobile("1380013800a");
 * console.log(ret1, ret2, ret3, ret4);
 * ```
 *
 * Output:
 *
 * ```text
 * true false false false
 * ```
 *
 * @param mobile
 * @returns {boolean} Return true if the given string is a mobile phone number.
 * @category Util
 */
export function isValidPhoneNumber(mobile: string): boolean {
  const reg = /^1\d{10}$/;
  return reg.test(mobile);
}

/**
 * Check if the given string is a valid email.
 *
 * Usage:
 *
 * ```javascript
 * import { isValidEmail } from "mazey";
 *
 * const ret = isValidEmail("mazeyqian@gmail.com");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param email
 * @returns {boolean} Return true if the given string is a valid email.
 * @category Util
 */
export function isValidEmail(email: string): boolean {
  const reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return reg.test(email);
}

/**
 * Convert a given 10-hex number to a lowercase 26-hex string.
 *
 * Usage:
 *
 * ```javascript
 * import { convert10To26 } from "mazey";
 *
 * const ret1 = convert10To26(1);
 * const ret2 = convert10To26(26);
 * const ret3 = convert10To26(27);
 * const ret4 = convert10To26(52);
 * const ret5 = convert10To26(53);
 * console.log(ret1, ret2, ret3, ret4, ret5);
 * ```
 *
 * Output:
 *
 * ```text
 * a z aa az ba
 * ```
 *
 * @param {number} num
 * @returns {string} Return a lowercase 26-hex string.
 * @category Util
 */
export function convert10To26(num: number): string {
  if (!Number.isFinite(num) || num <= 0) {
    return "";
  }
  num = Math.floor(num);
  let result = "";
  while (num > 0) {
    let remainder = num % 26;
    if (remainder === 0) {
      remainder = 26;
    }
    result = String.fromCharCode(remainder + 96) + result;
    num = (num - remainder) / 26;
  }
  return result;
}

/**
 * Get the current version.
 *
 * @hidden
 */
export function getCurrentVersion(): string {
  return "v4";
}

/**
 * Repeatedly fires a callback function with a certain interval until a specified condition is met.
 *
 * Usage:
 *
 * ```javascript
 * import { repeatUntilConditionMet } from "mazey";
 *
 * repeatUntilConditionMet(
 *   () => {
 *     console.log("repeatUntilConditionMet");
 *     return true;
 *   }, {
 *     interval: 1000,
 *     times: 10,
 *     context: null,
 *     args: [],
 *   }, (result) => {
 *     return result === true;
 *   }
 * );
 * ```
 *
 * @param callback The callback function to fire.
 * @param options Controls the interval, maximum invocation count, callback context, and callback arguments.
 * @param condition A function that takes the result of the callback function as its argument and returns a boolean value indicating whether the condition has been met. Defaults to a function that always returns true.
 * @category Util
 */
export function repeatUntilConditionMet<T extends (...args: MazeyFnParams) => MazeyFnReturn>(
  callback: T,
  options: RepeatUntilOptions = {},
  condition: (result: ReturnType<T>) => boolean = res => {
    return res === true;
  }
): void {
  const { interval = 1000, times = 10, context, args } = options;
  if (typeof callback !== "function") {
    console.error("Expected a function.");
    return;
  }

  if (!Number.isFinite(interval) || interval < 0) {
    console.error("Expected a non-negative number for interval.");
    return;
  }

  if (!Number.isFinite(times) || times < 0) {
    console.error("Expected a non-negative number for times.");
    return;
  }

  if (times === 0) {
    return;
  }

  let count = 0;

  const clearAndInvokeNext = () => {
    setTimeout(async () => {
      const result = await callback.apply(context, args as MazeyFnParams);
      if (condition(result) || ++count >= times) {
        return;
      }
      clearAndInvokeNext();
    }, interval);
  };

  clearAndInvokeNext();
}

/**
 * Wait for a specified amount of time.
 *
 * Usage:
 *
 * ```javascript
 * import { waitTime } from "mazey";
 *
 * waitTime(1000).then((time) => {
 *  console.log("waitTime:", time);
 * });
 * ```
 *
 * Output:
 *
 * ```text
 * waitTime: 1000
 * ```
 *
 * @param time The amount of time to wait, in milliseconds.
 * @returns A Promise that resolves after the specified time has elapsed.
 * @category Util
 */
export async function waitTime(time: number): Promise<number> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(time);
    }, time);
  });
}

/**
 * Alias of `waitTime`.
 *
 * @hidden
 */
export async function sleep(time: number): Promise<number> {
  return waitTime(time);
}

let runtimeEnv = "";

/**
 * Determine if it is a browser environment.
 *
 * Usage:
 *
 * ```javascript
 * import { isBrowser } from "mazey";
 *
 * const ret = isBrowser();
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @returns {boolean} true Yes
 * @category Browser Information
 */
export function isBrowser(): boolean {
  if (runtimeEnv) {
    return runtimeEnv === "browser";
  }
  const isInBrowser = typeof window !== "undefined";
  if (isInBrowser) {
    runtimeEnv = "browser";
  }
  return isInBrowser;
}
