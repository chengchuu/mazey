/** @jest-environment jsdom */
/* eslint-env jest, browser */

import * as mazey from "../lib/index.esm";

describe("canonical utility names", () => {
  test.each([
    [ "isCNMobileNumber", "isValidPhoneNumber" ],
    [ "escapeHTML", "sanitizeInput" ],
    [ "unescapeHTML", "unsanitizeInput" ],
    [ "createCSSRule", "genStyleString" ],
    [ "getBrowserClassNames", "genBrowserAttrs" ],
    [ "getURLPathExtension", "getUrlFileType" ],
    [ "truncateByWeightedLength", "cutZHString" ],
  ])("exports %s and retains %s as the same function", (canonical, legacy) => {
    expect(typeof mazey[canonical]).toBe("function");
    expect(mazey[legacy]).toBe(mazey[canonical]);
  });

  test.each([
    [ "13800138000", true ],
    [ "10000000000", true ],
    [ "1380013800", false ],
    [ "23800138000", false ],
    [ "+8613800138000", false ],
    [ "13800138000\n", false ],
    [ "", false ],
  ])("preserves the mobile-number format check for %j", (input, expected) => {
    expect(mazey.isCNMobileNumber(input)).toBe(expected);
    expect(mazey.isMobile(input)).toBe(expected);
    expect(mazey.isMobile).toBe(mazey.isCNMobileNumber);
  });

  test("escapes the same six characters and decodes only the fixed entity set", () => {
    const input = "&<>\"'/";
    const escaped = "&amp;&lt;&gt;&quot;&#x27;&#x2F;";
    expect(mazey.escapeHTML(input)).toBe(escaped);
    expect(mazey.unescapeHTML(escaped)).toBe(input);
    expect(mazey.unsanitize(escaped)).toBe(input);
    expect(mazey.escapeHTML("&amp;")).toBe("&amp;amp;");
    expect(mazey.unescapeHTML("&amp;lt;")).toBe("&lt;");
    expect(mazey.unescapeHTML("&#39;&nbsp;&#47;")).toBe("&#39;&nbsp;&#47;");
    expect(mazey.escapeHTML("")).toBe("");
    expect(mazey.unescapeHTML("")).toBe("");
    expect(() => mazey.escapeHTML(null)).toThrow("Input must be a string");
    expect(() => mazey.unescapeHTML(null)).toThrow("Input must be a string");
  });

  test("creates rule text without touching the document", () => {
    const original = document.documentElement.outerHTML;
    expect(mazey.createCSSRule(".notice", [ "color:red", "display:block" ]))
      .toBe(".notice{color:red;display:block;}");
    expect(mazey.createCSSRule(".notice", [])).toBe(".notice{}");
    expect(document.documentElement.outerHTML).toBe(original);
  });

  test("returns class tokens from the existing browser cache without DOM mutation", () => {
    const originalInfo = window.MAZEY_BROWSER_INFO;
    const originalHTML = document.documentElement.outerHTML;
    window.MAZEY_BROWSER_INFO = {
      system: "windows", platform: "desktop", engine: "webkit",
      supporter: "chrome", shell: "", appleType: "",
    };
    try {
      expect(mazey.getBrowserClassNames()).toEqual([
        "windows", "desktop", "webkit", "chrome",
      ]);
      expect(mazey.getBrowserClassNames("browser", "_")).toEqual([
        "browser_windows", "browser_desktop", "browser_webkit", "browser_chrome",
      ]);
      expect(mazey.getBrowserClassNames("", "_")).toEqual([
        "windows", "desktop", "webkit", "chrome",
      ]);
      expect(document.documentElement.outerHTML).toBe(originalHTML);
    } finally {
      if (originalInfo === undefined) delete window.MAZEY_BROWSER_INFO;
      else window.MAZEY_BROWSER_INFO = originalInfo;
    }
  });

  test.each([
    [ "https://example.com/a.png?width=20#preview", "png" ],
    [ "/images/a.JPG", "JPG" ],
    [ "/images.v1/photo", "" ],
    [ "/archive.tar.gz", "tar.gz" ],
    [ "https://example.com", "com" ],
    [ "/image.", "" ],
    [ "", "" ],
  ])("preserves extension extraction for %j", (input, expected) => {
    expect(mazey.getURLPathExtension(input)).toBe(expected);
  });

  test.each([
    [ "Hello世界", 7, "Hello世" ],
    [ "é世", 2, "é" ],
    [ "ĀA", 2, "Ā" ],
    [ "😀", 2, "\ud83d" ],
    [ "abc", 0, "" ],
    [ null, 5, "" ],
    [ undefined, 5, "" ],
  ])("preserves weighted UTF-16 truncation for %j", (input, limit, expected) => {
    expect(mazey.truncateByWeightedLength(input, limit)).toBe(expected);
    expect(mazey.truncateZHString(input, limit)).toBe(expected);
    expect(mazey.cutCHSString(input, limit)).toBe(expected);
  });

  test("appends truncation text outside the limit and retains boolean aliases", () => {
    expect(mazey.truncateByWeightedLength("Hello世界", 7, {
      hasDot: true, dotText: "…",
    })).toBe("Hello世…");
    expect(mazey.truncateByWeightedLength("Hello", 5, { hasDot: true })).toBe("Hello");
    expect(mazey.truncateZHString("Hello世界", 7, true)).toBe("Hello世...");
    expect(mazey.cutCHSString("Hello世界", 7, true)).toBe("Hello世...");
  });
});
