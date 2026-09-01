/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  isValidUrl, getUrlFileType, isValidHttpUrl, updateQueryParam, getUrlParam,
  getScriptQueryParam, convertObjectToQuery, convertHttpToHttps,
  getAllQueryParams, getQueryParam, getHashQueryParam,
  getUrlHost, getUrlPath, onURLChange, parseGitHubRepository,
} from "../lib/index.esm";

const validUrls = [
  "https://www.example.com/events/#&product=browser",
  "https://example.com/?q=Test%20URL-encoded%20stuff",
  "http://example.com?foo=bar#baz=qux&ssq?id=sdf",
  "http://www.example.com",
  "https://www.example.com/blah_blah/",
  "https://example.com/qwe/e?bar=baz&inss=33&qa",
  "http://example.com#home?id=1&name=33",
  "http://example.com?foo=bar&name=名字&age=24",
  "http://example.com?foo=bar&name=？？一；&age=24",
  "http://.example.com",
  "http://example?foo=bar",
  "http://example.",
  "http://223.255.255.66",
  "http://223.255.255.66:23/page?id=33",
  "http://142.2.2.2:8080/",
  "http://example.com/a/index.html?msg=%3Ca%20href%3D%22https",
  "ftp://example.com",
  "ssssss://app_test/deploy?id=99",
  "http://v=0618",
];

const invalidUrls = [
  "example.com",
  "www.example.com",
  "http://例子.测试",
  "____sssss://ssssss",
  "\" https://example.com/t/jae\"",
  "    https://example.com/t/eee",
  "hahha",
  "哈哈哈哈",
  "file:///C:/Users/Username/Documents/Example.txt",
  "<a href=\"https://b.example.com/t/i/y\" target=\"_blank\">xxx</a><br/>",
  "http://example.com/a/index.html?msg=<a href=\"https://b.example.com/t/i/y\" target=\"_blank\">xxx</a><br/>",
  "v=0618",
];

describe("parseGitHubRepository", () => {
  const expected = {
    owner: "acme",
    name: "widget",
    slug: "acme/widget",
    url: "https://github.com/acme/widget",
  };

  it.each([
    "acme/widget",
    "github:acme/widget.git",
    "git@github.com:acme/widget.git",
    "git@GITHUB.COM:acme/widget.git",
    "git://github.com/acme/widget.git",
    "ssh://git@github.com/acme/widget.git",
    "git+ssh://git@github.com/acme/widget.git",
    "http://github.com/acme/widget",
    "https://www.github.com/acme/widget.git",
    "git+https://GITHUB.COM/acme/widget.git",
    "  acme/widget  ",
  ])("normalizes %s", value => {
    expect(parseGitHubRepository(value)).toEqual(expected);
  });

  it.each([
    "",
    "   ",
    "acme",
    "acme/widget/extra",
    "https://github.com/acme//widget",
    "https://example.com/acme/widget",
    "https://github.com/acme/widget?tab=readme",
    "https://github.com/acme/widget?",
    "https://github.com/acme/widget#readme",
    "https://github.com/acme/widget#",
    "https://github.com:443/acme/widget",
    "https://user@github.com/acme/widget",
    "https://git:secret@github.com/acme/widget",
    "GIT@github.com:acme/widget.git",
    "https://github.com/acme/../widget",
    "https://github.com/acme/%77idget",
    "https://github.com/acme/%2Fwidget",
    "https://github.com/acme/%00widget",
    "工具/widget",
    "acme/工具",
    "acme--tools/widget",
    `${"a".repeat(40)}/widget`,
    `acme/${"a".repeat(101)}`,
  ])("rejects unsupported input %p", value => {
    expect(() => parseGitHubRepository(value)).toThrow(Error);
  });

  it("rejects non-string runtime input", () => {
    expect(() => parseGitHubRepository({ url: "acme/widget" })).toThrow(TypeError);
  });

  it("returns equal but independently allocated results", () => {
    const first = parseGitHubRepository("acme/widget");
    const second = parseGitHubRepository("acme/widget");
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it("accepts GitHub's owner and repository length boundaries", () => {
    const owner = "a".repeat(39);
    const name = "b".repeat(100);

    expect(parseGitHubRepository(`${owner}/${name}`)).toEqual({
      owner,
      name,
      slug: `${owner}/${name}`,
      url: `https://github.com/${owner}/${name}`,
    });
  });
});

test("isValidUrl", () => {
  validUrls.forEach(url => {
    expect(isValidUrl(url)).toBe(true);
  });

  invalidUrls.forEach(url => {
    let ret = isValidUrl(url);
    expect(ret).toBe(false);
  });
});

// Use Jest to test getUrlFileType in a `test`
test("getUrlFileType", () => {
  expect(getUrlFileType("https://example.com/a/b/c.png")).toBe("png");
  expect(getUrlFileType("https://example.com/a/b/c.jpg")).toBe("jpg");
  expect(getUrlFileType("https://example.com/a/b/c.jpeg")).toBe("jpeg");
  expect(getUrlFileType("/a/b/c.jpeg")).toBe("jpeg");
  expect(getUrlFileType("https://example.com/a/b/c.v/a")).toBe("");
  expect(getUrlFileType("https://example.com/a/b/c.png?size=2#preview")).toBe("png");
});

describe("isValidHttpUrl", () => {
  it("should return true for valid HTTP/HTTPS URLs", () => {
    expect(isValidHttpUrl("https://www.example.com")).toBe(true);
    expect(isValidHttpUrl("http://example.com/path/exx/ss")).toBe(true);
    expect(isValidHttpUrl("https://www.example.com/?q=hello&age=24#world")).toBe(true);
    expect(isValidHttpUrl("http://www.example.com/#world?id=9")).toBe(true);
    expect(isValidHttpUrl("http://example.com:8080")).toBe(true);
    expect(isValidHttpUrl("http://www.example.com/哈哈哈哈哈")).toBe(true);
    expect(isValidHttpUrl("https://example.com./path")).toBe(true);
  });

  it("should return false for invalid URLs", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("example.com")).toBe(false);
    expect(isValidHttpUrl("www.example.com")).toBe(false);
    expect(isValidHttpUrl("v=0618")).toBe(false);
    expect(isValidHttpUrl("http://ssssssssssss")).toBe(false);
    expect(isValidHttpUrl("https://this-shouldn't.match@example.com")).toBe(false);
    expect(isValidHttpUrl("abcdef")).toBe(false);
    expect(isValidHttpUrl("https://example.com trailing text")).toBe(false);
    expect(isValidHttpUrl("https://example.com<script>")).toBe(false);
    expect(isValidHttpUrl("http:example.com")).toBe(false);
    expect(isValidHttpUrl("http:/example.com")).toBe(false);
    expect(isValidHttpUrl("http:////example.com")).toBe(false);
    expect(isValidHttpUrl("https://.example.com")).toBe(false);
    expect(isValidHttpUrl("https://example..com")).toBe(false);
    expect(isValidHttpUrl("https://-example.com")).toBe(false);
    expect(isValidHttpUrl("https://example-.com")).toBe(false);
    expect(isValidHttpUrl("https://exa_mple.com")).toBe(false);
    expect(isValidHttpUrl("http://127.1")).toBe(false);
    expect(isValidHttpUrl("http://0177.0.0.1")).toBe(false);
    expect(isValidHttpUrl("http://0x7f.0.0.1")).toBe(false);
  });

  it("should return true for valid URLs when strict is false", () => {
    expect(isValidHttpUrl("//www.example.com", { strict: false })).toBe(true);
    expect(isValidHttpUrl("http://example.com/path/exx/ss", { strict: false })).toBe(true);
    expect(isValidHttpUrl("//www.example.com/?q=hello&age=24#world", { strict: false })).toBe(true);
    expect(isValidHttpUrl("https://www.example.com/#world?id=9", { strict: false })).toBe(true);
    expect(isValidHttpUrl("//example.com:8080", { strict: false })).toBe(true);
    expect(isValidHttpUrl("//www.example.com/哈哈哈哈哈", { strict: false })).toBe(true);
    expect(isValidHttpUrl("//example.com./path", { strict: false })).toBe(true);
  });

  it("should return false for invalid URLs when strict is false", () => {
    expect(isValidHttpUrl("ftp://example.com", { strict: false })).toBe(false);
    expect(isValidHttpUrl("example.com", { strict: false })).toBe(false);
    expect(isValidHttpUrl("www.example.com", { strict: false })).toBe(false);
    expect(isValidHttpUrl("v=0618", { strict: false })).toBe(false);
    expect(isValidHttpUrl("http://ssssssssssss", { strict: false })).toBe(false);
    expect(isValidHttpUrl("https://this-shouldn't.match@example.com", { strict: false })).toBe(false);
    expect(isValidHttpUrl("abcdef", { strict: false })).toBe(false);
    expect(isValidHttpUrl("///example.com", { strict: false })).toBe(false);
    expect(isValidHttpUrl("////example.com", { strict: false })).toBe(false);
  });

  it("validates URLs when the Web URL constructor is unavailable", () => {
    const originalURL = global.URL;
    global.URL = undefined;
    try {
      expect(isValidHttpUrl("https://example.com/path?q=1")).toBe(true);
      expect(isValidHttpUrl("https://example.com./path")).toBe(true);
      expect(isValidHttpUrl("//example.com:8080/path", { strict: false })).toBe(true);
      expect(isValidHttpUrl("https://example.com:/path")).toBe(true);
      expect(isValidHttpUrl("https://[::1]/path")).toBe(true);
      expect(isValidHttpUrl("https://[::1]:/path")).toBe(true);
      expect(isValidHttpUrl("https://[::ffff:192.0.2.1]/path")).toBe(true);
      expect(isValidHttpUrl("https://[::ffff:192.168.001.1]/path")).toBe(false);
      expect(isValidHttpUrl("https://[::ffff:01.2.3.4]/path")).toBe(false);
      expect(isValidHttpUrl("https://[:::]/path")).toBe(false);
      expect(isValidHttpUrl("https://[1:2:3:4:5:6:7:8:9]/path")).toBe(false);
      expect(isValidHttpUrl("https://user@example.com/path")).toBe(false);
      expect(isValidHttpUrl("https://example.123/path")).toBe(false);
      expect(isValidHttpUrl("http://127.1")).toBe(false);
      expect(isValidHttpUrl("http://0177.0.0.1")).toBe(false);
      expect(isValidHttpUrl("http://0x7f.0.0.1")).toBe(false);
      expect(isValidHttpUrl("https://example.com trailing text")).toBe(false);

      global.URL = function UnsupportedURL() {
        throw new TypeError("URL is not constructible");
      };
      expect(isValidHttpUrl("https://example.com/path")).toBe(true);
    } finally {
      global.URL = originalURL;
    }
  });

  it("parses queries and validates URLs without modern string helpers", () => {
    const originalURL = global.URL;
    const originalIncludes = String.prototype.includes;
    const originalStartsWith = String.prototype.startsWith;
    const originalEndsWith = String.prototype.endsWith;
    let queryResult;
    let validUrlResult;
    try {
      global.URL = undefined;
      String.prototype.includes = undefined;
      String.prototype.startsWith = undefined;
      String.prototype.endsWith = undefined;
      queryResult = getAllQueryParams("?a=1&b=2");
      validUrlResult = isValidHttpUrl("https://example.com/path");
    } finally {
      global.URL = originalURL;
      String.prototype.includes = originalIncludes;
      String.prototype.startsWith = originalStartsWith;
      String.prototype.endsWith = originalEndsWith;
    }

    expect(queryResult).toEqual({ a: "1", b: "2" });
    expect(validUrlResult).toBe(true);
  });
});

// Test case 1: URL with existing query parameter
test("Update existing query parameter in URL", () => {
  const url = "https://example.com/page?param1=value1&param2=value2";
  const param = "param1";
  const value = "updatedValue";
  const updatedUrl = updateQueryParam(url, param, value);
  expect(updatedUrl).toBe("https://example.com/page?param1=updatedValue&param2=value2");
});

// Test case 2: URL without existing query parameter
test("Add new query parameter to URL", () => {
  const url = "https://example.com/page";
  const param = "param1";
  const value = "newValue";
  const updatedUrl = updateQueryParam(url, param, value);
  expect(updatedUrl).toBe("https://example.com/page?param1=newValue");
});

// Test case 3: URL with hash fragment
test("Update query parameter in URL with hash fragment", () => {
  const url = "https://example.com/page#section1";
  const param = "param1";
  const value = "updatedValue";
  const updatedUrl = updateQueryParam(url, param, value);
  expect(updatedUrl).toBe("https://example.com/page?param1=updatedValue#section1");
});

test("Update encoded parameters in relative URLs without moving the hash", () => {
  expect(updateQueryParam("/page?first=1#section", "a b", "x&y")).toBe("/page?first=1&a%20b=x%26y#section");
  expect(updateQueryParam("/page?a%20b=old&a%20b=duplicate#section", "a b", "new value"))
    .toBe("/page?a%20b=new%20value#section");
});


describe("getUrlParam", () => {
  // Test case 1: Single value parameter
  test("Single value parameter", () => {
    const url = "https://example.com/?param1=value1&param2=value2";
    const param = "param1";
    const result = getUrlParam(url, param);
    expect(result).toBe("value1");
  });

  // Test case 2: Single value parameter
  test("Multiple value parameter", () => {
    const url = "https://example.com/?param1=value1&param2=value2#path?param1=value1&param2=val2val";
    const param = "param1";
    const result = getUrlParam(url, param);
    expect(result).toEqual("value1");
  });

  // Test case 3: Return array option
  test("Return array option", () => {
    const url = "https://example.com/?param1=value1&param1=value2";
    const param = "param1";
    const options = { returnArray: true };
    const result = getUrlParam(url, param, options);
    expect(result).toEqual([ "value1", "value2" ]);
  });
  // Empty
  test("Return array option: Empty", () => {
    const url = "https://example.com/?param1=value1&param2=value2";
    const param = "value3";
    const options = { returnArray: true };
    const result = getUrlParam(url, param, options);
    expect(result).toEqual([]);
  });

  // Test case 4: Non-existing parameter
  test("Non-existing parameter", () => {
    const url = "https://example.com/?param1=value1&param2=value2";
    const param = "param3";
    const result = getUrlParam(url, param);
    expect(result).toBe(null);
  });

  // Get value when hash fragment is present
  test("Get value when hash fragment is present", () => {
    const url = "https://example.com/?param1=value1&param2=value2#section1";
    const param = "param2";
    const result = getUrlParam(url, param);
    expect(result).toBe("value2");
  });

  test("decodes values consistently and supports relative URLs with hashes", () => {
    expect(getUrlParam("https://example.com/?q=hello%20world", "q")).toBe("hello world");
    expect(getUrlParam("/?q=hello+world#section", "q")).toBe("hello world");
    expect(getUrlParam("/?a%2Eb=value", "a.b")).toBe("value");
  });
});

describe("current URL query helpers", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("supports encoded names, plus spaces, and hash values", () => {
    window.history.replaceState({}, "", "/?a%2Eb=hello+world#route?a%2Eb=hash+value");
    expect(getQueryParam("a.b")).toBe("hello world");
    expect(getHashQueryParam("a.b")).toBe("hash value");
  });
});

describe("getScriptQueryParam", () => {
  // Mock script tags in the document
  const originalQuerySelectorAll = document.querySelectorAll;
  beforeEach(() => {
    document.querySelectorAll = jest.fn();
  });

  afterEach(() => {
    document.querySelectorAll = originalQuerySelectorAll;
  });

  it("should return the correct query parameter value", () => {
    document.querySelectorAll.mockReturnValue([
      { getAttribute: () => "https://example.com/example.js?test=hello" },
    ]);
    const result = getScriptQueryParam("test");
    expect(result).toBe("hello");
  });

  it("should return an empty string if the parameter is not found", () => {
    document.querySelectorAll.mockReturnValue([
      { getAttribute: () => "https://example.com/example.js" },
    ]);
    const result = getScriptQueryParam("test");
    expect(result).toBe("");
  });

  it("should only match scripts with the specified substring in their src attribute", () => {
    document.querySelectorAll.mockReturnValue([
      { getAttribute: () => "https://example.com/example.js?test=hello" },
      { getAttribute: () => "https://another-example.com/script.js?test=world" },
    ]);
    const result = getScriptQueryParam("test", "example.com");
    expect(result).toBe("hello");
  });

  it("should decode URI components in the returned value", () => {
    document.querySelectorAll.mockReturnValue([
      { getAttribute: () => "https://example.com/example.js?test=hello%20world" },
    ]);
    const result = getScriptQueryParam("test");
    expect(result).toBe("hello world");
  });

  it("does not construct a selector or regular expression from caller input", () => {
    document.querySelectorAll.mockReturnValue([
      { getAttribute: () => "https://example.com/a.js?a%2Eb=ok" },
    ]);
    expect(getScriptQueryParam("a.b", "\"")).toBe("");
    expect(getScriptQueryParam("a.b", "example.com")).toBe("ok");
  });
});

describe("convertObjectToQuery", () => {
  it("should convert an object to a query string", () => {
    const obj = {
      name: "John",
      age: "30",
      city: "New_York",
    };
    const expected = "?name=John&age=30&city=New_York";
    const result = convertObjectToQuery(obj);
    expect(result).toEqual(expected);
  });

  it("should handle empty object", () => {
    const obj = {};
    const expected = "";
    const result = convertObjectToQuery(obj);
    expect(result).toEqual(expected);
  });

  it("should handle special characters in values", () => {
    const obj = {
      name: "John_Doe",
      age: "30",
      city: "New_York",
    };
    const expected = "?name=John_Doe&age=30&city=New_York";
    const result = convertObjectToQuery(obj);
    expect(result).toEqual(expected);
  });

  it("encodes own properties and excludes inherited properties", () => {
    const obj = Object.assign(Object.create({ inherited: "bad" }), {
      "a b": "x&y",
    });
    expect(convertObjectToQuery(obj)).toBe("?a%20b=x%26y");
  });
});

describe("convertHttpToHttps", () => {
  test("converts an HTTP URL to an HTTPS URL", () => {
    const url = "http://example.com";
    const expected = "https://example.com";
    expect(convertHttpToHttps(url)).toBe(expected);
  });

  test("does not change an HTTPS URL", () => {
    const url = "https://example.com";
    const expected = "https://example.com";
    expect(convertHttpToHttps(url)).toBe(expected);
  });

  test("handles URLs with paths correctly", () => {
    const url = "http://example.com/path/to/resource";
    const expected = "https://example.com/path/to/resource";
    expect(convertHttpToHttps(url)).toBe(expected);
  });

  test("handles URLs with query parameters correctly", () => {
    const url = "http://example.com/path?name=value";
    const expected = "https://example.com/path?name=value";
    expect(convertHttpToHttps(url)).toBe(expected);
  });

  test("handles URLs with ports correctly", () => {
    const url = "http://example.com:8080";
    const expected = "https://example.com:8080";
    expect(convertHttpToHttps(url)).toBe(expected);
  });

  test("does not alter non-http URLs", () => {
    const url = "ftp://example.com";
    const expected = "ftp://example.com";
    expect(convertHttpToHttps(url)).toBe(expected);
  });

  test("returns the same URL if it does not start with http:", () => {
    const url = "example.com";
    const expected = "example.com";
    expect(convertHttpToHttps(url)).toBe(expected);
  });
});

describe("getAllQueryParams", () => {
  beforeEach(() => {
    // Mock the global location object
    delete global.location;
    global.location = {
      search: "",
    };
  });

  test("should return an empty object when no query params are present", () => {
    global.location.search = "";
    const result = getAllQueryParams();
    expect(result).toEqual({});
  });

  test("should return an object with query params from location.search", () => {
    global.location.search = "?t1=1&t2=2&t3=3&t4=4";
    const result = getAllQueryParams();
    expect(result).toEqual({ t1: "1", t2: "2", t3: "3", t4: "4" });
  });

  test("should return an object with query params from the provided URL", () => {
    const url = "?a=10&b=20&c=30";
    const result = getAllQueryParams(url);
    expect(result).toEqual({ a: "10", b: "20", c: "30" });
  });

  test("should parse a bare query string", () => {
    expect(getAllQueryParams("a=10&b=20")).toEqual({ a: "10", b: "20" });
    expect(getUrlParam("a=10&b=20", "a")).toBe("10");
  });

  test("should decode URI components in query params", () => {
    const url = "?name=John%20Doe&city=New%20York";
    const result = getAllQueryParams(url);
    expect(result).toEqual({ name: "John Doe", city: "New York" });
  });

  test("should support encoded and hyphenated keys plus form-style spaces", () => {
    expect(getAllQueryParams("?a-b=hello+world&a%2Eb=value")).toEqual({
      "a-b": "hello world",
      "a.b": "value",
    });
  });

  test("returns prototype-named keys as safe own properties", () => {
    const result = getAllQueryParams("?__proto__=safe&constructor=ctor&toString=text");

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.keys(result)).toEqual([ "__proto__", "constructor", "toString" ]);
    expect(result.__proto__).toBe("safe");
    expect(result.constructor).toBe("ctor");
    expect(result.toString).toBe("text");
    expect(Object.prototype.polluted).toBeUndefined();
  });

  test("should handle empty values in query params", () => {
    const url = "?key1=&key2=value2";
    const result = getAllQueryParams(url);
    expect(result).toEqual({ key1: "", key2: "value2" });
  });

  test("should handle query params without values", () => {
    const url = "?key1&key2=value2";
    const result = getAllQueryParams(url);
    expect(result).toEqual({ key2: "value2" });
  });

  test("should handle duplicate keys by keeping the first occurrence", () => {
    const url = "?key=value1&key=value2";
    const result = getAllQueryParams(url);
    expect(result).toEqual({ key: "value1" });
  });
});

describe("URL constructor compatibility", () => {
  it("gets host and path when URL.canParse is unavailable", () => {
    const originalCanParse = Object.getOwnPropertyDescriptor(window.URL, "canParse");
    Object.defineProperty(window.URL, "canParse", {
      configurable: true,
      value: undefined,
    });
    try {
      expect(getUrlHost("https://example.com:8080/path")).toBe("example.com:8080");
      expect(getUrlPath("https://example.com:8080/path")).toBe("/path");
    } finally {
      if (originalCanParse) {
        Object.defineProperty(window.URL, "canParse", originalCanParse);
      } else {
        delete window.URL.canParse;
      }
    }
  });
});

describe("onURLChange", () => {
  const rawPushState = window.history.pushState;
  const rawReplaceState = window.history.replaceState;

  const clearOnURLChangeInternals = () => {
    delete window.history.__mazeyUrlChangePatched__;
    delete window.history.__mazeyUrlChangeSubscribers__;
    delete window.history.__mazeyRawPushState__;
    delete window.history.__mazeyRawReplaceState__;
  };

  beforeEach(() => {
    // Fully reset to native methods before each case
    window.history.pushState = rawPushState;
    window.history.replaceState = rawReplaceState;
    clearOnURLChangeInternals();

    // Safe URL reset (relative path only)
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.history.pushState = rawPushState;
    window.history.replaceState = rawReplaceState;
    clearOnURLChangeInternals();
    window.history.replaceState({}, "", "/");
  });

  test("should fire on init by default", () => {
    const callback = jest.fn();
    const unsubscribe = onURLChange(callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].trigger).toBe("load");
    expect(callback.mock.calls[0][0].url).toBe(window.location.href);
    expect(callback.mock.calls[0][0].oldUrl).toBe(window.location.href);

    unsubscribe();
  });

  test("should not fire on init when fireOnInit is false", () => {
    const callback = jest.fn();
    const unsubscribe = onURLChange(callback, { fireOnInit: false });

    expect(callback).toHaveBeenCalledTimes(0);
    unsubscribe();
  });
});
