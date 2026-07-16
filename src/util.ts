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
  str = str.replace(/^\s+/, ""); // 去除头部空格
  let end = str.length - 1;
  const ws = /\s/;
  while (ws.test(str.charAt(end))) {
    end--; // 最后一个非空格字符的索引
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
 * EN: Generate a unique identifier number based on time: `genUniqueNumString()` => `1538324722364123`
 *
 * ZH: 根据时间生成唯一标志的数字：`genUniqueNumString()` => `1538324722364123`。
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
 * @param {number} n 随机数的长度
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
 * EN: Get timestamp.
 *
 * ZH: 获取时间戳。
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
 * EN: Floating point number to percentage 0.2 => 20%
 *
 * ZH: 浮点数转为百分比 0.2 => 20%。
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
 * @param {number} num 浮点数
 * @param {number} fixSize 保留几位浮点数
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
 * EN: Keep the specified number of decimal places for floating-point numbers.
 *
 * ZH: 浮点数保留指定位。
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
 * @category Util
 */
export function floatFixed(num: number | string, size = 0): string {
  return parseFloat(String(num)).toFixed(size);
}

/**
 * EN: Throttle, used to limit the frequency of function execution over time.
 *
 * ZH: 节流，用于限制函数在一段时间内的执行频率。
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
 * EN: Debounce, used to delay the execution of a function until a specified time has passed since the last invocation.
 *
 * ZH: 防抖，用于在最后一次调用后的指定时间内延迟函数的执行。
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
 * EN: Check whether it is a right number.
 *
 * ZH: 判断是否有效数字。
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
 * @param {*} num 被判断的值
 * @param options Controls whether `NaN`, `Infinity`, or other non-finite values count as numbers.
 * @returns {boolean} true 是数字
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
 * EN: Invoke effective function.
 *
 * ZH: 执行有效函数。
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
 * @param {function} fn 等待被执行的未知是否有效的函数
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
 * @param {string} str 带 HTML 标签的字符串
 * @returns {string} 字符串
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
 * EN: Truncate string, Chinese characters count as 2 bytes.
 *
 * ZH: 截取字符串，中文算 2 个字节。
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
 * @param {string} str 要截取的字符串
 * @param {number} len
 * @param {boolean} options.hasDot
 * @param {string} options.dotText
 * @returns {string} 返回截取后的字符串
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
 *
 * @param {string} str 要截取的字符串
 * @param {number} len
 * @param {boolean} hasDot
 * @returns {string} 返回截取后的字符串
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
 * EN: Semantic file size, convert bytes into a readable file size.
 *
 * ZH: 语义化文件大小，把字节转换成正常文件大小。
 *
 * Usage:
 *
 * ```javascript
 * import { getFileSize } from "mazey";
 *
 * const ret = getFileSize(1024);
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 1 KB
 * ```
 *
 * @category Util
 */
export function getFileSize(size: number): string {
  const toCeilStr: (v: number) => string = n => String(Math.ceil(n));
  if (!Number.isFinite(size) || size <= 0) return "";
  const num = 1024.0; // byte
  if (size < num) {
    return size + " B";
  }
  if (size < Math.pow(num, 2)) {
    return toCeilStr(size / num) + " KB";
  } // kb
  if (size < Math.pow(num, 3)) {
    return toCeilStr(size / Math.pow(num, 2)) + " MB";
  } // M
  if (size < Math.pow(num, 4)) {
    return toCeilStr(size / Math.pow(num, 3)) + " G";
  } // G
  return toCeilStr(size / Math.pow(num, 4)) + " T";
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
 * Return the formatted date string in the given format.
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
 * @param {MazeyDate} dateIns Original Date
 * @param {string} format Format String
 * @returns {string} Return the formatted date string.
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
