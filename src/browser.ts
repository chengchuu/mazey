import { mazeyCon } from "./debug";
import type {
  BrowserInfo, MazeyObject, TestUa, TestVs, 
} from "./typing";
import { isNonEmptyArray } from "./util";

let pwaSupport = "";

/**
 * EN: Detect the margin of Safety. Determine if it is a secure PWA environment that it can run.
 *
 * ZH: 判断是否是安全的 PWA 环境。
 *
 * Usage:
 *
 * ```javascript
 * import { isSafePWAEnv } from "mazey";
 * 
 * const ret = isSafePWAEnv();
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @environment Browser
 * @returns {boolean} true 是
 * @category Browser Information
 */
export function isSafePWAEnv(): boolean {
  if (pwaSupport) {
    return pwaSupport === "pwa";
  }
  // 判断是否支持 async await
  function isSupportAsyncAwait() {
    let isSupportAsyncAwaitFunc;
    try {
      const fn = new Function("return async function(){};");
      isSupportAsyncAwaitFunc = fn();
      // 由于 async 函数的构造器不是全局对象，所以我们需要由下面代码来获取 async 函数的构造器
      // 具体可以查看以下 MDN 上有关于 AsyncFunction 的说明
      // 地址：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
      return Object.getPrototypeOf(isSupportAsyncAwaitFunc).constructor != null;
    } catch (e) {
      return false;
    }
  }
  // 判断是否支持 Promise
  function isSupportPromise() {
    if (typeof Promise !== "undefined" && Promise.toString().indexOf("[native code]") !== -1) {
      return true;
    }
    return false;
  }
  // HTTPS
  function isHttps() {
    return window.location.protocol === "https:";
  }
  // 浏览器信息
  const BrowserType = getBrowserInfo();
  if (
    "serviceWorker" in navigator &&
    isSupportAsyncAwait() &&
    isSupportPromise() &&
    Boolean(window.fetch) && Boolean(window.indexedDB) && Boolean(window.caches) &&
    !BrowserType["shell"] &&
    isHttps()
  ) {
    pwaSupport = "pwa";
    return true;
  }
  pwaSupport = "no-pwa";
  return false;
}

/**
 * EN: Provides detailed information about the browser.
 *
 * ZH: 返回有关浏览器的详细信息。
 *
 * Usage:
 *
 * ```javascript
 * import { getBrowserInfo } from "mazey";
 * 
 * const ret = getBrowserInfo();
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * {"engine":"webkit","engineVs":"537.36","platform":"desktop","supporter":"chrome","supporterVs":"85.0.4183.121","system":"windows","systemVs":"10"}
 * ```
 *
 * Results:
 *
 * | Attribute | Description | Type | Values |
 * | :------------ | :------------ | :------------ | :------------ |
 * | **system** | System | string | android, ios, windows, macos, linux |
 * | systemVs | System version | string | Windows: 2000, xp, 2003, vista, 7, 8, 8.1, 10 macOS: ... |
 * | platform | Platform | string | desktop, mobile |
 * | engine | Engine | string | webkit, gecko, presto, trident |
 * | engineVs | Engine version | string | - |
 * | supporter | Supporter | string | edge, opera, chrome, safari, firefox, iexplore |
 * | supporterVs | Supporter version | string | - |
 * | shell | Shell | string | (Optional) wechat, qq_browser, qq_app, uc, 360, 2345, sougou, liebao, maxthon, bilibili |
 * | shellVs | Shell version | string | (Optional) 20/... |
 * | appleType | Apple device type | string | (Optional) ipad, iphone, ipod, iwatch |
 *
 * Example: Determine the environment of the mobile QQ.
 *
 * ```javascript
 * const { system, shell } = getBrowserInfo();
 * const isMobileQQ = ["android", "ios"].includes(system) && ["qq_browser", "qq_app"].includes(shell);
 * ```
 *
 * @environment Browser
 * @returns Browser information
 * @category Browser Information
 */
export function getBrowserInfo(): BrowserInfo {
  // Cache
  if (window.MAZEY_BROWSER_INFO && typeof window.MAZEY_BROWSER_INFO === "object") {
    // mazeyCon.log("getBrowserInfo cache");
    return window.MAZEY_BROWSER_INFO;
  }
  let browserInfo: BrowserInfo = {
    engine: "", // webkit gecko presto trident
    engineVs: "",
    platform: "", // desktop mobile
    supporter: "", // chrome safari firefox opera iexplore edge
    supporterVs: "",
    system: "", // windows macos linux android ios
    systemVs: "",
    shell: "",
    shellVs: "",
    appleType: "",
  };
  try {
    // 权重：系统 + 系统版本 > 平台 > 内核 + 载体 + 内核版本 + 载体版本 > 外壳 + 外壳版本
    const ua: string = navigator.userAgent.toLowerCase();
    if (!ua) {
      return browserInfo;
    }
    const testUa: TestUa = regexp => regexp.test(ua);
    const testVs: TestVs = regexp => {
      let ret = "";
      const matchRes = ua.match(regexp); // ["os 13_2_3"]
      // Confirm the Safety of the match result
      if (matchRes && isNonEmptyArray(matchRes)) {
        ret = matchRes.toString();
        ret = ret.replace(/[^0-9|_.]/g, ""); // 1323
        ret = ret.replace(/_/g, "."); // 13.2.3
      }
      return ret;
    };
    // System
    let system = "";
    // Apple Device Type
    let appleType = "";
    if (testUa(/windows|win32|win64|wow32|wow64/g)) {
      system = "windows"; // windows 系统
    } else if (testUa(/macintosh|macintel/g)) {
      system = "macos"; // macos 系统
    } else if (testUa(/x11/g)) {
      system = "linux"; // linux 系统
    } else if (testUa(/android|adr/g)) {
      system = "android"; // android 系统
    } else if (testUa(/ios|iphone|ipad|ipod|iwatch/g)) {
      system = "ios"; // ios 系统
      if (testUa(/ipad/g)) {
        appleType = "ipad";
      } else if (testUa(/iphone/g)) {
        appleType = "iphone";
      } else if (testUa(/iwatch/g)) {
        appleType = "iwatch";
      } else if (testUa(/ipod/g)) {
        appleType = "ipod";
      }
    }
    browserInfo = {
      ...browserInfo,
      system,
      appleType,
    };
    // System Version
    let systemVs = "";
    if (system === "windows") {
      if (testUa(/windows nt 5.0|windows 2000/g)) {
        systemVs = "2000";
      } else if (testUa(/windows nt 5.1|windows xp/g)) {
        systemVs = "xp";
      } else if (testUa(/windows nt 5.2|windows 2003/g)) {
        systemVs = "2003";
      } else if (testUa(/windows nt 6.0|windows vista/g)) {
        systemVs = "vista";
      } else if (testUa(/windows nt 6.1|windows 7/g)) {
        systemVs = "7";
      } else if (testUa(/windows nt 6.2|windows 8/g)) {
        systemVs = "8";
      } else if (testUa(/windows nt 6.3|windows 8.1/g)) {
        systemVs = "8.1";
      } else if (testUa(/windows nt 10.0|windows 10/g)) {
        systemVs = "10";
      }
    } else if (system === "macos") {
      systemVs = testVs(/os x [\d._]+/g);
    } else if (system === "android") {
      systemVs = testVs(/android [\d._]+/g); // 8.0
    } else if (system === "ios") {
      systemVs = testVs(/os [\d._]+/g); // 13.2.3 13.3
    }
    browserInfo = {
      ...browserInfo,
      systemVs,
    };
    // Platform
    let platform = "";
    if (system === "windows" || system === "macos" || system === "linux") {
      platform = "desktop"; // 桌面端
    } else if (system === "android" || system === "ios" || testUa(/mobile/g)) {
      platform = "mobile"; // 移动端
    }
    browserInfo = {
      ...browserInfo,
      platform,
    };
    // Engine and Shell
    let engine = "";
    let supporter = "";
    if (testUa(/applewebkit/g)) {
      engine = "webkit"; // webkit 内核
      if (testUa(/edge/g)) {
        supporter = "edge"; // edge 浏览器
      } else if (testUa(/opr/g)) {
        supporter = "opera"; // opera 浏览器
      } else if (testUa(/chrome/g)) {
        supporter = "chrome"; // chrome 浏览器
      } else if (testUa(/safari/g)) {
        supporter = "safari"; // safari 浏览器
      }
    } else if (testUa(/gecko/g) && testUa(/firefox/g)) {
      engine = "gecko"; // gecko 内核
      supporter = "firefox"; // firefox 浏览器
    } else if (testUa(/presto/g)) {
      engine = "presto"; // presto 内核
      supporter = "opera"; // opera 浏览器
    } else if (testUa(/trident|compatible|msie/g)) {
      engine = "trident"; // trident 内核
      supporter = "iexplore"; // iexplore 浏览器
    }
    browserInfo = {
      ...browserInfo,
      engine,
      supporter,
    };
    // Engine Version
    let engineVs = "";
    if (engine === "webkit") {
      engineVs = testVs(/applewebkit\/[\d._]+/g);
    } else if (engine === "gecko") {
      engineVs = testVs(/gecko\/[\d._]+/g);
    } else if (engine === "presto") {
      engineVs = testVs(/presto\/[\d._]+/g);
    } else if (engine === "trident") {
      engineVs = testVs(/trident\/[\d._]+/g);
    }
    browserInfo = {
      ...browserInfo,
      engineVs,
    };
    // Supporter Version
    let supporterVs = "";
    if (supporter === "chrome") {
      supporterVs = testVs(/chrome\/[\d._]+/g);
    } else if (supporter === "safari") {
      supporterVs = testVs(/version\/[\d._]+/g);
    } else if (supporter === "firefox") {
      supporterVs = testVs(/firefox\/[\d._]+/g);
    } else if (supporter === "opera") {
      supporterVs = testVs(/opr\/[\d._]+/g);
    } else if (supporter === "iexplore") {
      supporterVs = testVs(/(msie [\d._]+)|(rv:[\d._]+)/g);
    } else if (supporter === "edge") {
      supporterVs = testVs(/edge\/[\d._]+/g);
    }
    browserInfo = {
      ...browserInfo,
      supporterVs,
    };
    // Shell Name and Shell Version
    let shell = "";
    let shellVs = "";
    if (testUa(/micromessenger/g)) {
      shell = "wechat"; // 微信浏览器
      shellVs = testVs(/micromessenger\/[\d._]+/g);
    } else if (testUa(/qqbrowser/g)) {
      shell = "qq_browser"; // QQ Browser
      shellVs = testVs(/qqbrowser\/[\d._]+/g);
    } else if (testUa(/\sqq/g)) {
      shell = "qq_app"; // QQ APP
    } else if (testUa(/ucbrowser/g)) {
      shell = "uc"; // UC 浏览器
      shellVs = testVs(/ucbrowser\/[\d._]+/g);
    } else if (testUa(/qihu 360se/g)) {
      shell = "360"; // 360 浏览器(无版本)
    } else if (testUa(/2345explorer/g)) {
      shell = "2345"; // 2345 浏览器
      shellVs = testVs(/2345explorer\/[\d._]+/g);
    } else if (testUa(/metasr/g)) {
      shell = "sougou"; // 搜狗浏览器(无版本)
    } else if (testUa(/lbbrowser/g)) {
      shell = "liebao"; // 猎豹浏览器(无版本)
    } else if (testUa(/maxthon/g)) {
      shell = "maxthon"; // 遨游浏览器
      shellVs = testVs(/maxthon\/[\d._]+/g);
    } else if (testUa(/biliapp/g)) {
      shell = "bilibili"; // 哔哩哔哩
    }
    browserInfo = {
      ...browserInfo,
      shell,
      shellVs,
    };
    window.MAZEY_BROWSER_INFO = browserInfo;
    return browserInfo;
  } catch (err) {
    mazeyCon.warn(err);
    return browserInfo;
  }
}

/**
 * EN: Generate browser attributes.
 * 
 * ZH: 生成浏览器属性。
 * 
 * Usage:
 * 
 * ```javascript
 * import { genBrowserAttrs } from "mazey";
 * 
 * const attrs = genBrowserAttrs();
 * console.log(attrs);
 * ```
 * 
 * Output:
 * 
 * ```text
 * ["windows", "desktop", "webkit", "chrome"]
 * ```
 * 
 * @environment Browser
 * @param {string} prefix
 * @returns {array} Browser attributes
 * @category Browser Information
 */
export function genBrowserAttrs(prefix = "", separator = "-"): string[] {
  const keys = [ "system", "platform", "engine", "supporter", "shell", "appleType" ];
  const info = getBrowserInfo() as MazeyObject;
  const attrs: string[] = [];
  keys.forEach((key: string) => {
    const val = info[key];
    if (val) {
      let rPre = "";
      if (prefix && prefix.length > 0) {
        rPre = `${prefix}${separator}`;
      }
      attrs.push(`${rPre}${val}`);
    }
  });
  return attrs;
}

let webpSupport = "";

/**
 * Detect webp support.
 *
 * Usage:
 *
 * ```javascript
 * import { isSupportWebp } from "mazey";
 * 
 * isSupportWebp().then(res => {
 *  console.log("isSupportWebp:", res);
 * });
 * ```
 *
 * Output:
 *
 * ```text
 * isSupportWebp: true
 * ```
 *
 * Reference: [Detect WEBP Support with JavaScript](https://davidwalsh.name/detect-webp)
 *
 * @category Browser Information
 */
export function isSupportWebp(): Promise<boolean> {
  if (webpSupport) {
    // mazeyCon.log("isSupportWebp cache");
    return Promise.resolve(webpSupport === "webp");
  }
  const fn = (resolve: (v: boolean) => void) => {
    const img = new Image();
    img.onload = () => {
      const ret = img.width > 0 && img.height > 0;
      webpSupport = ret ? "webp" : "no-webp";
      resolve(ret);
    };
    img.onerror = () => {
      webpSupport = "no-webp";
      resolve(false);
    };
    img.src = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
  };
  return new Promise(fn);
}
