// import { mazeyCon } from "./debug";
import type { MultiValueUrlParams, SingleValueUrlParams } from "./typing";

/**
 * Get the query param's value of the current Web URL(`location.search`).
 *
 * Usage:
 *
 * ```javascript
 * import { getQueryParam } from "mazey";
 * 
 * // http://example.com/?t1=1&t2=2&t3=3&t4=4#2333
 * // ?t1=1&t2=2&t3=3&t4=4
 * const p1 = getQueryParam("t3");
 * const p2 = getQueryParam("t4");
 * console.log(p1, p2);
 * ```
 *
 * Output:
 *
 * ```text
 * 3 4
 * ```
 *
 * @param {string} param Query param.
 * @returns {string} value
 * @category URL
 */
export function getQueryParam(param: string): string {
  const reg = new RegExp("(^|&)" + param + "=([^&]*)(&|$)");
  const r = location.search.substring(1).match(reg);
  if (r !== null) {
    return decodeURIComponent(r[2]);
  }
  return "";
}

/**
 * Get the all query params of the current Web URL(`location.search`).
 * 
 * Usage:
 * 
 * ```javascript
 * import { getAllQueryParams } from "mazey";
 * 
 * // http://example.com/?t1=1&t2=2&t3=3&t4=4#2333
 * // ?t1=1&t2=2&t3=3&t4=4
 * const ret = getAllQueryParams();
 * console.log(ret);
 * ```
 * 
 * Output:
 * 
 * ```text
 * { t1: "1", t2: "2", t3: "3", t4: "4" }
 * ```
 * 
 * @param {string} url Optional, The URL string.
 * @returns {object} The query params object.
 * @category URL
 */
export function getAllQueryParams(url: string = ""): SingleValueUrlParams {
  if (url === "") {
    url = location.search;
  }
  const result: SingleValueUrlParams = {};
  url.replace(/\??(\w+)=([^&]*)&?/g, function(_: string, key: string, val: string): string {
    if (result[ key ] === undefined) {
      result[ key ] = decodeURIComponent(val);
    }
    return "";
  });
  return result;
}

/**
 * Returns the value of the specified query parameter in the input URL.
 *
 * Usage:
 *
 * ```javascript
 * import { getUrlParam } from "mazey";
 * 
 * const p1 = getUrlParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t3");
 * const p2 = getUrlParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t4");
 * console.log(p1, p2);
 * ```
 *
 * Output:
 *
 * ```text
 * 3 4
 * ```
 *
 * @param {string} url The URL string.
 * @param {string} param The query parameter to retrieve the value for.
 * @param {object} options The options object.
 * @param {boolean} options.returnArray Whether to return an array of values for the specified query parameter. Default is false.
 * @returns {string|string[]} The value of the specified query parameter, or an empty string if the parameter is not found.
 * @category URL
 */
export function getUrlParam(url: string, param: string, options: { returnArray?: boolean } = {}): string | string[] | null {
  let res: string | string[] | null = null;
  if (url.includes("#")) {
    const urlObj = new URL(url);
    res = urlObj.searchParams.getAll(param);
  } else {
    const result: MultiValueUrlParams = {};
    url.replace(/\??(\w+)=([^&]*)&?/g, function(_: string, key: string, val: string): string {
      if (result[ key ] !== undefined) {
        result[ key ].push(val);
      } else {
        result[ key ] = [ val ];
      }
      return "";
    });
    res = result[ param ] || [];
  }
  if (options.returnArray) {
    return res;
  } else {
    if (res.length) {
      return res[ 0 ];
    } else {
      return null;      
    }
  }
}

/**
 * Update the query param's value of the input URL.
 *
 * Usage:
 *
 * ```javascript
 * import { updateQueryParam } from "mazey";
 * 
 * const ret1 = updateQueryParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t3", "three");
 * const ret2 = updateQueryParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t4", "four");
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * http://example.com/?t1=1&t2=2&t3=three&t4=4
 * http://example.com/?t1=1&t2=2&t3=3&t4=four
 * ```
 *
 * @param {string} url URL string.
 * @param {string} param Query param.
 * @param {string} value Param's value.
 * @returns {string} URL.
 * @category URL
 */
export function updateQueryParam(url: string, param: string, value: string): string {
  if (url.includes("#")) {
    const urlObj = new URL(url);
    urlObj.searchParams.set(param, value);
    return urlObj.toString();
  } else {
    const re = new RegExp("([?&])" + param + "=.*?(&|$)", "i");
    const separator = url.indexOf("?") !== -1 ? "&" : "?";
    if (url.match(re)) {
      return url.replace(re, "$1" + param + "=" + value + "$2");
    } else {
      return url + separator + param + "=" + value;
    }
  }
}

/**
 * Get the hash query param's value of the current Web URL(`location.hash`).
 *
 * Usage:
 *
 * ```javascript
 * import { getHashQueryParam } from "mazey";
 * 
 * // http://example.com/?#2333?t1=1&t2=2&t3=3&t4=4
 * // #2333?t1=1&t2=2&t3=3&t4=4
 * const p1 = getHashQueryParam("t3");
 * const p2 = getHashQueryParam("t4");
 * console.log(p1, p2);
 * ```
 *
 * Output:
 *
 * ```text
 * 3 4
 * ```
 *
 * @param {string} param Query param.
 * @returns {string} value
 * @category URL
 */
export function getHashQueryParam(param: string): string {
  const hashs = location.hash.split("?");
  if (hashs.length === 1) {
    return "";
  }
  const reg = new RegExp(`(^|&)${param}=([^&]*)(&|$)`);
  const ret = hashs[1].match(reg);
  return ret ? ret[2] : "";
}

/**
 * Get the domain of URL, and other params.
 *
 * Usage:
 *
 * ```javascript
 * import { getDomain } from "mazey";
 * 
 * const ret1 = getDomain("http://example.com/?t1=1&t2=2&t3=3&t4=4");
 * const ret2 = getDomain("http://example.com/test/thanks?t1=1&t2=2&t3=3&t4=4", ["hostname", "pathname"]);
 * const ret3 = getDomain("http://example.com:7890/test/thanks", ["hostname"]);
 * const ret4 = getDomain("http://example.com:7890/test/thanks", ["host"]); // With Port
 * const ret5 = getDomain("http://example.com:7890/test/thanks", ["origin"]);
 * const ret6 = getDomain("http://example.com:7890/test/thanks?id=1", ["origin", "pathname", "search"]);
 * console.log(ret1);
 * console.log(ret2);
 * console.log(ret3);
 * console.log(ret4);
 * console.log(ret5);
 * console.log(ret6);
 * ```
 *
 * Output:
 *
 * ```text
 * example.com
 * example.com/test/thanks
 * example.com
 * example.com:7890
 * http://example.com:7890
 * http://example.com:7890/test/thanks?id=1
 * ```
 *
 * @param {string} url
 * @param {array} rules Object.keys(location), ["href", "origin", "protocol", "host", "hostname", "port", "pathname", "search", "hash"], ["hostname", "pathname"] = "km.mazey.net/plugins/servlet/mobile"
 * @category URL
 */
export function getDomain(url: string, rules = [ "hostname" ]): string {
  if (checkIfURLIsSupported(url)) {
    const u = new window.URL(url);
    // mazeyCon.log(u);
    return rules.reduce((ret, v) => {
      ret += u[v as keyof URL];
      return ret;
    }, "");
  } else {
    const aEl: HTMLAnchorElement = document.createElement("a");
    aEl.href = url;
    return rules.reduce((ret, v) => {
      ret += aEl[v as keyof HTMLAnchorElement];
      return ret;
    }, "");
  }
}

/**
 * Checks if the given string is a valid URL, including **scheme URLs**.
 *
 * Usage:
 *
 * ```javascript
 * import { isValidUrl } from "mazey";
 * 
 * const ret1 = isValidUrl("https://www.example.com");
 * const ret2 = isValidUrl("http://example.com/path/exx/ss");
 * const ret3 = isValidUrl("https://www.example.com/?q=hello&age=24#world");
 * const ret4 = isValidUrl("http://www.example.com/#world?id=9");
 * const ret5 = isValidUrl("ftp://example.com");
 * console.log(ret1, ret2, ret3, ret4, ret5);
 * ```
 *
 * Output:
 *
 * ```text
 * true true true true true
 * ```
 *
 * @remarks
 * If you are specifically checking for HTTP/HTTPS URLs, it is recommended to use the `isValidHttpUrl` function instead.
 * The `isValidUrl` function matches all scheme URLs, including FTP and other non-HTTP schemes.
 *
 * @param url - The URL to check.
 * @returns Returns `true` if the given string is a valid URL, else `false`.
 * @category URL
 */
export function isValidUrl(url: string): boolean {
  const reg = /^[a-zA-Z0-9]+:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\b([-a-zA-Z0-9\u4E00-\u9FA5\u3002\uff1b\uff0c\uff1a\u201c\u201d\uff08\uff09\u3001\uff1f\u300a\u300b()!@:%_+.~#?&//=]*)$/;
  return reg.test(url);
}

/**
 * Check if the given string is a valid HTTP/HTTPS URL.
 *
 * Usage:
 *
 * ```javascript
 * import { isValidHttpUrl } from "mazey";
 * 
 * const ret1 = isValidHttpUrl("https://www.example.com");
 * const ret2 = isValidHttpUrl("http://example.com/path/exx/ss");
 * const ret3 = isValidHttpUrl("https://www.example.com/?q=hello&age=24#world");
 * const ret4 = isValidHttpUrl("http://www.example.com/#world?id=9");
 * const ret5 = isValidHttpUrl("//example.com/a/b/c?q=1", { strict: false });
 * const ret6 = isValidHttpUrl("ftp://example.com");
 * console.log(ret1, ret2, ret3, ret4, ret5, ret6);
 * ```
 *
 * Output:
 *
 * ```text
 * true true true true true false
 * ```
 *
 * @param url
 * @param options.strict - If `true`, the function only matches standard HTTP/HTTPS URLs. Default is `true`. If `false`, the function also matches protocol-relative URLs, such as `//example.com`.
 * @returns {boolean} Return true if the given string is a valid HTTP/HTTPS URL.
 * @category URL
 */
export function isValidHttpUrl(url: string, options: { strict: boolean } = { strict: true }): boolean {
  let reg = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9\u4E00-\u9FA5()!@:%_+.~#?&//=]*)/;
  if (!options.strict) {
    reg = /^(https?:)?\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9\u4E00-\u9FA5()!@:%_+.~#?&//=]*)/;
  }
  return reg.test(url);
}

/**
 * EN: Get the file type of the url.
 *
 * ZH: 获取文件后缀名。
 *
 * Usage:
 *
 * ```javascript
 * import { getUrlFileType } from "mazey";
 * 
 * const ret1 = getUrlFileType("https://example.com/a/b/c.png");
 * const ret2 = getUrlFileType("https://example.com/a/b/c.jpg");
 * const ret3 = getUrlFileType("https://example.com/a/b/c.jpeg");
 * const ret4 = getUrlFileType("/a/b/c.jpeg");
 * const ret5 = getUrlFileType("https://example.com/a/b/c.v/a");
 * console.log(ret1, ret2, ret3, ret4, ret5);
 * ```
 *
 * Output:
 *
 * ```text
 * png jpg jpeg jpeg ""
 * ```
 *
 * @param url
 * @returns
 * @category URL
 */
export function getUrlFileType(url: string): boolean | string {
  let ret = "";
  if (typeof url != "string" || url == "") {
    return ret;
  }
  const type = /\.[^/?#]+$/.exec(url);
  if (!type) {
    return ret;
  }
  if (type[0].length > 1) {
    ret = type[0].substring(1);
  }
  return ret;
}

/**
 * Retrieve a query parameter from a script URL in the browser.
 *
 * Usage:
 *
 * ```html
 * <script src="https://example.com/example.js?test=hello&name=mazey"></script>
 * ```
 * 
 * ```javascript
 * import { getScriptQueryParam } from "mazey";
 * 
 * const ret = getScriptQueryParam("test", "https://example.com/example.js");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * hello
 * ```
 *
 * @param param - The name of the query parameter to retrieve.
 * @param matchString - An optional substring to match in the script URL.
 *                      If not provided, defaults to matching the ".js" substring.
 * @returns The decoded value of the specified query parameter, or an empty string if no matching parameter is found.
 * @category URL
 */
export function getScriptQueryParam(param: string, matchString = ""): string {
  if (!matchString) {
    matchString = ".js";
  }
  const paramRegExp = new RegExp(`[?&]${param}=([^&]*)`);
  const scriptTags = document.querySelectorAll(`script[src*="${matchString}"]`);
  for (let i = 0; i < scriptTags.length; i++) {
    const src = scriptTags[i].getAttribute("src");
    if (src && src.indexOf(matchString) !== -1) {
      const match = src.match(paramRegExp);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
  }
  return "";
}

/**
 * Convert an object to a query string.
 * 
 * Usage:
 * 
 * ```javascript
 * import { convertObjectToQuery } from "mazey";
 * 
 * const ret = convertObjectToQuery({ t1: "1", t2: "2", t3: "3", t4: "4" });
 * console.log(ret);
 * ```
 * 
 * Output:
 * 
 * ```text
 * ?t1=1&t2=2&t3=3&t4=4
 * ```
 * 
 * @param obj - The object to convert to a query string.
 * @returns The query string.
 * @category URL
 */
export function convertObjectToQuery(obj: { [key: string]: string }): string {
  if (obj && Object.keys(obj).length === 0) {
    return "";
  }
  let res: string = "?";
  for (const i in obj) {
    res += `${i}=${obj[i]}&`;
  }
  return res.slice(0, -1);
}

/**
 * Convert an HTTP URL to an HTTPS URL.
 * 
 * Usage:
 * 
 * ```javascript
 * import { convertHttpToHttps } from "mazey";
 * 
 * const ret = convertHttpToHttps("http://example.com");
 * console.log(ret);
 * ```
 * 
 * Output:
 * 
 * ```text
 * https://example.com
 * ```
 * 
 * @param url - The HTTP URL to convert to HTTPS.
 * @returns The HTTPS URL.
 * @category URL
 */
export function convertHttpToHttps(url: string): string {
  return url.replace(/^http:/, "https:");
}

/**
 * Alias of `convertHttpToHttps`.
 * 
 * @hidden
 */
export function replaceHttp(url: string): string {
  return convertHttpToHttps(url);
}

function checkIfURLIsSupported(url: string = "") {
  const URL = window.URL;
  if (!URL) {
    return false;
  }
  if (!URL.canParse) {
    return false;
  }
  if (typeof URL.canParse !== "function") {
    return false;
  }
  try {
    const u = new URL("b", "http://a");
    u.pathname = "c d";
    return (u.href === "http://a/c%20d") && Boolean(u.searchParams) && URL.canParse(url);
  } catch (e) {
    return false;
  }
}

// function checkIfURLSearchParamsSupported() {
//   try {
//     const URLSearchParams = window.URLSearchParams;
//     return (
//       new URLSearchParams("?a=1").toString() === "a=1" &&
//       typeof URLSearchParams.prototype.set === "function" &&
//       typeof URLSearchParams.prototype.entries === "function"
//     );
//   } catch (e) {
//     return false;
//   }
// }

/**
 * Get the host of the URL.
 * 
 * Usage:
 * 
 * ```javascript
 * import { getUrlHost } from "mazey";
 * 
 * const ret = getUrlHost("https://example.com/path/to/page");
 * console.log(ret);
 * ```
 * 
 * Output:
 * 
 * ```text
 * example.com
 * ```
 * 
 * @param url - The URL to get the host from.
 * @returns The host of the URL.
 * @category URL
 */
export function getUrlHost(url: string): string {
  let ret = "";
  if (!isValidHttpUrl(url) && isValidHttpUrl(url, { strict: false }) && url.indexOf("//") === 0) {
    url = "https:" + url;
  }
  if (checkIfURLIsSupported(url)) {
    const urlObj = new URL(url);
    ret = urlObj.host;
  }
  return ret;
}

/**
 * Get the path of the URL.
 * 
 * Usage:
 * 
 * ```javascript
 * import { getUrlPath } from "mazey";
 * 
 * const ret = getUrlPath("https://example.com/path/to/page");
 * console.log(ret);
 * ```
 * 
 * Output:
 * 
 * ```text
 * /path/to/page
 * ```
 * 
 * @param url - The URL to get the path from.
 * @returns The path of the URL.
 * @category URL
 */
export function getUrlPath(url: string): string {
  let ret = "";
  if (!isValidHttpUrl(url) && isValidHttpUrl(url, { strict: false }) && url.indexOf("//") === 0) {
    url = "https:" + url;
  }
  if (checkIfURLIsSupported(url)) {
    const urlObj = new URL(url);
    ret = urlObj.pathname;
  }
  return ret;
}
