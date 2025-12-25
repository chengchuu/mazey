import type {
  MazeyFnParams, MazeyFnReturn, LoadScriptReturns, MazeyWindow, 
} from "./typing";
import { doFn } from "./util";
import { isValidHttpUrl } from "./url";

/**
 * EN: Load a CSS file from the server.
 *
 * ZH: 动态加载 CSS 文件。
 *
 * Usage:
 *
 * ```javascript
 * import { loadCSS } from "mazey";
 * 
 * loadCSS(
 *     "http://example.com/path/example.css",
 *     {
 *       id: "iamid", // Optional, link ID, default none
 *     }
 *   )
 *   .then(
 *     res => {
 *       console.log(`Load CSS Success: ${res}`);
 *     }
 *   )
 *   .catch(
 *     err => {
 *       console.error(`Load CSS Fail: ${err.message}`)
 *     }
 *   );
 * ```
 *
 * Output:
 *
 * ```text
 * Load CSS Success: loaded
 * ```
 *
 * @param {string} url -- css资源路径
 * @param {string} options.id -- link标签id
 * @returns {Promise<string>} true -- 加载成功
 * @category Load
 */
export function loadCSS(url: string, options: { id?: string } = { id: "" }): Promise<unknown> {
  const { id } = options;
  let success: (v: boolean | string) => void;
  let fail: (v: Error) => void = () => undefined;
  const status = new Promise((resolve, reject) => {
    [ success, fail ] = [ resolve, reject ];
  });
  const callback = function() {
    success("loaded");
  };
  let node: HTMLLinkElement | null = document.createElement("link");
  if (!node) {
    fail(new Error("Not support create link element"));
  }
  const supportOnload = "onload" in node;
  const isOldWebKit = +navigator.userAgent.replace(/.*(?:AppleWebKit|AndroidWebKit)\/?(\d+).*/i, "$1") < 536; // webkit 旧内核做特殊处理
  const protectNum = 300000; // 阈值 10 分钟，一秒钟执行 pollCss 500 次
  node.rel = "stylesheet";
  node.type = "text/css";
  node.href = url;
  if (typeof id !== "undefined") {
    node.id = id;
  }
  document.getElementsByTagName("head")[0].appendChild(node);
  // for Old WebKit and Old Firefox
  if (isOldWebKit || !supportOnload) {
    // Begin after node insertion
    setTimeout(function() {
      pollCss(node, callback, 0);
    }, 1);
    return status;
  }
  if (supportOnload) {
    node.onload = onload;
    node.onerror = function() {
      // 加载失败(404)
      onload();
    };
  } else {
    // todo: 和 !supportOnload 重复
    node.onreadystatechange = function() {
      if (node && /loaded|complete/.test(node.readyState)) {
        onload();
      }
    };
  }
  function onload() {
    // 确保只跑一次下载操作
    if (node) node.onload = node.onerror = node.onreadystatechange = null;
    // 清空 node 引用，在低版本 IE，不清除会造成内存泄露
    node = null;
    callback();
  }
  // 循环判断 CSS 是否已加载成功
  /*
   * @param node -- link节点
   * @param callback -- 回调函数
   * @param step -- 计步器，避免无限循环
   */
  function pollCss(node: HTMLLinkElement | null, callback: () => void, step: number) {
    if (!node) return;
    const sheet = node.sheet;
    let isLoaded: boolean;
    step += 1;
    // 保护，大于 10 分钟，则不再轮询
    if (step > protectNum) {
      isLoaded = true;
      // 清空 node 引用
      if (node) node = null;
      callback();
      return;
    }
    if (isOldWebKit) {
      // for WebKit < 536
      if (sheet) {
        isLoaded = true;
      }
    } else if (sheet) {
      // for Firefox < 9.0
      try {
        if (sheet.cssRules) {
          isLoaded = true;
        }
      } catch (ex) {
        const err = ex as ErrorEvent;
        if (!err.name) return;
        // 火狐特殊版本，通过特定值获知是否下载成功
        // The value of `ex.name` is changed from "NS_ERROR_DOM_SECURITY_ERR"
        // to "SecurityError" since Firefox 13.0. But Firefox is less than 9.0
        // in here, So it is ok to just rely on "NS_ERROR_DOM_SECURITY_ERR"
        if (err.name === "NS_ERROR_DOM_SECURITY_ERR") {
          isLoaded = true;
        }
      }
    }
    setTimeout(function() {
      if (isLoaded) {
        // 延迟 20ms 是为了给下载的样式留够渲染的时间
        callback();
      } else {
        pollCss(node, callback, step);
      }
    }, 20);
  }
  return status;
}

const defaultLoadScriptOptions = {
  id: "",
  callback: function() {
    /* pass */
  },
  timeout: 5000,
  isDefer: false,
  isAsync: false,
  isCrossOrigin: false,
  attributes: null,
  cssURL: "",
};

/**
 * Resolve a CSS URL relative to a JS URL's directory
 * 
 * @param jsURL - The JavaScript URL
 * @param cssPath - The CSS path (filename or relative path)
 * @returns The resolved CSS URL
 */
function resolveCSSURL(jsURL: string, cssPath: string): string {
  if (!cssPath) return "";
  if (isValidHttpUrl(cssPath)) return cssPath;
  // Get the directory of the JS URL
  const jsUrlParts = jsURL.split('/');
  jsUrlParts.pop(); // Remove filename
  const jsDirectory = jsUrlParts.join('/');
  // Combine with CSS path
  return `${jsDirectory}/${cssPath}`;
}

/**
 * EN: Load a JavaScript file from the server and execute it.
 *
 * ZH: 动态加载 JavaScript 文件。
 *
 * Usage:
 *
 * ```javascript
 * import { loadScript } from "mazey";
 * 
 * loadScript(
 *     "http://example.com/static/js/plugin-2.1.1.min.js",
 *     {
 *       id: "iamid", // (Optional) script ID, default none
 *       timeout: 5000, // (Optional) timeout, default `5000`
 *     }
 *   )
 *   .then(
 *     res => {
 *       console.log(`Load JavaScript script: ${res}`);
 *     }
 *   )
 *   .catch(
 *     err => {
 *       console.error(`Load JavaScript script: ${err.message}`);
 *     }
 *   );
 * ```
 *
 * Output:
 *
 * ```text
 * Load JavaScript script: loaded
 * ```
 *
 * @param {string} url -- JavaScript 资源路径
 * @param {string} options.id -- DOM ID
 * @param {function} options.callback -- 加载后回调函数
 * @param {number} options.timeout -- 超时时长
 * @param {boolean} options.isDefer -- 是否添加 defer 标签
 * @param {boolean} options.isAsync -- 是否添加 async 标签
 * @param {boolean} options.isCrossOrigin -- 是否跨域
 * @param {object} options.attributes -- 其他属性
 * @param {string} options.cssURL -- CSS 资源路径
 * @returns {Promise<string>} -- true 成功
 * @category Load
 */
export function loadScript(
  url: string,
  options: {
    id?: string;
    callback?: (...params: MazeyFnParams) => MazeyFnReturn;
    timeout?: number;
    isDefer?: boolean;
    isAsync?: boolean;
    isCrossOrigin?: boolean;
    attributes?: Record<string, string> | null;
    cssURL?: string;
  } = {
    ...defaultLoadScriptOptions,
  }
): LoadScriptReturns {
  const { id, callback, timeout, isDefer, isAsync, isCrossOrigin, attributes, cssURL } = Object.assign(
    {
      ...defaultLoadScriptOptions,
    },
    options
  );
  let success: (v: string) => void;
  let fail: (v: string) => void;
  const script: HTMLScriptElement = document.createElement("script");
  if (!script) {
    Promise.reject("Not support create script element");
  }
  // 如果提供了 cssURL，则先加载 CSS 文件
  if (cssURL) {
    const resolvedCSSURL = resolveCSSURL(url, cssURL);
    if (resolvedCSSURL) loadCSS(resolvedCSSURL).catch(err => {
      console.error(`Failed to load CSS from ${resolvedCSSURL}: ${err.message}`);
    });
  }
  // 如果没有 script 标签，那么代码就不会运行。可以利用这一事实，在页面的第一个 script 标签上使用 insertBefore()。
  const firstScript: HTMLScriptElement = document.getElementsByTagName("script")[0];
  script.type = "text/javascript";
  if (isDefer) {
    script.defer = true; // "defer";
  }
  if (isAsync) {
    script.async = true; // "async";
  }
  if (isCrossOrigin) {
    script.crossOrigin = "anonymous";
  }
  if (id) {
    script.id = id;
  }
  if (attributes) {
    Object.keys(attributes).forEach(key => {
      script.setAttribute(key, attributes[key]);
    });
  }
  if (script.readyState) {
    // IE
    script.onreadystatechange = function() {
      if (script.readyState === "loaded" || script.readyState === "complete") {
        script.onreadystatechange = null;
        doFn(callback);
        doFn(success, "loaded");
      }
    };
  } else {
    // Others
    script.onload = function() {
      doFn(callback);
      doFn(success, "loaded");
    };
  }
  script.src = url;
  firstScript && firstScript.parentNode.insertBefore(script, firstScript);
  return new Promise((resolve, reject) => {
    [ success, fail ] = [ resolve, reject ];
    if (timeout) {
      setTimeout(fail.bind(null, "timeout"), timeout);
    }
  });
}

/**
 * EN: Check whether the page is loaded successfully (Keep the compatibility if the browser's `load` event has been triggered).
 *
 * ZH: 页面加载完成。
 *
 * Usage:
 *
 * ```javascript
 * import { windowLoaded } from "mazey";
 * 
 * windowLoaded()
 *   .then(res => {
 *     console.log(`Load Success: ${res}`);
 *   })
 *   .catch(err => {
 *     console.log(`Load Timeout or Fail: ${err.message}`);
 *   });
 * ```
 *
 * Output:
 *
 * ```text
 * Load Success: load
 * ```
 *
 * @param {number} timeout 超时时间 / 单位：毫秒，默认：30000(30 秒)
 * @returns {Promise<string>} document is loaded? "complete" "load" / "timeout"
 * @category Load
 */
export function windowLoaded(timeout = 30000): Promise<string | Error> {
  let loaded: (value: string) => void = () => undefined;
  let loadFail: (value: Error) => void;
  const status = new Promise((resolve: (value: string) => void, reject: (value: Error) => void) => {
    loaded = resolve;
    loadFail = reject;
  });
  if (document.readyState === "complete") {
    loaded("complete");
  } else {
    window.addEventListener("load", () => loaded("load"));
  }
  // 超过 timeout 秒后加载失败
  setTimeout(() => loadFail(Error("timeout")), timeout);
  return status;
}

/**
 * Load an image from the given URL.
 *
 * The target image will be loaded in the background, and the Promise status will change after the image is loaded. If the image fails to load, the Promise status will change to `reject` with the error object. If the image is loaded successfully, the Promise status will change to `resolve` with the image object. This method can be used to preload images and cache them in the browser. It can also be used to implement lazy loading of images.
 *
 * Note that this method will not add the image to the DOM.
 *
 * Usage:
 *
 * ```javascript
 * import { loadImage } from "mazey";
 * 
 * loadImage("https://example.com/example.png")
 *   .then((img) => {
 *     console.log(img);
 *   })
 *   .catch((err) => {
 *     console.log(err);
 *   });
 * ```
 *
 * @param {string} url - The URL of the image to load.
 * @returns {Promise} A Promise that resolves with the loaded image or rejects with an error.
 * @category Load
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = err => {
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Load a script from the given URL if it (`window["attribute"]`) has not already been loaded.
 *
 * Usage:
 *
 * ```javascript
 * import { loadScriptIfUndefined } from "mazey";
 * 
 * loadScriptIfUndefined("xyz", "https://example.com/lib/xyz.min.js")
 *   .then(() => {
 *     console.log("xyz is loaded.");
 *   })
 *   .catch(err => {
 *     console.log("Failed to load xyz.", err);
 *   });
 * ```
 *
 * Output:
 *
 * ```text
 * xyz is loaded.
 * ```
 *
 * @param {string} windowAttribute - The name of the window attribute to check (e.g. `jQuery`, `axios`, etc.).
 * @param {string} url - The URL of the script to load.
 * @returns {Promise} A Promise that resolves when the script has been loaded.
 * @category Load
 */
export function loadScriptIfUndefined(windowAttribute: string, url: string): LoadScriptReturns {
  if ((window as MazeyWindow)[windowAttribute]) {
    return Promise.resolve("defined");
  }
  return loadScript(url);
}
