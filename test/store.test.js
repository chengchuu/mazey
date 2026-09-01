/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  setSessionStorage,
  getSessionStorage,
  setLocalStorage,
  getLocalStorage,
  getCookie,
  setCookie,
  delCookie,
  removeCookie,
} from "../lib/index.esm";

describe("setSessionStorage", () => {
  it("should set sessionStorage correctly: string", () => {
    setSessionStorage("test", "test");
    expect(sessionStorage.getItem("test")).toBe("\"test\"");
  });

  it("should set sessionStorage correctly: object", () => {
    setSessionStorage("test", { a: 1 });
    expect(sessionStorage.getItem("test")).toBe("{\"a\":1}");
  });

  it("should set sessionStorage correctly: array", () => {
    setSessionStorage("test", [ 1, 2, 3 ]);
    expect(sessionStorage.getItem("test")).toBe("[1,2,3]");
  });

  it("stores undefined as JSON null instead of an unparsable string", () => {
    setSessionStorage("test", undefined);
    expect(sessionStorage.getItem("test")).toBe("null");
    expect(getSessionStorage("test")).toBeNull();
  });
});

describe("getSessionStorage", () => {
  it("should get sessionStorage correctly: string", () => {
    sessionStorage.setItem("test", "\"test\"");
    expect(getSessionStorage("test")).toBe("test");
  });

  it("should get sessionStorage correctly: object", () => {
    sessionStorage.setItem("test", "{\"a\":1}");
    expect(getSessionStorage("test")).toEqual({ a: 1 });
  });

  it("should get sessionStorage correctly: array", () => {
    sessionStorage.setItem("test", "[1,2,3]");
    expect(getSessionStorage("test")).toEqual([ 1, 2, 3 ]);
  });

  it("returns legacy non-JSON values without throwing", () => {
    sessionStorage.setItem("test", "legacy-value");
    expect(getSessionStorage("test")).toBe("legacy-value");
  });
});

describe("setLocalStorage", () => {
  it("should set the value in local storage", () => {
    const key = "testKey";
    const value = { name: "John", age: 30 };

    setLocalStorage(key, value);

    const storedValue = JSON.parse(localStorage.getItem(key) || "");

    expect(storedValue).toEqual(value);
  });

  it("should remove the value from local storage if null is passed", () => {
    const key = "testKey";
    const value = { name: "John", age: 30 };

    localStorage.setItem(key, JSON.stringify(value));

    setLocalStorage(key, null);

    const storedValue = localStorage.getItem(key);

    expect(storedValue).toEqual("null");
  });

  it("should not set the value in local storage if key is empty", () => {
    const key = "";
    const value = { name: "John", age: 30 };

    setLocalStorage(key, value);

    const storedValue = localStorage.getItem(key);

    expect(storedValue).toBeNull();
  });

  it("stores undefined as JSON null instead of an unparsable string", () => {
    setLocalStorage("test", undefined);
    expect(localStorage.getItem("test")).toBe("null");
    expect(getLocalStorage("test")).toBeNull();
  });
});

describe("getLocalStorage", () => {
  it("should get localStorage correctly: string", () => {
    localStorage.setItem("test", "\"test\"");
    expect(getLocalStorage("test")).toBe("test");
  });

  it("should get localStorage correctly: object", () => {
    localStorage.setItem("test", "{\"a\":1}");
    expect(getLocalStorage("test")).toEqual({ a: 1 });
  });

  it("should get localStorage correctly: array", () => {
    localStorage.setItem("test", "[1,2,3]");
    expect(getLocalStorage("test")).toEqual([ 1, 2, 3 ]);
  });

  it("returns legacy non-JSON values without throwing", () => {
    localStorage.setItem("test", "legacy-value");
    expect(getLocalStorage("test")).toBe("legacy-value");
  });
});

describe("setLocalStorage&getLocalStorage", () => {
  it("should set/get localStorage correctly: string", () => {
    setLocalStorage("test", "test");
    expect(getLocalStorage("test")).toBe("test");
  });

  it("should set/get localStorage correctly: object", () => {
    setLocalStorage("test", { a: 1 });
    expect(getLocalStorage("test")).toEqual({ a: 1 });
  });

  it("should set/get localStorage correctly: array", () => {
    setLocalStorage("test", [ 1, 2, 3 ]);
    expect(getLocalStorage("test")).toEqual([ 1, 2, 3 ]);
  });

  it("should set/get localStorage correctly: number", () => {
    setLocalStorage("test", 1);
    const res = getLocalStorage("test");
    expect(typeof res).toBe("number");
    expect(res).toBe(1);
  });

  it("should return null for non-existent keys", () => {
    const key = "nonExistentKey";
    const retrievedValue = getLocalStorage(key);
    expect(retrievedValue).toBeNull();
  });
});

describe("getCookie", () => {
  beforeEach(() => {
    // Set up any necessary test setup here
    document.cookie = "cookie1=value1";
  });

  afterEach(() => {
    removeCookie("external");
  });

  it("should return the value of the specified cookie", () => {
    expect(getCookie("cookie1")).toBe("value1");
  });

  it("should return an empty string if the cookie does not exist", () => {
    expect(getCookie("nonexistent")).toBe("");
  });

  it("preserves literal percent sequences from external cookies", () => {
    document.cookie = "external=abc%2Fdef";
    expect(getCookie("external")).toBe("abc%2Fdef");
  });

  it("preserves legacy values that begin with the internal encoding marker", () => {
    document.cookie = "external=__mazey_uri_encoded__:hello%20world";
    expect(getCookie("external")).toBe("__mazey_uri_encoded__:hello%20world");
  });

  it("does not alias a literal encoded-name cookie to a different name", () => {
    const cookieName = "__mazey_cookie_name_encoded__-external";
    document.cookie = `${cookieName}=unrelated`;

    try {
      expect(getCookie("external")).toBe("");
      expect(removeCookie("external")).toBe(false);
      expect(document.cookie).toContain(`${cookieName}=unrelated`);
    } finally {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });

  it("reads and removes legacy cookie names containing percent sequences", () => {
    document.cookie = "legacy%20name=value";

    expect(getCookie("legacy%20name")).toBe("value");
    expect(removeCookie("legacy%20name")).toBe(true);
  });

  it("reads and removes legacy raw cookie names that now require encoding", () => {
    document.cookie = "legacy name=value";

    expect(getCookie("legacy name")).toBe("value");
    expect(removeCookie("legacy name")).toBe(true);
  });
});

describe("setCookie", () => {
  it("should set a cookie with the provided name and value", () => {
    setCookie("cookie1", "value1");
    expect(document.cookie).toContain("cookie1=value1");
  });

  it("round-trips names and values containing cookie delimiters", () => {
    setCookie("cookie name", "one=two; three");

    expect(getCookie("cookie name")).toBe("one=two; three");
    expect(removeCookie("cookie name")).toBe(true);
  });

  it("round-trips safe names with encoded values without changing legacy values", () => {
    const value = "__mazey_uri_encoded__:one=two; three";
    setCookie("encoded-value", value);

    expect(getCookie("encoded-value")).toBe(value);
    expect(document.cookie).toContain(`encoded-value=${encodeURIComponent(value)}`);
    expect(document.cookie).toContain("__mazey_cookie_value_encoded__-encoded-value=1");
    expect(removeCookie("encoded-value")).toBe(true);
  });

  it("preserves the requested cookie name when the value requires encoding", () => {
    setCookie("session", "hello world");

    expect(document.cookie).toContain("session=hello%20world");
    expect(document.cookie).not.toContain("__mazey_cookie_value_encoded__-session=__mazey_uri_encoded__");
    expect(getCookie("session")).toBe("hello world");
    expect(removeCookie("session")).toBe(true);
  });

  it("does not double-encode cookie-safe percent sequences", () => {
    setCookie("encoded-token", "abc%2Fdef");

    expect(document.cookie).toContain("encoded-token=abc%2Fdef");
    expect(document.cookie).not.toContain("encoded-token=abc%252Fdef");
    expect(getCookie("encoded-token")).toBe("abc%2Fdef");
    expect(removeCookie("encoded-token")).toBe(true);
  });

  it("keeps encoded and literal-percent cookie names distinct", () => {
    const reservedName = "__mazey_cookie_name_encoded__-cookie%20name";
    setCookie("cookie name", "space");
    setCookie("cookie%20name", "percent");
    setCookie(reservedName, "reserved");

    expect(getCookie("cookie name")).toBe("space");
    expect(getCookie("cookie%20name")).toBe("percent");
    expect(getCookie(reservedName)).toBe("reserved");
    expect(removeCookie("cookie name")).toBe(true);
    expect(removeCookie("cookie%20name")).toBe(true);
    expect(removeCookie(reservedName)).toBe(true);
  });

  it("prefers the new name and removes both new and legacy variants", () => {
    document.cookie = "legacy name=legacy";
    setCookie("legacy name", "new");

    expect(getCookie("legacy name")).toBe("new");
    expect(removeCookie("legacy name")).toBe(true);
    expect(document.cookie).not.toContain("legacy name=");
    expect(document.cookie).not.toContain("__mazey_cookie_name_encoded__-legacy%20name=");
  });

  it("works without Array.from or modern string helpers", () => {
    const originalArrayFrom = Array.from;
    const originalIncludes = String.prototype.includes;
    const originalStartsWith = String.prototype.startsWith;
    let value;
    let removed;
    try {
      Array.from = undefined;
      String.prototype.includes = undefined;
      String.prototype.startsWith = undefined;
      setCookie("legacy", "one=two; three");
      value = getCookie("legacy");
      removed = removeCookie("legacy");
    } finally {
      Array.from = originalArrayFrom;
      String.prototype.includes = originalIncludes;
      String.prototype.startsWith = originalStartsWith;
    }

    expect(value).toBe("one=two; three");
    expect(removed).toBe(true);
  });
});

describe("removeCookie", () => {
  const originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  afterEach(() => {
    window.history.replaceState({}, "", "/account/page");
    document.cookie = "path-cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/account";
    window.history.replaceState({}, "", originalPath);
  });

  it("removes a cookie scoped to the current directory", () => {
    window.history.replaceState({}, "", "/account/page");
    document.cookie = "path-cookie=value; path=/account";

    expect(getCookie("path-cookie")).toBe("value");
    expect(removeCookie("path-cookie")).toBe(true);
    expect(getCookie("path-cookie")).toBe("");
  });
});

describe("delCookie", () => {
  beforeEach(() => {
    // Set up any necessary test setup here
    document.cookie = "cookie1=value1";
  });

  it("should delete the specified cookie", () => {
    delCookie("cookie1");
    expect(document.cookie).toBe("");
  });
});
