/**
 * EN: Handle Storage (Keep fit for JSON, it can transfer format automatically).
 *
 * ZH: 存储/获取数据到 sessionStorage/localStorage。
 *
 * Usage:
 *
 * ```javascript
 * import { setSessionStorage, getSessionStorage, setLocalStorage, getLocalStorage } from "mazey";
 *
 * setSessionStorage("test", "123");
 * const ret1 = getSessionStorage("test");
 * setLocalStorage("test", "123");
 * const ret2 = getLocalStorage("test");
 * console.log(ret1, ret2);
 *
 * // or package in usage
 * const projectName = "mazey";
 * function mSetLocalStorage (key, value) {
 *   return setLocalStorage(`${projectName}_${key}`, value);
 * }
 *
 * function mGetLocalStorage (key) {
 *   return getLocalStorage(`${projectName}_${key}`);
 * }
 * ```
 *
 * Output:
 *
 * ```text
 * 123 123
 * ```
 *
 * @param {string} key 键
 * @returns {void} 返回值
 * @category Store
 */
export function setSessionStorage<T>(key: string, value: T | null = null): void {
  if (key) {
    const serializedValue = JSON.stringify(value);
    sessionStorage.setItem(key, serializedValue === undefined ? "null" : serializedValue);
  }
}

/**
 * EN: Handle Storage (Keep fit for JSON, it can transfer format automatically).
 *
 * ZH: 存储/获取数据到 sessionStorage/localStorage。
 *
 * Usage:
 *
 * ```javascript
 * import { setSessionStorage, getSessionStorage, setLocalStorage, getLocalStorage } from "mazey";
 *
 * setSessionStorage("test", "123");
 * const ret1 = getSessionStorage("test");
 * setLocalStorage("test", "123");
 * const ret2 = getLocalStorage("test");
 * console.log(ret1, ret2);
 *
 * // or package in usage
 * const projectName = "mazey";
 * function mSetLocalStorage (key, value) {
 *   return setLocalStorage(`${projectName}_${key}`, value);
 * }
 *
 * function mGetLocalStorage (key) {
 *   return getLocalStorage(`${projectName}_${key}`);
 * }
 * ```
 *
 * Output:
 *
 * ```text
 * 123 123
 * ```
 *
 * @param {string} key 键
 * @returns {any} 返回值
 * @category Store
 */
export function getSessionStorage<T>(key: string): T | null {
  let ret: T | null = null;
  if (key) {
    const value = sessionStorage.getItem(key);
    if (value) {
      try {
        ret = JSON.parse(value) as T;
      } catch (e) {
        ret = value as T;
      }
    }
  }
  return ret;
}

/**
 * EN: Handle Storage (Keep fit for JSON, it can transfer format automatically).
 *
 * ZH: 存储/获取数据到 sessionStorage/localStorage。
 *
 * Usage:
 *
 * ```javascript
 * import { setSessionStorage, getSessionStorage, setLocalStorage, getLocalStorage } from "mazey";
 *
 * setSessionStorage("test", "123");
 * const ret1 = getSessionStorage("test");
 * setLocalStorage("test", "123");
 * const ret2 = getLocalStorage("test");
 * console.log(ret1, ret2);
 *
 * // or package in usage
 * const projectName = "mazey";
 * function mSetLocalStorage (key, value) {
 *   return setLocalStorage(`${projectName}_${key}`, value);
 * }
 *
 * function mGetLocalStorage (key) {
 *   return getLocalStorage(`${projectName}_${key}`);
 * }
 * ```
 *
 * Output:
 *
 * ```text
 * 123 123
 * ```
 *
 * @param {string} key 键
 * @returns {void} 返回值
 * @category Store
 */
export function setLocalStorage<T>(key: string, value: T | null = null): void {
  if (key) {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue === undefined ? "null" : serializedValue);
  }
}

/**
 * EN: Handle Storage (Keep fit for JSON, it can transfer format automatically).
 *
 * ZH: 存储/获取数据到 sessionStorage/localStorage。
 *
 * Usage:
 *
 * ```javascript
 * import { setSessionStorage, getSessionStorage, setLocalStorage, getLocalStorage } from "mazey";
 *
 * setSessionStorage("test", "123");
 * const ret1 = getSessionStorage("test");
 * setLocalStorage("test", "123");
 * const ret2 = getLocalStorage("test");
 * console.log(ret1, ret2);
 *
 * // or package in usage
 * const projectName = "mazey";
 * function mSetLocalStorage (key, value) {
 *   return setLocalStorage(`${projectName}_${key}`, value);
 * }
 *
 * function mGetLocalStorage (key) {
 *   return getLocalStorage(`${projectName}_${key}`);
 * }
 * ```
 *
 * Output:
 *
 * ```text
 * 123 123
 * ```
 *
 * @param {string} key 键
 * @returns {void} 返回值
 * @category Store
 */
export function getLocalStorage<T>(key: string): T | null {
  let ret: T | null = null;
  if (key) {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        ret = JSON.parse(value) as T;
      } catch (e) {
        ret = value as T;
      }
    }
  }
  return ret;
}

const encodedCookieNamePrefix = "__mazey_cookie_name_encoded__-";
const encodedCookieValueNamePrefix = "__mazey_cookie_value_encoded__-";

interface SerializedCookieValue {
  isEncoded: boolean;
  value: string;
}

function getEncodedCookieName(name: string): string {
  return `${encodedCookieNamePrefix}${encodeURIComponent(name)}`;
}

function getEncodedCookieValueName(name: string): string {
  return `${encodedCookieValueNamePrefix}${encodeURIComponent(name)}`;
}

function serializeCookieName(name: string): string {
  const isCookieSafe = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name);
  const hasReservedPrefix = name.indexOf(encodedCookieNamePrefix) === 0 ||
    name.indexOf(encodedCookieValueNamePrefix) === 0;
  return isCookieSafe && !hasReservedPrefix
    ? name
    : getEncodedCookieName(name);
}

function getCookieNameCandidates(name: string): string[] {
  const serializedName = serializeCookieName(name);
  if (serializedName !== name) {
    return [ serializedName, name ];
  }
  return [ name ];
}

function getStoredCookieValue(cookieName: string): string | undefined {
  const nameEQ = cookieName + "=";
  const cookies = document.cookie.split(";");
  for (let index = 0; index < cookies.length; index++) {
    const cookie = cookies[index].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length);
    }
  }
  return undefined;
}

function serializeCookieValue(value: string): SerializedCookieValue {
  let isCookieSafe = true;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (!(code === 0x21 ||
      (code >= 0x23 && code <= 0x2B) ||
      (code >= 0x2D && code <= 0x3A) ||
      (code >= 0x3C && code <= 0x5B) ||
      (code >= 0x5D && code <= 0x7E))) {
      isCookieSafe = false;
      break;
    }
  }
  return {
    isEncoded: !isCookieSafe,
    value: isCookieSafe ? value : encodeURIComponent(value),
  };
}

/**
 * EN: Handle Cookie.
 *
 * ZH: 设置/获取 Cookie。
 *
 * Usage:
 *
 * ```javascript
 * import { setCookie, getCookie } from "mazey";
 *
 * setCookie("test", "123", 30, "example.com"); // key value day domain
 * const ret = getCookie("test");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 123
 * ```
 *
 * @category Store
 */
export function getCookie(name: string): string {
  const cookieNames = getCookieNameCandidates(name);
  const isEncoded = getStoredCookieValue(getEncodedCookieValueName(name)) === "1";
  for (let index = 0; index < cookieNames.length; index++) {
    const value = getStoredCookieValue(cookieNames[index]);
    if (value !== undefined) {
      if (isEncoded) {
        try {
          return decodeURIComponent(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    }
  }
  return "";
}

/**
 * EN: Handle Cookie.
 *
 * ZH: 设置/获取 Cookie。
 *
 * Usage:
 *
 * ```javascript
 * import { setCookie, getCookie } from "mazey";
 *
 * setCookie("test", "123", 30, "example.com"); // key value day domain
 * const ret = getCookie("test");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 123
 * ```
 *
 * @category Store
 */
export function setCookie(name: string, value: string, days?: number, domain?: string): void {
  let expires;
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  } else {
    expires = "";
  }
  const serializedValue = serializeCookieValue(value);
  const serializedName = serializeCookieName(name);
  const markerValue = serializedValue.isEncoded ? "1" : "";
  const markerExpires = serializedValue.isEncoded
    ? expires
    : "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const cookies = [
    `${serializedName}=${serializedValue.value}${expires}; path=/`,
    `${getEncodedCookieValueName(name)}=${markerValue}${markerExpires}; path=/`,
  ];
  const writeCookies = (cookieDomain?: string) => {
    const domainAttribute = cookieDomain ? `; domain=${cookieDomain}` : "";
    cookies.forEach(cookie => {
      document.cookie = `${cookie}${domainAttribute}`;
    });
  };
  const host = location.hostname;
  if (domain) {
    writeCookies(domain);
  } else if (host.indexOf(".") === -1) {
    // no "." in a domain - it's localhost or something similar
    writeCookies();
  } else {
    // Remember the cookie on all subdomains.
    //
    // Start with trying to set cookie to the top domain.
    // (example: if user is on foo.com, try to set
    //  cookie to domain ".com")
    //
    // If the cookie will not be set, it means ".com"
    // is a top level domain and we need to
    // set the cookie to ".foo.com"
    const domainParts = host.split(".");
    domainParts.shift();
    const parentDomain = "." + domainParts.join(".");
    writeCookies(parentDomain);
    // check if cookie was successfuly set to the given domain
    // (otherwise it was a Top-Level Domain)
    if (getCookie(name) !== value) {
      writeCookies(`.${host}`);
    }
  }
}

/**
 * Delete a cookie by name.
 *
 * Usage:
 *
 * ```javascript
 * import { removeCookie } from "mazey";
 *
 * const ret = removeCookie("test");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param name - The name of the cookie to delete.
 * @returns `true` if the cookie was deleted successfully, `false` otherwise.
 * @category Store
 */
export function removeCookie(name: string): boolean {
  const valueCookieNames = getCookieNameCandidates(name);
  const cookieNames = valueCookieNames.concat(getEncodedCookieValueName(name));
  const expires = new Date();
  expires.setTime(expires.getTime() - 1);
  const removed = valueCookieNames.some(cookieName => getStoredCookieValue(cookieName) !== undefined);
  cookieNames.forEach((cookieName, index) => {
    if (cookieNames.indexOf(cookieName) === index && getStoredCookieValue(cookieName) !== undefined) {
      const expiredCookies = [
        `${cookieName}=; expires=${expires.toUTCString()}`,
        `${cookieName}=; expires=${expires.toUTCString()}; path=/`,
      ];
      expiredCookies.forEach(expiredCookie => {
        document.cookie = expiredCookie;
        const host = location.hostname;
        if (host.indexOf(".") !== -1) {
          const domainParts = host.split(".");
          for (let domainIndex = 0; domainIndex < domainParts.length; domainIndex++) {
            document.cookie = `${expiredCookie}; domain=.${domainParts.slice(domainIndex).join(".")}`;
          }
        }
      });
    }
  });
  return removed && cookieNames.every(cookieName => (
    getStoredCookieValue(cookieName) === undefined
  ));
}

/**
 * Alias of `removeCookie`.
 *
 * @hidden
 */
export function delCookie(name: string): void {
  removeCookie(name);
}
