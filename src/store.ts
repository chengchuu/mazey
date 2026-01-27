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
    sessionStorage.setItem(key, JSON.stringify(value));
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
      ret = JSON.parse(value) as T;
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
    localStorage.setItem(key, JSON.stringify(value));
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
      ret = JSON.parse(value) as T;
    }
  }
  return ret;
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
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
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
  let domainParts, expires;
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  } else {
    expires = "";
  }
  const host = location.host;
  if (host.split(".").length === 1) {
    // no "." in a domain - it's localhost or something similar
    document.cookie = name + "=" + value + expires + "; path=/";
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
    domainParts = host.split(".");
    domainParts.shift();
    domain = domain || "." + domainParts.join(".");
    document.cookie = name + "=" + value + expires + "; path=/; domain=" + domain;
    // check if cookie was successfuly set to the given domain
    // (otherwise it was a Top-Level Domain)
    if (getCookie(name) === null || getCookie(name) !== value) {
      // append "." to current domain
      domain = domain || "." + host;
      document.cookie = name + "=" + value + expires + "; path=/; domain=" + domain;
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
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${name}=`)) {
      const cookieParts = cookie.split("=");
      const cookieName = cookieParts[0];
      const expires = new Date();
      expires.setTime(expires.getTime() - 1);
      document.cookie = `${cookieName}=;expires=${expires.toUTCString()}`;
      return true;
    }
  }
  return false;
}

/**
 * Alias of `removeCookie`.
 * 
 * @hidden
 */
export function delCookie(name: string): void {
  removeCookie(name);
}
