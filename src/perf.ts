import { isNonEmptyArray, isNumber, camelCase2Underscore } from "./util";
import type { WebPerformance } from "./typing";

/**
 * @hidden
 */
export function isSupportedEntryType(name: string) {
  let supportedEntryTypes: readonly string[] = [];
  const perfObs = window.PerformanceObserver;
  if (!perfObs) {
    return false;
  }
  if (isNonEmptyArray(perfObs.supportedEntryTypes as unknown[])) {
    supportedEntryTypes = perfObs.supportedEntryTypes;
  }
  return supportedEntryTypes.includes(name);
}

/**
 * Gets the first contentful paint (FCP) time of a web page using the Performance API.
 * The FCP time is the time it takes for the first piece of content to be painted on the screen.
 *
 * Usage:
 *
 * ```javascript
 * import { getFCP } from "mazey";
 * 
 * getFCP().then(
 *  res => {
 *   console.log(`FCP: ${res}`);
 *  }
 * );
 * ```
 *
 * Output:
 *
 * ```text
 * FCP: 123
 * ```
 *
 * @returns A promise that resolves with the FCP time in milliseconds, or 0 if the "paint" entry type is not supported.
 * @category Perf
 */
export async function getFCP(): Promise<number> {
  if (!isSupportedEntryType("paint")) {
    return 0;
  }
  return new Promise(resolve => {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const fcpIns = entries.find(entry => entry.name === "first-contentful-paint");
      if (fcpIns) {
        observer.disconnect();
        resolve(Math.round(fcpIns.startTime));
      }
    });
    observer.observe({ type: "paint", buffered: true });
  });
}

/**
 * Gets the first paint (FP) time of a web page using the Performance API.
 * The FP time is the time it takes for the first pixel to be painted on the screen.
 *
 * Usage:
 *
 * ```javascript
 * import { getFP } from "mazey";
 * 
 * getFP().then(
 *  res => {
 *    console.log(`FP: ${res}`);
 *  }
 * );
 * ```
 *
 * Output:
 *
 * ```text
 * FP: 123
 * ```
 *
 * @returns A promise that resolves with the FP time in milliseconds, or 0 if the "paint" entry type is not supported.
 * @category Perf
 */
export async function getFP(): Promise<number> {
  if (!isSupportedEntryType("paint")) {
    return 0;
  }
  return new Promise(resolve => {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const fpIns = entries.find(entry => entry.name === "first-paint");
      if (fpIns) {
        observer.disconnect();
        resolve(Math.round(fpIns.startTime));
      }
    });
    observer.observe({ type: "paint", buffered: true });
  });
}

/**
 * Gets the largest contentful paint (LCP) time of a web page using the Performance API.
 * The LCP time is the time it takes for the largest piece of content to be painted on the screen.
 *
 * Usage:
 *
 * ```javascript
 * import { getLCP } from "mazey";
 * 
 * getLCP().then(
 *  res => {
 *    console.log(`LCP: ${res}`);
 *  }
 * );
 * ```
 *
 * Output:
 *
 * ```text
 * LCP: 123
 * ```
 *
 * @returns A promise that resolves with the LCP time in milliseconds, or 0 if the "largest-contentful-paint" entry type is not supported.
 * @category Perf
 */
export async function getLCP(): Promise<number> {
  if (!isSupportedEntryType("largest-contentful-paint")) {
    return 0;
  }
  return new Promise(resolve => {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lcpIns = entries.find(entry => entry.entryType === "largest-contentful-paint");
      if (lcpIns) {
        observer.disconnect();
        resolve(Math.round(lcpIns.startTime));
      }
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
  });
}

/**
 * Gets the first input delay (FID) of a web page using the Performance API.
 * The FID is the time it takes for the first user input to be processed by the browser.
 *
 * Usage:
 *
 * ```javascript
 * import { getFID } from "mazey";
 * 
 * getFID().then(
 *  res => {
 *    console.log(`FID: ${res}`);
 *  }
 * );
 * ```
 *
 * Output:
 *
 * ```text
 * FID: 123
 * ```
 *
 * @returns A promise that resolves with the FID in milliseconds, or 0 if the "first-input" entry type is not supported.
 * @category Perf
 */
export async function getFID(): Promise<number> {
  if (!isSupportedEntryType("first-input")) {
    return 0;
  }
  return new Promise(resolve => {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const fidIns = entries.find(entry => entry.entryType === "first-input");
      if (fidIns) {
        observer.disconnect();
        const ps = fidIns.processingStart;
        if (ps) {
          resolve(Math.round(fidIns.processingStart - fidIns.startTime));
        } else {
          resolve(0);
        }
      }
    });
    observer.observe({ type: "first-input", buffered: true });
  });
}

/**
 * Gets the Cumulative Layout Shift (CLS) score of a web page using the Performance API.
 * The CLS score is a measure of how much the page layout shifts during loading.
 *
 * Usage:
 *
 * ```javascript
 * import { getCLS } from "mazey";
 * 
 * getCLS().then(
 *  res => {
 *    console.log(`CLS: ${res}`);
 *  }
 * );
 * ```
 *
 * Output:
 *
 * ```text
 * CLS: 123
 * ```
 *
 * @returns A promise that resolves with the CLS score, or 0 if the "layout-shift" entry type is not supported.
 * @category Perf
 */
export async function getCLS(): Promise<number> {
  if (!isSupportedEntryType("layout-shift")) {
    return 0;
  }
  return new Promise(resolve => {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const clsScore = entries.reduce((score, entry) => {
        let ev = 0;
        if (isNumber(entry.value)) {
          ev = entry.value as number;
        }
        return score + ev;
      }, 0);
      observer.disconnect();
      resolve(clsScore);
    });
    observer.observe({ type: "layout-shift", buffered: true });
  });
}

/**
 * Gets the time to first byte (TTFB) of a web page using the Performance API.
 * The TTFB is the time it takes for the first byte of the response to be received by the browser.
 *
 * Usage:
 *
 * ```javascript
 * import { getTTFB } from "mazey";
 * 
 * getTTFB().then(
 *  res => {
 *    console.log(`TTFB: ${res}`);
 *  }
 * );
 * ```
 *
 * Output:
 *
 * ```text
 * TTFB: 123
 * ```
 *
 * @returns The TTFB in milliseconds, or 0 if the navigation timing information is not available.
 * @category Perf
 */
export async function getTTFB(): Promise<number> {
  if (!isSupportedEntryType("navigation")) {
    return 0;
  }
  if (!window.performance || !window.performance.getEntriesByType) {
    return 0;
  }
  const navigationTiming = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
  let ttfb = 0;
  if (!navigationTiming) {
    return 0;
  }
  ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
  return Math.round(ttfb);
}

/**
 * EN: Get page load time(`PerformanceNavigationTiming`).
 *
 * ZH: 获取页面加载相关的各项数据。
 *
 * @remarks
 * This function uses the [`PerformanceNavigationTiming`](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming) API to get page load time data.
 * The `PerformanceNavigationTiming` API provides more accurate and detailed information about page load time than the deprecated [`PerformanceTiming`](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming) API.
 * If you are using an older browser that does not support `PerformanceNavigationTiming`, you can still use the `PerformanceTiming` API by using the previous version of this library ([`v3.9.7`](https://github.com/chengchuu/mazey/releases/tag/v3.9.7)).
 *
 * Usage:
 *
 * ```javascript
 * import { getPerformance } from "mazey";
 * 
 * // `camelCase：false` (Default) Return underline(`a_b`) data.
 * // `camelCase：true` Return hump(`aB`) data.
 * getPerformance()
 *  .then(res => {
 *   console.log(JSON.stringify(res));
 *  })
 *  .catch(console.error);
 * ```
 *
 * Output:
 *
 * ```text
 * {"source":"PerformanceNavigationTiming","os":"others","os_version":"","device_type":"pc","network":"4g","screen_direction":"","unload_time":0,"redirect_time":0,"dns_time":0,"tcp_time":0,"ssl_time":0,"response_time":2,"download_time":2,"first_paint_time":288,"first_contentful_paint_time":288,"dom_ready_time":0,"onload_time":0,"white_time":0,"render_time":0,"decoded_body_size":718,"encoded_body_size":718}
 * ```
 *
 * Results:
 *
 * | Attribute | Description | Type | Values |
 * | :------------ | :------------ | :------------ | :------------ |
 * | dns_time | DNS Lookup | number | domainLookupEnd - domainLookupStart |
 * | tcp_time | Connection Negotiation | number | connectEnd - connectStart |
 * | response_time | Requests and Responses | number | responseStart - requestStart |
 * | white_time | White Screen | number | responseStart - navigationStart |
 * | dom_ready_time | Dom Ready | number | domContentLoadedEventStart - navigationStart |
 * | onload_time | Onload | number | loadEventStart - navigationStart |
 * | render_time | EventEnd | number | loadEventEnd -navigationStart |
 * | unload_time | Unload | number | (Optional) unloadEventEnd - unloadEventStart |
 * | redirect_time | Redirect | number | (Optional) redirectEnd - redirectStart |
 * | ssl_time | SSL | number | (Optional) connectEnd - secureConnectionStart |
 * | download_time | Download | number | (Optional) responseEnd - responseStart |
 *
 * @param {boolean} camelCase -- false（默认） 以下划线形式返回数据 true 以驼峰形式返回数据
 * @returns {Promise<object>} 加载数据
 * @category Perf
 */
export async function getPerformance(camelCase = false): Promise<WebPerformance | Error> {
  if (!isSupportedEntryType("navigation")) {
    return Promise.reject(new Error("navigation is not supported"));
  }
  const performance = window.performance;
  if (!(performance && typeof performance.getEntries === "function" && typeof performance.getEntriesByType === "function")) {
    return Promise.reject(new Error("performance is not supported"));
  }
  let success: (v: WebPerformance) => void;
  const status: Promise<WebPerformance> = new Promise(resolve => {
    [ success ] = [ resolve ];
  });
  let navigationTiming: PerformanceNavigationTiming | null = null;
  const navs = performance.getEntriesByType("navigation");
  if (isNonEmptyArray(navs)) {
    navigationTiming = navs[0] as PerformanceNavigationTiming;
  }
  let [
    unloadEventEnd,
    unloadEventStart,
    redirectEnd,
    redirectStart,
    domainLookupEnd,
    domainLookupStart,
    connectEnd,
    connectStart,
    secureConnectionStart,
    responseStart,
    requestStart,
    responseEnd,
    domContentLoadedEventStart,
    loadEventStart,
    loadEventEnd,
    navigationStart,
    fetchStart,
    decodedBodySize,
    encodedBodySize,
  ] = new Array(19).fill(0);
  const timing = performance.timing;
  let source = "";
  if (navigationTiming) {
    source = "PerformanceNavigationTiming";
    ({ decodedBodySize, encodedBodySize } = navigationTiming);
    ({
      unloadEventEnd,
      unloadEventStart,
      redirectEnd,
      redirectStart,
      domainLookupEnd,
      domainLookupStart,
      connectEnd,
      connectStart,
      secureConnectionStart,
      responseStart,
      requestStart,
      responseEnd,
      domContentLoadedEventStart,
      loadEventStart,
      loadEventEnd,
      startTime: navigationStart,
      fetchStart,
    } = navigationTiming);
  } else if (timing) {
    source = "PerformanceTiming";
    ({
      unloadEventEnd,
      unloadEventStart,
      redirectEnd,
      redirectStart,
      domainLookupEnd,
      domainLookupStart,
      connectEnd,
      connectStart,
      secureConnectionStart,
      responseStart,
      requestStart,
      responseEnd,
      domContentLoadedEventStart,
      loadEventStart,
      loadEventEnd,
      navigationStart,
      fetchStart,
    } = timing);
  } else {
    return Promise.reject(new Error("NavigationTiming and Timing are not supported"));
  }
  let startTime = 0;
  if (isNumber(navigationStart)) {
    startTime = navigationStart;
  } else if (isNumber(fetchStart)) {
    startTime = fetchStart;
  } else {
    return Promise.reject(new Error("startTime, navigationStart or fetchStart are required"));
  }
  const [ firstPaintTime, firstContentfulPaintTime ] = await Promise.all([ getFP(), getFCP() ]);
  // Whether the data has been formed (after the page has finished loading).
  if (isNumber(loadEventEnd) && loadEventEnd > 0) {
    getTiming();
  } else {
    window.addEventListener("load", function() {
      // Cannot affect the final time calculation.
      window.setTimeout(function() {
        getTiming();
      }, 0);
    });
  }
  function getTiming() {
    // Get the loading time.
    const data: WebPerformance = {
      // url: encodeURI(location.href),
      // ua: navigator.userAgent,
      source,
      os: getOS(),
      osVersion: getOSVersion(),
      deviceType: getDeviceType(),
      network: getNetWork(),
      screenDirection: getOrientationStatu(),
      unloadTime: unloadEventEnd - unloadEventStart, // 上个文档的卸载时间
      redirectTime: redirectEnd - redirectStart, // * 重定向时间
      dnsTime: domainLookupEnd - domainLookupStart, // * DNS 查询时间
      tcpTime: connectEnd - connectStart, // * 服务器连接时间
      sslTime: getSSLTime(connectEnd, secureConnectionStart), // * SSL 连接时间
      responseTime: responseStart - requestStart, // * 服务器响应时间
      downloadTime: responseEnd - responseStart, // * 网页下载时间
      firstPaintTime: firstPaintTime, // * 首次渲染时间
      firstContentfulPaintTime: firstContentfulPaintTime, // * 首次渲染内容时间
      domReadyTime: domContentLoadedEventStart - startTime, // * DOM Ready 时间（总和）
      onloadTime: loadEventStart - startTime, // * onload 时间（总和）
      whiteTime: responseStart - startTime, // * 白屏时间
      renderTime: loadEventEnd - startTime, // 整个过程的时间之和
      decodedBodySize: decodedBodySize, // 页面压缩前大小
      encodedBodySize: encodedBodySize, // 页面压缩后大小
    };
    // Filter abnormal data.
    Object.keys(data).forEach(k => {
      // Filter out data less than 0.
      if (isNumber(data[k])) {
        if ((data[k] as number) < 0) {
          data[k] = 0;
        } else {
          data[k] = Math.round(data[k] as number);
        }
      }
    });
    // Filter out data where the blank screen time is greater than the onload time.
    if (isNumber(data.whiteTime) && data.whiteTime > data.onloadTime) {
      data.whiteTime = 0;
    }
    const Underscore: WebPerformance = {};
    if (!camelCase) {
      Object.keys(data).forEach(k => {
        Underscore[camelCase2Underscore(k)] = data[k];
      });
    }
    if (Object.keys(Underscore).length) {
      success(Underscore);
    } else {
      success(data);
    }
  }
  // Get the current operating system.
  function getOS() {
    let os;
    if (navigator.userAgent.indexOf("Android") > -1 || navigator.userAgent.indexOf("Linux") > -1) {
      os = "android";
    } else if (navigator.userAgent.indexOf("iPhone") > -1) {
      os = "ios";
    } else if (navigator.userAgent.indexOf("Windows Phone") > -1) {
      os = "wp";
    } else {
      os = "others";
    }
    return os;
  }
  // Get the operating system version.
  function getOSVersion() {
    let OSVision: string | undefined = "";
    const u = navigator.userAgent;
    const isAndroid = u.indexOf("Android") > -1 || u.indexOf("Linux") > -1; // Android
    const isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); // iOS 终端
    const uas = navigator.userAgent.split(";");
    if (uas.length < 2) return OSVision;
    const validUaStr = uas[1];
    if (!validUaStr) return OSVision;
    if (isAndroid) {
      OSVision = (validUaStr.match(/\d+\.\d+/g) || [])[0];
    }
    if (isIOS) {
      OSVision = (validUaStr.match(/(\d+)_(\d+)_?(\d+)?/) || [])[0];
    }
    if (!OSVision) OSVision = "";
    return OSVision;
  }
  // Get the device type.
  function getDeviceType() {
    let deviceType;
    const sUserAgent = navigator.userAgent.toLowerCase();
    const bIsIpad = sUserAgent.match(/(ipad)/i) && "ipad";
    const bIsIphoneOs = sUserAgent.match(/iphone os/i) && "iphone os";
    const bIsMidp = sUserAgent.match(/midp/i) && "midp";
    const bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) && "rv:1.2.3.4";
    const bIsUc = sUserAgent.match(/ucweb/i) && "ucweb";
    const bIsAndroid = sUserAgent.match(/android/i) && "android";
    const bIsCE = sUserAgent.match(/windows ce/i) && "windows ce";
    const bIsWM = sUserAgent.match(/windows mobile/i) && "windows mobile";
    if (!(bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM)) {
      deviceType = "pc"; // pc
    } else if (bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
      deviceType = "phone"; // phone
    } else if (bIsIpad) {
      deviceType = "ipad"; // ipad
    } else {
      deviceType = undefined;
    }
    if (!deviceType) deviceType = "";
    return deviceType;
  }
  // Get the network status.
  function getNetWork() {
    let netWork: string | undefined = "";
    const nav = window.navigator;
    if (nav.connection && nav.connection.effectiveType) {
      switch (nav.connection.effectiveType) {
        case "wifi":
          netWork = "wifi"; // wifi
          break;
        case "4g":
          netWork = "4g"; // 4g
          break;
        case "2g":
          netWork = "2g"; // 2g
          break;
        case "3g":
          netWork = "3g"; // 3g
          break;
        case "ethernet":
          netWork = "ethernet"; // ethernet
          break;
        case "default":
          netWork = undefined; // 未知
          break;
      }
    }
    if (!netWork) netWork = "";
    return netWork;
  }
  // Get the screen orientation status.
  function getOrientationStatu() {
    let orientationStatu = "";
    if (window.screen && window.screen.orientation && window.screen.orientation.angle) {
      if (window.screen.orientation.angle === 180 || window.screen.orientation.angle === 0) {
        // 竖屏
        orientationStatu = "|";
      }
      if (window.screen.orientation.angle === 90 || window.screen.orientation.angle === -90) {
        // 横屏
        orientationStatu = "-";
      }
    }
    return orientationStatu;
  }
  // Get the SSL connection time.
  function getSSLTime(connectEnd: number, secureConnectionStart: number) {
    let ssl_time = 0;
    if (secureConnectionStart) {
      ssl_time = connectEnd - secureConnectionStart;
    }
    return ssl_time;
  }
  return status;
}
