/**
 * @jest-environment node
 */
/* eslint-disable no-undef */
import {
  camelCaseToKebabCase, camelCase2Underscore,
  deepCopyObject, repeatUntilConditionMet,
  formatDate, isBrowser, waitTime, isArray,
  isJsonString, isNumber, isPureObject, isNonEmptyObject,
  isValidData, isValidEmail, isValidPhoneNumber, isNonEmptyArray,
  getFriendlyInterval, getFileSize, getCurrentVersion,
  genUniqueNumString, generateRndNum, genHashCode,
  floatToPercent, floatFixed, throttle, debounce,
  doFn, mTrim, removeHtml, truncateZHString,
  convertKebabToCamel, convert10To26, zAxiosIsValidRes,
  unsanitize, sanitizeInput, unsanitizeInput,
  isFunction, isString, isBoolean, isUdfOrNul,
} from "../lib/index.esm";

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

test("mTrim: Transfer ' 1 2 3 ' to '1 2 3'?", () => {
  expect(mTrim(" 1 2 3 ")).toBe("1 2 3");
});

test("mTrim: Transfer 'abc ' to 'abc'?", () => {
  expect(mTrim("abc ")).toBe("abc");
});

test("deepCopyObject: Transfer 'abc' to 'abc'?", () => {
  expect(deepCopyObject("abc")).toBe("abc");
});

test("isJsonString: Is '['a', 'b', 'c']' a valid JSON string?", () => {
  expect(isJsonString("['a', 'b', 'c']")).toBe(false);
});

test("isJsonString: Is '[\"a\", \"b\", \"c\"]' a valid JSON string?", () => {
  expect(isJsonString("[\"a\", \"b\", \"c\"]")).toBe(true);
});

test("generateRndNum: Can it produce an empty string?", () => {
  expect(generateRndNum(0)).toBe("");
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

test("isValidData: Check the valid value?", () => {
  expect(isValidData({
    a: {
      b: {
        c: 413,
      },
    },
  }, [ "a", "b", "c" ], 413)).toBe(true);
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
});

// Use Jest to test getFriendlyInterval in a `test`
test("getFriendlyInterval: Get 1116 days?", () => {
  expect(getFriendlyInterval(new Date("2020-03-28 00:09:27"), new Date("2023-04-18 10:54:00"), { type: "d" })).toBe(1116);
  expect(getFriendlyInterval(1585325367000, 1681786440000, { type: "text" })).toBe("1116 天 10 时 44 分 33 秒");
  expect(getFriendlyInterval("2020-03-28 00:09:27", "2023-04-18 10:54:00", { type: "text" })).toBe("1116 天 10 时 44 分 33 秒");
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
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log an error if callback is not a function", () => {
    repeatUntilConditionMet("notAFunction", {}, () => true);
    expect(console.error).toHaveBeenCalledWith("Expected a function.");
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
