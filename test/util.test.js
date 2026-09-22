/**
 * @jest-environment node
 */
/* eslint-disable no-undef */
import {
  camelCaseToKebabCase, camelCase2Underscore,
  deepCopy, deepCopyObject, deepFreeze, repeatUntilConditionMet,
  formatDate, generateCalendarVersion, isValidDate, isBrowser, waitTime, isArray,
  isJsonString, isNumber, isPureObject, isNonEmptyObject,
  isValidData, isValidEmail, isValidPhoneNumber, isNonEmptyArray,
  getDateDifference, getFriendlyInterval, formatDurationFromMs, getFileSize, getCurrentVersion,
  genUniqueNumString, generateRndNum, genHashCode,
  floatToPercent, floatFixed, throttle, debounce,
  doFn, mTrim, removeHtml, truncateZHString,
  convertKebabToCamel, convert10To26, zAxiosIsValidRes,
  unsanitize, sanitizeInput, unsanitizeInput,
  isFunction, isString, isBoolean, isUdfOrNul, toJavaScriptGlobalName,
} from "../lib/index.esm";
import { runInNewContext } from "vm";

test("isNumber: Is -1/123/Infinity/NaN Number?", () => {
  expect(isNumber(-1)).toBe(true);
  expect(isNumber(123)).toBe(true);
  expect(isNumber("123")).toBe(false);
  expect(isNumber(Infinity)).toBe(false);
  expect(isNumber(Infinity, { isInfinityAsNumber: true })).toBe(true);
  expect(isNumber(NaN)).toBe(false);
  expect(isNumber(NaN, { isNaNAsNumber: true, isInfinityAsNumber: true })).toBe(true);
});

test("camelCaseToKebabCase: Transfer 'aBC' to 'a-b-c'?", () => {
  expect(camelCaseToKebabCase("aBC")).toBe("a-b-c");
});

test("camelCase2Underscore: Transfer 'ABC' to 'a_b_c'?", () => {
  expect(camelCase2Underscore("ABC")).toBe("a_b_c");
});

describe("toJavaScriptGlobalName", () => {
  it.each([
    [ "my-library", "MY_LIBRARY" ],
    [ "@scope/my-library", "_SCOPE_MY_LIBRARY" ],
    [ "9patch", "_9PATCH" ],
    [ "$cache_key", "$CACHE_KEY" ],
    [ "", "_" ],
    [ "a..b", "A__B" ],
    [ "工具", "__" ],
  ])("converts %p to %p", (value, expected) => {
    expect(toJavaScriptGlobalName(value)).toBe(expected);
  });

  it("rejects non-string runtime input", () => {
    expect(() => toJavaScriptGlobalName(123)).toThrow(TypeError);
  });

  it("is repeatable and does not mutate the input", () => {
    const value = "@scope/my-library";
    expect(toJavaScriptGlobalName(value)).toBe(toJavaScriptGlobalName(value));
    expect(value).toBe("@scope/my-library");
  });
});

test("mTrim: Transfer ' 1 2 3 ' to '1 2 3'?", () => {
  expect(mTrim(" 1 2 3 ")).toBe("1 2 3");
});

test("mTrim: Transfer 'abc ' to 'abc'?", () => {
  expect(mTrim("abc ")).toBe("abc");
});

test("deepCopyObject: Transfer 'abc' to 'abc'?", () => {
  expect(deepCopyObject("abc")).toBe("abc");
});

describe("deepCopy", () => {
  it("preserves arrays while cloning nested values", () => {
    const value = [ { id: 1 }, [ 2 ] ];
    const result = deepCopy(value);

    expect(result).toEqual(value);
    expect(Array.isArray(result)).toBe(true);
    expect(result).not.toBe(value);
    expect(result[0]).not.toBe(value[0]);
    expect(result[1]).not.toBe(value[1]);
  });

  it("returns null unchanged and clones Date instances", () => {
    const date = new Date(1234);

    expect(deepCopy(null)).toBeNull();
    expect(deepCopy(date)).toEqual(date);
    expect(deepCopy(date)).not.toBe(date);
  });

  it("preserves circular references and values that JSON serialization loses", () => {
    const symbol = Symbol("symbol");
    const value = {
      nested: { optional: undefined },
      pattern: /mazey/gi,
      map: new Map([ [ "key", { value: 1 } ] ]),
      [symbol]: "symbol value",
    };
    value.self = value;

    const result = deepCopy(value);

    expect(result).not.toBe(value);
    expect(result.self).toBe(result);
    expect(result.nested).toEqual({ optional: undefined });
    expect(result.nested).not.toBe(value.nested);
    expect(result.pattern).toEqual(/mazey/gi);
    expect(result.map.get("key")).toEqual({ value: 1 });
    expect(result.map.get("key")).not.toBe(value.map.get("key"));
    expect(result[symbol]).toBe("symbol value");
  });

  it.each([ "d", "v" ])("preserves the supported RegExp %s flag", flag => {
    let pattern;
    try {
      pattern = new RegExp("a", flag);
    } catch (error) {
      return;
    }

    const result = deepCopy(pattern);

    expect(result.flags).toBe(pattern.flags);
  });

  it("clones supported built-ins from another realm", () => {
    const value = runInNewContext(`({
      date: new Date(1234),
      pattern: /mazey/g,
      map: new Map([["key", { value: 1 }]]),
      set: new Set([{ value: 2 }]),
      bytes: new Uint8Array([10, 20])
    })`);

    const result = deepCopy(value);

    expect(result).not.toBe(value);
    expect(result.date).not.toBe(value.date);
    expect(result.date.getTime()).toBe(1234);
    expect(result.pattern).not.toBe(value.pattern);
    expect(result.pattern.flags).toBe("g");
    expect(result.map).not.toBe(value.map);
    expect(result.map.get("key")).toEqual({ value: 1 });
    expect(result.map.get("key")).not.toBe(value.map.get("key"));
    expect(result.set).not.toBe(value.set);
    expect(result.bytes).not.toBe(value.bytes);
    expect(Array.from(result.bytes)).toEqual([ 10, 20 ]);
    expect(result.bytes.buffer).not.toBe(value.bytes.buffer);
  });

  it("does not use Symbol.toStringTag as a built-in brand", () => {
    const value = {
      nested: { id: 1 },
      [Symbol.toStringTag]: "Date",
    };

    const result = deepCopy(value);

    expect(result).not.toBe(value);
    expect(result.nested).toEqual({ id: 1 });
    expect(result.nested).not.toBe(value.nested);
    expect(result[Symbol.toStringTag]).toBe("Date");
  });

  it("clones binary views with a valid shared backing buffer", () => {
    const buffer = new ArrayBuffer(4);
    const bytes = new Uint8Array(buffer);
    bytes.set([ 10, 20, 30, 40 ]);
    const value = {
      buffer,
      bytes: new Uint8Array(buffer, 1, 2),
      view: new DataView(buffer, 1, 2),
    };

    const result = deepCopy(value);

    expect(result.buffer).not.toBe(buffer);
    expect(result.bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(result.bytes)).toEqual([ 20, 30 ]);
    expect(result.view).toBeInstanceOf(DataView);
    expect(result.view.getUint8(0)).toBe(20);
    expect(result.bytes.buffer).toBe(result.buffer);
    expect(result.view.buffer).toBe(result.buffer);
  });

  it("clones SharedArrayBuffer views when the runtime supports them", () => {
    if (typeof SharedArrayBuffer === "undefined") return;
    const buffer = new SharedArrayBuffer(2);
    new Uint8Array(buffer).set([ 10, 20 ]);

    const result = deepCopy({
      buffer,
      bytes: new Uint8Array(buffer),
    });

    expect(result.buffer).not.toBe(buffer);
    expect(Array.from(result.bytes)).toEqual([ 10, 20 ]);
    expect(result.bytes.buffer).toBe(result.buffer);
  });

  it("preserves unsupported native objects instead of creating invalid instances", async () => {
    const promise = Promise.resolve("value");
    const weakMap = new WeakMap();

    const result = deepCopy({ promise, weakMap });

    expect(result.promise).toBe(promise);
    expect(result.weakMap).toBe(weakMap);
    await expect(result.promise).resolves.toBe("value");
    expect(() => result.weakMap.has({})).not.toThrow();
  });

  it("clones custom class state without aliasing the original instance", () => {
    class Secret {
      #value = 42;

      constructor() {
        this.options = { enabled: true };
      }

      read() {
        return this.#value;
      }
    }
    const value = new Secret();

    const result = deepCopy(value);

    expect(result).not.toBe(value);
    expect(result.options).toEqual({ enabled: true });
    expect(result.options).not.toBe(value.options);
    result.options.enabled = false;
    expect(value.options.enabled).toBe(true);
    expect(result.read).toBeUndefined();
    expect(value.read()).toBe(42);
  });

  it("clones primitives and circular plain objects without WeakMap", () => {
    const originalWeakMap = global.WeakMap;
    const value = { nested: { id: 1 } };
    value.self = value;
    let primitiveResult;
    let objectResult;
    try {
      global.WeakMap = undefined;
      primitiveResult = deepCopy("abc");
      objectResult = deepCopy(value);
    } finally {
      global.WeakMap = originalWeakMap;
    }

    expect(primitiveResult).toBe("abc");
    expect(objectResult).toEqual(value);
    expect(objectResult).not.toBe(value);
    expect(objectResult.nested).not.toBe(value.nested);
    expect(objectResult.self).toBe(objectResult);
  });
});

describe("deepFreeze", () => {
  it("recursively freezes nested objects and arrays", () => {
    const value = {
      config: {
        entries: [
          { enabled: true },
        ],
      },
    };

    const result = deepFreeze(value);

    expect(result).toBe(value);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.config)).toBe(true);
    expect(Object.isFrozen(result.config.entries)).toBe(true);
    expect(Object.isFrozen(result.config.entries[0])).toBe(true);
  });

  it.each([ null, undefined, false, 0, "mazey" ])(
    "returns the primitive value %p unchanged",
    value => {
      expect(deepFreeze(value)).toBe(value);
    },
  );

  it("returns an already-frozen object unchanged", () => {
    const value = Object.freeze({ enabled: true });

    expect(deepFreeze(value)).toBe(value);
    expect(Object.isFrozen(value)).toBe(true);
  });

  it("freezes circular object graphs without overflowing", () => {
    const value = { child: {} };
    value.child.parent = value;

    expect(deepFreeze(value)).toBe(value);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.child)).toBe(true);
  });
});

test("isJsonString: Is '['a', 'b', 'c']' a valid JSON string?", () => {
  expect(isJsonString("['a', 'b', 'c']")).toBe(false);
});

test("isJsonString: Is '[\"a\", \"b\", \"c\"]' a valid JSON string?", () => {
  expect(isJsonString("[\"a\", \"b\", \"c\"]")).toBe(true);
});

test("isJsonString: Accept valid JSON primitive values", () => {
  expect(isJsonString("123")).toBe(true);
  expect(isJsonString("true")).toBe(true);
  expect(isJsonString("null")).toBe(true);
});

test("isJsonString: Reject non-string values", () => {
  expect(isJsonString(123)).toBe(false);
  expect(isJsonString(true)).toBe(false);
});

test("generateRndNum: Can it produce an empty string?", () => {
  expect(generateRndNum(0)).toBe("");
});

test("generateRndNum: Invalid lengths terminate with an empty string", () => {
  expect(generateRndNum(-1)).toBe("");
  expect(generateRndNum(Infinity)).toBe("");
  expect(generateRndNum(NaN)).toBe("");
  expect(generateRndNum(2.9)).toHaveLength(2);
});

test("formatDate: String formatDate value?", () => {
  expect(formatDate("Tue Jan 11 2022 14:12:26 GMT+0800 (China Standard Time)", "yyyy-MM-dd hh:mm:ss").length).toBe(19);
  expect(formatDate(new Date(2022, 0, 11, 14, 12, 26), "yyyy-MM-dd hh:mm:ss")).toBe("2022-01-11 02:12:26");
});

test("formatDate: Number formatDate value?", () => {
  expect(formatDate(1641881235000, "yyyy-MM-dd hh:mm:ss").length).toBe(19);
  expect(formatDate(new Date(2022, 0, 11, 14, 7, 15), "yyyy-MM-dd hh:mm:ss")).toBe("2022-01-11 02:07:15");
});

test("formatDate: String formatDate value with 12-hour format and AM/PM", () => {
  expect(formatDate("Tue Jan 11 2022 14:12:26 GMT+0800 (China Standard Time)", "yyyy-MM-dd hh:mm:ss a").length).toBe(22);
  expect(formatDate(new Date(2022, 0, 11, 14, 12, 26), "yyyy-MM-dd hh:mm:ss a")).toBe("2022-01-11 02:12:26 PM");
});

test("formatDate: Number formatDate value with 12-hour format and AM/PM", () => {
  expect(formatDate(1641881235000, "yyyy-MM-dd hh:mm:ss a").length).toBe(22);
  expect(formatDate(new Date(2022, 0, 11, 14, 7, 15), "yyyy-MM-dd hh:mm:ss a")).toBe("2022-01-11 02:07:15 PM");
});

test("formatDate: Date object formatDate value with 12-hour format and AM/PM", () => {
  expect(formatDate(new Date(2014, 1, 11, 14, 30), "MM/dd/yyyy hh:mm a").length).toBe(19);
  expect(formatDate(new Date(2014, 1, 11, 14, 30), "MM/dd/yyyy hh:mm a")).toBe("02/11/2014 02:30 PM");
});

test("formatDate: String formatDate value with 24-hour format", () => {
  expect(formatDate("Tue Jan 11 2022 14:12:26 GMT+0800 (China Standard Time)", "yyyy-MM-dd HH:mm:ss").length).toBe(19);
  expect(formatDate(new Date(2022, 0, 11, 14, 12, 26), "yyyy-MM-dd HH:mm:ss")).toBe("2022-01-11 14:12:26");
});

test("formatDate: Number formatDate value with 24-hour format", () => {
  expect(formatDate(1641881235000, "yyyy-MM-dd HH:mm:ss").length).toBe(19);
  expect(formatDate(new Date(2022, 0, 11, 14, 7, 15), "yyyy-MM-dd HH:mm:ss")).toBe("2022-01-11 14:07:15");
});

test("formatDate: Date object formatDate value with 24-hour format", () => {
  expect(formatDate(new Date(2014, 1, 11, 14, 30), "MM/dd/yyyy HH:mm:ss")).toBe("02/11/2014 14:30:00");
});

test("formatDate: Edge case - 12:00:00 PM", () => {
  expect(formatDate(new Date(2022, 0, 11, 12, 0, 0), "yyyy-MM-dd hh:mm:ss a")).toBe("2022-01-11 12:00:00 PM");
  expect(formatDate(new Date(2022, 0, 11, 12, 0, 0), "yyyy-MM-dd HH:mm:ss")).toBe("2022-01-11 12:00:00");
});

test("formatDate: Edge case - 12:00:00 AM", () => {
  expect(formatDate(new Date(2022, 0, 11, 0, 0, 0), "yyyy-MM-dd hh:mm:ss a")).toBe("2022-01-11 12:00:00 AM");
  expect(formatDate(new Date(2022, 0, 11, 0, 0, 0), "yyyy-MM-dd HH:mm:ss")).toBe("2022-01-11 00:00:00");
});

test("formatDate: Edge case - Start of the day", () => {
  expect(formatDate(new Date(2024, 0, 1, 0, 0, 0), "yyyy-MM-dd HH:mm:ss")).toBe("2024-01-01 00:00:00");
});

test("formatDate: Preserves epoch timestamps and replaces repeated tokens", () => {
  const epoch = new Date(0);
  expect(formatDate(0, "yyyy-MM-dd HH:mm:ss")).toBe(formatDate(epoch, "yyyy-MM-dd HH:mm:ss"));
  expect(formatDate(new Date(2024, 0, 2), "yyyy/yyyy-MM/MM-dd/dd")).toBe("2024/2024-01/01-02/02");
});

test("formatDate: Rejects invalid dates", () => {
  expect(() => formatDate("not-a-date")).toThrow(RangeError);
});

describe("isValidDate", () => {
  test.each([
    new Date(2020, 0, 1),
    new Date(0),
    new Date("2020-01-01T11:22:00"),
    runInNewContext("new Date(0)"),
  ])("accepts the valid Date instance %s", value => {
    expect(isValidDate(value)).toBe(true);
  });

  test("rejects invalid Date instances", () => {
    expect(isValidDate(new Date("invalid"))).toBe(false);
  });

  test.each([
    0,
    1577877720000,
    -1,
    8640000000000000,
  ])("accepts the valid millisecond timestamp %s", value => {
    expect(isValidDate(value)).toBe(true);
  });

  test.each([
    NaN,
    Infinity,
    -Infinity,
    8640000000000001,
    -8640000000000001,
  ])("rejects the invalid numeric value %s", value => {
    expect(isValidDate(value)).toBe(false);
  });

  test.each([
    "2020-01-01",
    "2020-01-01 11:22",
    "2020-01-01 11:22:33",
    "2020-01-01T11:22",
    "2020-01-01T11:22:33",
    "2020-02-29",
    "2020-01-01T11:22Z",
    "2020-01-01T11:22:33Z",
    "2020-01-01T11:22:33+08:00",
    "2020-01-01T11:22:33.123-05:30",
    " 2020-01-01 11:22 ",
  ])("accepts the valid date string %s", value => {
    expect(isValidDate(value)).toBe(true);
  });

  test.each([
    "",
    " ",
    "invalid",
    "2020",
    "2020-00-01",
    "2020-13-01",
    "2020-01-00",
    "2020-01-32",
    "2019-02-29",
    "2020-02-30",
    "2020-04-31",
    "2020-01-01 24:00",
    "2020-01-01 11:60",
    "2020-01-01 11:22:60",
    "2020-02-30T11:22:33Z",
    "2020-01-01T24:00:00Z",
    "2020-01-01T11:22:33+24:00",
    "01/01/2020",
  ])("rejects the invalid or unsupported date string %s", value => {
    expect(isValidDate(value)).toBe(false);
  });

  test.each([
    null,
    undefined,
    true,
    false,
    {},
    [],
    () => undefined,
    Symbol("date"),
  ])("rejects the unsupported value %s", value => {
    expect(isValidDate(value)).toBe(false);
  });
});

describe("generateCalendarVersion", () => {
  test.each([
    [ new Date(2026, 6, 11, 7, 40, 35), "2026.711.74035" ],
    [ new Date(2026, 6, 11, 0, 0, 0), "2026.711.0" ],
    [ new Date(2026, 7, 1, 8, 5, 9), "2026.801.80509" ],
    [ new Date(2026, 10, 1, 19, 8, 9), "2026.1101.190809" ],
    [ new Date(2027, 0, 1, 0, 0, 1), "2027.101.1" ],
  ])("formats %s as %s", (date, expected) => {
    expect(generateCalendarVersion(date)).toBe(expected);
  });

  test("defaults to the current local date and time", () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date(2028, 2, 4, 5, 6, 7));
      expect(generateCalendarVersion()).toBe("2028.304.50607");
    } finally {
      jest.useRealTimers();
    }
  });

  test("preserves an explicitly supplied zero timestamp", () => {
    expect(generateCalendarVersion(0)).toBe(generateCalendarVersion(new Date(0)));
  });

  test("returns exactly three normalized numeric segments", () => {
    const segments = generateCalendarVersion(new Date(2026, 0, 1, 0, 0, 1)).split(".");
    expect(segments).toHaveLength(3);
    segments.forEach(segment => {
      expect(segment).toMatch(/^(0|[1-9]\d*)$/);
      expect(segment).toBe(String(Number(segment)));
    });
  });

  test("increases using numeric Semantic Versioning precedence", () => {
    const compareVersions = (left, right) => {
      const leftSegments = left.split(".").map(Number);
      const rightSegments = right.split(".").map(Number);
      for (let i = 0; i < leftSegments.length; i++) {
        if (leftSegments[i] !== rightSegments[i]) {
          return leftSegments[i] - rightSegments[i];
        }
      }
      return 0;
    };
    const earlier = generateCalendarVersion(new Date(2026, 6, 11, 7, 40, 35));
    const later = generateCalendarVersion(new Date(2026, 6, 11, 7, 40, 36));
    const nextDay = generateCalendarVersion(new Date(2026, 6, 12, 0, 0, 0));

    expect(later).toBe("2026.711.74036");
    expect(compareVersions(later, earlier)).toBeGreaterThan(0);
    expect(compareVersions(nextDay, later)).toBeGreaterThan(0);
  });

  test("rejects invalid dates instead of returning non-numeric segments", () => {
    expect(() => generateCalendarVersion("not-a-date")).toThrow(RangeError);
  });
});

test("isValidData: Check the valid value?", () => {
  expect(isValidData({
    a: {
      b: {
        c: 413,
      },
    },
  }, [ "a", "b", "c" ], 413)).toBe(true);
});

test("isValidData: Safely rejects null paths and inherited properties", () => {
  expect(isValidData(null, [ "a" ], 1)).toBe(false);
  expect(isValidData({ a: null }, [ "a", "b" ], 1)).toBe(false);
  expect(isValidData({}, [ "toString" ], Object.prototype.toString)).toBe(false);
});

test("isValidEmail: Check the valid email?", () => {
  expect(isValidEmail("mazeyqian@gmail.com")).toBe(true);
  expect(isValidEmail("test-1-2-3@example.com")).toBe(true);
});

// Use Jest to test convert10To26 in a `test`
test("convert10To26: Convert 1 to \"a\"?", () => {
  expect(convert10To26(1)).toBe("a");
  expect(convert10To26(26)).toBe("z");
  expect(convert10To26(27)).toBe("aa");
  expect(convert10To26(52)).toBe("az");
  expect(convert10To26(53)).toBe("ba");
  expect(convert10To26(-1)).toBe("");
  expect(convert10To26(Infinity)).toBe("");
  expect(convert10To26(2.9)).toBe("b");
});

describe("getDateDifference", () => {
  test("formats text intervals in English", () => {
    expect(getDateDifference(1585325367000, 1681786440000, { type: "text" })).toBe("1116 days 10 hours 44 minutes 33 seconds");
    expect(getDateDifference(0, 90061000, { type: "text" })).toBe("1 day 1 hour 1 minute 1 second");
    expect(getDateDifference(0, 90060000, { type: "text" })).toBe("1 day 1 hour 1 minute");
    expect(getDateDifference(0, 86401000, { type: "text" })).toBe("1 day 1 second");
    expect(getDateDifference(0, 0, { type: "text" })).toBe("0 seconds");
  });

  test("preserves numeric and negative interval behavior", () => {
    expect(getDateDifference(0, 86400000)).toBe(1);
    expect(getDateDifference(0, 1500, { type: "seconds" })).toBe(1);
    expect(getDateDifference(1000, 0, { type: "text" })).toBe("");
    expect(getDateDifference("invalid", 0)).toBe("");
    expect(getDateDifference(0, "invalid", { type: "text" })).toBe("");
  });

  test("supports documented local date strings", () => {
    const NativeDate = global.Date;
    global.Date = class extends NativeDate {
      constructor(...args) {
        if (args.length === 1 && typeof args[0] === "string" && args[0].includes(" ")) {
          super(NaN);
        } else {
          super(...args);
        }
      }
    };

    try {
      expect(getDateDifference("2020-03-28 00:09:27", "2023-04-18 10:54:00")).toBe(1116);
    } finally {
      global.Date = NativeDate;
    }
  });

  test("keeps getFriendlyInterval as an alias", () => {
    expect(getFriendlyInterval(0, 90061000, { type: "text" })).toBe(
      getDateDifference(0, 90061000, { type: "text" })
    );
  });
});

describe("formatDurationFromMs", () => {
  test("formats durations using the largest applicable unit", () => {
    expect(formatDurationFromMs(0)).toBe("0 seconds");
    expect(formatDurationFromMs(500)).toBe("0.5 seconds");
    expect(formatDurationFromMs(1000)).toBe("1 second");
    expect(formatDurationFromMs(1500)).toBe("1.5 seconds");
    expect(formatDurationFromMs(60000)).toBe("1 minute");
    expect(formatDurationFromMs(90000)).toBe("1.5 minutes");
    expect(formatDurationFromMs(3600000)).toBe("1 hour");
    expect(formatDurationFromMs(5400000)).toBe("1.5 hours");
    expect(formatDurationFromMs(86400000)).toBe("1 day");
    expect(formatDurationFromMs(129600000)).toBe("1.5 days");
  });

  test("selects units using exact thresholds", () => {
    expect(formatDurationFromMs(59999)).toBe("60 seconds");
    expect(formatDurationFromMs(60000)).toBe("1 minute");
    expect(formatDurationFromMs(60001)).toBe("1 minute");
    expect(formatDurationFromMs(3599999)).toBe("60 minutes");
    expect(formatDurationFromMs(3600000)).toBe("1 hour");
    expect(formatDurationFromMs(3600001)).toBe("1 hour");
    expect(formatDurationFromMs(86399999)).toBe("24 hours");
    expect(formatDurationFromMs(86400000)).toBe("1 day");
    expect(formatDurationFromMs(86400001)).toBe("1 day");
  });

  test("rounds to one decimal place and pluralizes the rounded value", () => {
    expect(formatDurationFromMs(1234)).toBe("1.2 seconds");
    expect(formatDurationFromMs(1250)).toBe("1.3 seconds");
    expect(formatDurationFromMs(1040)).toBe("1 second");
    expect(formatDurationFromMs(1050)).toBe("1.1 seconds");
  });

  test("normalizes negative and non-finite durations", () => {
    expect(formatDurationFromMs(-1000)).toBe("0 seconds");
    expect(formatDurationFromMs(NaN)).toBe("0 seconds");
    expect(formatDurationFromMs(Infinity)).toBe("0 seconds");
    expect(formatDurationFromMs(-Infinity)).toBe("0 seconds");
  });
});

describe("unsanitize", () => {
  it("should unsanitize HTML entities", () => {
    const input = "&lt;div&gt;Hello, &quot;world&quot;!&lt;/div&gt;";
    const expectedOutput = "<div>Hello, \"world\"!</div>";
    expect(unsanitize(input)).toEqual(expectedOutput);
  });

  it("should unsanitize special characters", () => {
    const input = "&#x27;Hello, &lt;world&gt;!&#x27;";
    const expectedOutput = "'Hello, <world>!'";
    expect(unsanitize(input)).toEqual(expectedOutput);
  });

  it("should return the input string if it does not contain any HTML entities or special characters", () => {
    const input = "Hello, world!";
    expect(unsanitize(input)).toEqual(input);
  });

  it("should throw an error if the input is not a string", () => {
    const input = 123;
    expect(() => unsanitize(input)).toThrow("Input must be a string");
  });
});

describe("waitTime", () => {
  test("resolves after the specified time has elapsed", async () => {
    const start = Date.now();
    await waitTime(1000);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(1000);
  });
});

describe("isValidPhoneNumber", () => {
  it("should return true for valid phone numbers", () => {
    expect(isValidPhoneNumber("13800138000")).toBe(true);
    expect(isValidPhoneNumber("15012345678")).toBe(true);
    expect(isValidPhoneNumber("19912345678")).toBe(true);
    expect(isValidPhoneNumber("17612345678")).toBe(true);
    expect(isValidPhoneNumber("14712345678")).toBe(true);
    expect(isValidPhoneNumber("11012345678")).toBe(true);
    expect(isValidPhoneNumber("12012345678")).toBe(true);
    expect(isValidPhoneNumber("16912345678")).toBe(true);
    expect(isValidPhoneNumber("10912345678")).toBe(true);
    expect(isValidPhoneNumber("18012345678")).toBe(true);
  });

  it("should return false for invalid phone numbers", () => {
    expect(isValidPhoneNumber("1380013800")).toBe(false);
    expect(isValidPhoneNumber("138001380000")).toBe(false);
    expect(isValidPhoneNumber("1380013800a")).toBe(false);
    expect(isValidPhoneNumber("02345678901")).toBe(false);
    expect(isValidPhoneNumber("00000000000")).toBe(false);
  });
});

describe("genUniqueNumString", () => {
  it("should generate a unique number string with default length", () => {
    const result = genUniqueNumString();
    expect(result.length).toBe(16);
  });

  it("should generate a unique number string with custom length", () => {
    const result = genUniqueNumString(5);
    expect(result.length).toBe(18);
  });
});

describe("floatToPercent", () => {
  it("should convert a float number to a percentage string", () => {
    expect(floatToPercent(0.5)).toBe("50%");
    expect(floatToPercent(0.12345, 2)).toBe("12.35%");
    expect(floatToPercent(0.9999, 3)).toBe("99.990%");
  });

  it("should handle fixSize parameter as optional", () => {
    expect(floatToPercent(0.75)).toBe("75%");
  });
});

describe("floatFixed", () => {
  it("should return a fixed number with default precision", () => {
    const result = floatFixed("3.14159");
    expect(result).toBe("3");
  });

  it("should return a fixed number with custom precision", () => {
    const result = floatFixed("3.14159", 2);
    expect(result).toBe("3.14");
  });

  it("should return a fixed number with zero precision", () => {
    const result = floatFixed("3.14159", 0);
    expect(result).toBe("3");
  });
});

// Test case 1: Throttled function should be called only once within the specified wait time
test("Throttled function should be called only once within the specified wait time", () => {
  const mockFn = jest.fn();
  const throttledFn = throttle(mockFn, 100);

  // Call the throttled function multiple times within the wait time
  throttledFn();
  throttledFn();
  throttledFn();

  // The mock function should be called only once
  expect(mockFn).toHaveBeenCalledTimes(1);
});

// Test case 2: Throttled function should respect the leading and trailing options
test("Throttled function should respect the leading and trailing options", () => {
  const mockFn = jest.fn();
  const throttledFn = throttle(mockFn, 100, { leading: false, trailing: false });

  // Call the throttled function multiple times within the wait time
  throttledFn();
  throttledFn();
  throttledFn();

  // The mock function should not be called
  expect(mockFn).not.toHaveBeenCalled();
});

// describe("throttle", () => {
//   // Mock function for testing
//   const mockFn = jest.fn();

//   beforeEach(() => {
//     jest.useFakeTimers();
//     mockFn.mockClear();
//   });

//   it("should throttle the function call", () => {
//     const throttledFn = throttle(mockFn, 100);

//     // Call the throttled function multiple times within the throttle period
//     throttledFn();
//     throttledFn();
//     throttledFn();

//     // Fast-forward time by 100ms
//     jest.advanceTimersByTime(100);

//     // The throttled function should only be called once
//     expect(mockFn).toHaveBeenCalledTimes(1);
//   });

//   it("should respect the leading option", () => {
//     const throttledFn = throttle(mockFn, 100, { leading: false });

//     // Call the throttled function multiple times within the throttle period
//     throttledFn();
//     throttledFn();
//     throttledFn();

//     // Fast-forward time by 100ms
//     jest.advanceTimersByTime(100);

//     // The throttled function should not be called
//     expect(mockFn).not.toHaveBeenCalled();
//   });
// });

describe("debounce", () => {
  // Mock function for testing
  const mockFn = jest.fn();
  
  beforeEach(() => {
    jest.useFakeTimers();
    mockFn.mockClear();
  });

  it("should debounce the function call", () => {
    const debouncedFn = debounce(mockFn, 100);

    // Call the debounced function multiple times within the debounce period
    debouncedFn();
    debouncedFn();
    debouncedFn();

    // Fast-forward time by 100ms
    jest.advanceTimersByTime(100);

    // The debounced function should only be called once
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should immediately invoke the function if immediate flag is set", () => {
    const debouncedFn = debounce(mockFn, 100, true);

    // Call the debounced function multiple times within the debounce period
    debouncedFn();
    debouncedFn();
    debouncedFn();

    // The debounced function should be called immediately
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Fast-forward time by 100ms
    jest.advanceTimersByTime(100);

    // The debounced function should not be called again
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe("doFn", () => {
  // Define a sample function for testing
  function add(a, b) {
    return a + b;
  }

  it("should call the provided function with the given parameters", () => {
    const result = doFn(add, 2, 3);
    expect(result).toBe(5);
  });

  it("should return null if the provided function is null", () => {
    const result = doFn(null, 2, 3);
    expect(result).toBeNull();
  });

  it("should return null if the provided function is not a function", () => {
    const result = doFn("not a function", 2, 3);
    expect(result).toBeNull();
  });
});

describe("isNonEmptyArray", () => {
  it("should return true for a non-empty array", () => {
    const arr = [ 1, 2, 3 ];
    const result = isNonEmptyArray(arr);
    expect(result).toBe(true);
  });

  it("should return false for an empty array", () => {
    const arr = [];
    const result = isNonEmptyArray(arr);
    expect(result).toBe(false);
  });

  it("should return false for a non-array value", () => {
    const value = "not an array";
    const result = isNonEmptyArray(value);
    expect(result).toBe(false);
  });
});

describe("removeHtml", () => {
  it("should remove HTML tags from a string", () => {
    const input = "<p>Hello, <strong>world!</strong></p>";
    const expected = "Hello, world!";
    const result = removeHtml(input);
    expect(result).toEqual(expected);
  });

  it("should remove HTML tags and new lines from a string", () => {
    const input = "<p>Hello,<br>world!</p>";
    const expected = "Hello,world!";
    const result = removeHtml(input, { removeNewLine: true });
    expect(result).toEqual(expected);
  });

  it("should return an empty string if input is empty", () => {
    const input = "";
    const expected = "";
    const result = removeHtml(input);
    expect(result).toEqual(expected);
  });

  it("should return the input string if it does not contain any HTML tags", () => {
    const input = "Hello, world!";
    const expected = "Hello, world!";
    const result = removeHtml(input);
    expect(result).toEqual(expected);
  });
});

describe("convertKebabToCamel", () => {
  it("should convert kebab case to camel case", () => {
    const kebabCase = "hello-world";
    const expected = "helloWorld";
    const result = convertKebabToCamel(kebabCase);
    expect(result).toEqual(expected);
  });

  it("should handle multiple hyphens in kebab case", () => {
    const kebabCase = "my-awesome-component";
    const expected = "myAwesomeComponent";
    const result = convertKebabToCamel(kebabCase);
    expect(result).toEqual(expected);
  });

  it("should handle kebab case with leading hyphen", () => {
    const kebabCase = "-start-with-hyphen";
    const expected = "StartWithHyphen";
    const result = convertKebabToCamel(kebabCase);
    expect(result).toEqual(expected);
  });

  it("should handle kebab case with trailing hyphen", () => {
    const kebabCase = "end-with-hyphen-";
    const expected = "endWithHyphen";
    const result = convertKebabToCamel(kebabCase);
    expect(result).toEqual(expected);
  });

  it("should return an empty string for empty input", () => {
    const kebabCase = "";
    const expected = "";
    const result = convertKebabToCamel(kebabCase);
    expect(result).toEqual(expected);
  });
});

describe("sanitizeInput", () => {
  it("should replace special characters with their corresponding HTML entities", () => {
    const input = "Hello <script>alert(\"XSS\");</script>";
    const expectedOutput = "Hello &lt;script&gt;alert(&quot;XSS&quot;);&lt;&#x2F;script&gt;";
    expect(sanitizeInput(input)).toEqual(expectedOutput);
  });

  it("should not modify the input if it does not contain any special characters", () => {
    const input = "Hello World!";
    expect(sanitizeInput(input)).toEqual(input);
  });

  it("should handle empty input", () => {
    const input = "";
    expect(sanitizeInput(input)).toEqual(input);
  });

  it("should throw an error if the input is not a string", () => {
    const input = 123;
    expect(() => sanitizeInput(input)).toThrow("Input must be a string");
  });
});

describe("unsanitizeInput", () => {
  it("should replace HTML entities with their corresponding special characters", () => {
    const input = "Hello &lt;script&gt;alert(&quot;XSS&quot;);&lt;&#x2F;script&gt;";
    const expectedOutput = "Hello <script>alert(\"XSS\");</script>";
    expect(unsanitizeInput(input)).toEqual(expectedOutput);
  });

  it("should not modify the input if it does not contain any HTML entities", () => {
    const input = "Hello World!";
    expect(unsanitizeInput(input)).toEqual(input);
  });

  it("should handle empty input", () => {
    const input = "";
    expect(unsanitizeInput(input)).toEqual(input);
  });

  it("should throw an error if the input is not a string", () => {
    const input = 123;
    expect(() => unsanitizeInput(input)).toThrow("Input must be a string");
  });
});

describe("truncateZHString", () => {
  it("should truncate a Chinese string with a specified length", () => {
    const str = "你好，世界！";
    const len = 5;
    const result = truncateZHString(str, len);
    expect(result).toBe("你好");
  });

  it("should truncate a Chinese string and add ellipsis when hasDot is true", () => {
    const str = "你好，世界！";
    const len = 5;
    const result = truncateZHString(str, len, true);
    expect(result).toBe("你好...");
  });

  it("should return an empty string when the input string is empty", () => {
    const str = "";
    const len = 10;
    const result = truncateZHString(str, len);
    expect(result).toBe("");
  });

  it("should return an empty string when the input string is null", () => {
    const str = null;
    const len = 10;
    const result = truncateZHString(str, len);
    expect(result).toBe("");
  });
});

describe("zAxiosIsValidRes", () => {
  it("should return true if res is valid", () => {
    const res = {
      status: 200,
      data: {
        code: 0,
      },
    };
    const isValid = zAxiosIsValidRes(res);
    expect(isValid).toBe(true);
  });

  it("should return false if res is undefined", () => {
    const res = undefined;
    const isValid = zAxiosIsValidRes(res);
    expect(isValid).toBe(false);
  });

  it("should return false if res status is outside validStatusRange", () => {
    const res = {
      status: 400,
      data: {
        code: 0,
      },
    };
    const isValid = zAxiosIsValidRes(res);
    expect(isValid).toBe(false);
  });

  it("should return false if res data code is not in validCode", () => {
    const res = {
      status: 200,
      data: {
        code: 1,
      },
    };
    const isValid = zAxiosIsValidRes(res);
    expect(isValid).toBe(false);
  });

  it("uses defaults when optional properties are explicitly undefined", () => {
    const res = { status: 200, data: { code: 0 } };
    expect(zAxiosIsValidRes(res, {
      validStatusRange: undefined,
      validCode: undefined,
    })).toBe(true);
  });

  it("uses defaults when the options object is null", () => {
    const res = { status: 200, data: { code: 0 } };
    expect(zAxiosIsValidRes(res, null)).toBe(true);
  });
});

describe("getFileSize", () => {
  it("should return the correct file size in bytes", () => {
    expect(getFileSize(100)).toBe("100 B");
    expect(getFileSize(1023)).toBe("1023 B");
  });

  it("should return the correct file size in kilobytes", () => {
    expect(getFileSize(1024)).toBe("1 KB");
    expect(getFileSize(2048)).toBe("2 KB");
    expect(getFileSize(3072)).toBe("3 KB");
  });

  it("should return the correct file size in megabytes", () => {
    expect(getFileSize(1048576)).toBe("1 MB");
    expect(getFileSize(2097152)).toBe("2 MB");
    expect(getFileSize(3145728)).toBe("3 MB");
  });

  it("should return the correct file size in gigabytes", () => {
    expect(getFileSize(1073741824)).toBe("1 G");
    expect(getFileSize(2147483648)).toBe("2 G");
    expect(getFileSize(3221225472)).toBe("3 G");
  });

  it("should return the correct file size in terabytes", () => {
    expect(getFileSize(1099511627776)).toBe("1 T");
    expect(getFileSize(2199023255552)).toBe("2 T");
    expect(getFileSize(3298534883328)).toBe("3 T");
  });

  it("should return an empty string for invalid file sizes", () => {
    expect(getFileSize(0)).toBe("");
    expect(getFileSize(-100)).toBe("");
    expect(getFileSize(NaN)).toBe("");
    expect(getFileSize(Infinity)).toBe("");
  });
});

describe("genHashCode", () => {
  it("should return 0 for an empty string", () => {
    const str = "";
    const expectedHash = 0;

    const actualHash = genHashCode(str);

    expect(actualHash).toBe(expectedHash);
  });
});

describe("getCurrentVersion", () => {
  it("should return current version", () => {
    const version = getCurrentVersion();
    expect(version).toBe("v4");
  });
});

describe("repeatUntilConditionMet error handling", () => {
  let consoleSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    consoleSpy.mockRestore();
  });

  it("should log an error if callback is not a function", () => {
    repeatUntilConditionMet("notAFunction", {}, () => true);
    expect(console.error).toHaveBeenCalledWith("Expected a function.");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("should log an error if interval is not a non-negative number", () => {
    repeatUntilConditionMet(() => true, { interval: "notANumber" }, () => true);
    expect(console.error).toHaveBeenCalledWith("Expected a non-negative number for interval.");
    
    repeatUntilConditionMet(() => true, { interval: -1 }, () => true);
    expect(console.error).toHaveBeenCalledWith("Expected a non-negative number for interval.");
  });

  it("should log an error if times is not a non-negative number", () => {
    repeatUntilConditionMet(() => true, { times: "notANumber" }, () => true);
    expect(console.error).toHaveBeenCalledWith("Expected a non-negative number for times.");
    
    repeatUntilConditionMet(() => true, { times: -1 }, () => true);
    expect(console.error).toHaveBeenCalledWith("Expected a non-negative number for times.");
  });

  it("rejects non-finite options and schedules nothing for zero times", () => {
    const callback = jest.fn();
    repeatUntilConditionMet(callback, { interval: NaN });
    repeatUntilConditionMet(callback, { times: Infinity });
    repeatUntilConditionMet(callback, { times: 0 });

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("isNonEmptyObject", () => {
  it("should return true for an empty object", () => {
    const obj = {};
    const result = isNonEmptyObject(obj);
    expect(result).toBe(false);
  });

  it("should return false for a non-empty object", () => {
    const obj = { key: "value" };
    const result = isNonEmptyObject(obj);
    expect(result).toBe(true);
  });

  it("should return false for a non-object value", () => {
    const value = "not an object";
    const result = isNonEmptyObject(value);
    expect(result).toBe(false);
  });

  it("should return true for a number-string object", () => {
    const value = { 1: "1" };
    const result = isNonEmptyObject(value);
    expect(result).toBe(true);
  });
});

describe("isPureObject", () => {
  it("should return true for a pure object", () => {
    const obj = { key: "value" };
    const result = isPureObject(obj);
    expect(result).toBe(true);
  });

  it("should return false for an array", () => {
    const arr = [ 1, 2, 3 ];
    const result = isPureObject(arr);
    expect(result).toBe(false);
  });

  it("should return false for a function", () => {
    const func = () => {};
    const result = isPureObject(func);
    expect(result).toBe(false);
  });

  it("should return false for a non-object value", () => {
    const value = "not an object";
    const result = isPureObject(value);
    expect(result).toBe(false);
  });
});

describe("isArray", () => {
  it("should return true for an array", () => {
    const arr = [ 1, 2, 3 ];
    const result = isArray(arr);
    expect(result).toBe(true);
  });

  it("should return false for a non-array value", () => {
    const value = "not an array";
    const result = isArray(value);
    expect(result).toBe(false);
  });
});

describe("isString", () => {
  it("should return true for a string", () => {
    const str = "Hello, world!";
    const result = isString(str);
    expect(result).toBe(true);
  });

  it("should return false for a non-string value", () => {
    const value = 123;
    const result = isString(value);
    expect(result).toBe(false);
  });
});

describe("isFunction", () => {
  it("should return true for a function", () => {
    const func = () => {};
    const result = isFunction(func);
    expect(result).toBe(true);
  });

  it("should return false for a non-function value", () => {
    const value = "not a function";
    const result = isFunction(value);
    expect(result).toBe(false);
  });
});

describe("isBoolean", () => {
  it("should return true for a boolean", () => {
    const bool = true;
    const result = isBoolean(bool);
    expect(result).toBe(true);
  });

  it("should return false for a non-boolean value", () => {
    const value = "not a boolean";
    const result = isBoolean(value);
    expect(result).toBe(false);
  });
});

describe("isUdfOrNul", () => {
  it("should return true for undefined", () => {
    const value = undefined;
    const result = isUdfOrNul(value);
    expect(result).toBe(true);
  });

  it("should return true for null", () => {
    const value = null;
    const result = isUdfOrNul(value);
    expect(result).toBe(true);
  });

  it("should return false for a non-undefined and non-null value", () => {
    const value = "not undefined or null";
    const result = isUdfOrNul(value);
    expect(result).toBe(false);
  });
});

describe("isBrowser function", () => {
  it("should return false if running in a node environment", () => {
    const result = isBrowser();
    expect(result).toBe(false);
  });
});
