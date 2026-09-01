import type {
  MazeyFnParams, MazeyFnReturn, LoadScriptReturns, MazeyWindow,
} from "./typing";
import { doFn } from "./util";
import { isValidHttpUrl } from "./url";

/**
 * Load a CSS file dynamically.
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
 * @param {string} url URL of the CSS resource.
 * @param {string} options.id Optional ID for the `<link>` element.
 * @returns {Promise<string>} A promise that resolves to `"loaded"` after the stylesheet loads.
 * @category Load
 */
export function loadCSS(url: string, options: { id?: string } = { id: "" }): Promise<string> {
  const { id } = options;
  let success: (v: string) => void;
  let fail: (v: Error) => void = () => undefined;
  const status = new Promise<string>((resolve, reject) => {
    [ success, fail ] = [ resolve, reject ];
  });
  const callback = function() {
    cleanup();
    success("loaded");
  };
  let node: HTMLLinkElement | null = document.createElement("link");
  if (!node) {
    fail(new Error("Not support create link element"));
  }
  const supportOnload = "onload" in node;
  const isOldWebKit = +navigator.userAgent.replace(/.*(?:AppleWebKit|AndroidWebKit)\/?(\d+).*/i, "$1") < 536; // Handle legacy WebKit separately.
  const protectNum = 300000; // Maximum poll count used to prevent infinite polling.
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
      cleanup();
      fail(new Error(`Failed to load CSS: ${url}`));
    };
  } else {
    // TODO: This duplicates the `!supportOnload` compatibility path above.
    node.onreadystatechange = function() {
      if (node && /loaded|complete/.test(node.readyState)) {
        onload();
      }
    };
  }
  function onload() {
    callback();
  }
  function cleanup() {
    // Ensure the load handlers run only once.
    if (node) node.onload = node.onerror = node.onreadystatechange = null;
    // Release the node reference to avoid memory leaks in older versions of IE.
    node = null;
  }
  // Poll until the stylesheet has loaded.
  /*
   * @param node The `<link>` element.
   * @param callback Callback invoked after loading completes.
   * @param step Poll count used to prevent an infinite loop.
   */
  function pollCss(node: HTMLLinkElement | null, callback: () => void, step: number) {
    if (!node) return;
    const sheet = node.sheet;
    let isLoaded: boolean;
    step += 1;
    // Stop polling after the safety threshold.
    if (step > protectNum) {
      isLoaded = true;
      // Release the local node reference.
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
        // Detect successful loading in legacy Firefox from its security error.
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
        // Allow 20 milliseconds for the downloaded styles to render.
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
  cssUrl: "",
};

/**
 * Resolve a CSS URL relative to a JS URL's directory
 *
 * @param jsUrl - The JavaScript URL
 * @param cssPath - The CSS path (filename or relative path)
 * @returns The resolved CSS URL
 */
function resolveCssUrl(jsUrl: string, cssPath: string): string {
  if (!cssPath) return "";
  if (isValidHttpUrl(cssPath)) return cssPath;
  try {
    const scriptUrl = new URL(jsUrl, location.href);
    return new URL(cssPath, scriptUrl).href;
  } catch (e) {
    const jsUrlParts = jsUrl.split("/");
    jsUrlParts.pop();
    return `${jsUrlParts.join("/")}/${cssPath}`;
  }
}

/**
 * Load and execute a JavaScript file dynamically.
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
 * @param {string} url URL of the JavaScript resource.
 * @param {string} options.id Optional ID for the `<script>` element.
 * @param {function} options.callback Callback invoked after the script loads.
 * @param {number} options.timeout Timeout in milliseconds.
 * @param {boolean} options.isDefer Whether to set the `defer` attribute.
 * @param {boolean} options.isAsync Whether to set the `async` attribute.
 * @param {boolean} options.isCrossOrigin Whether to request the script anonymously across origins.
 * @param {object} options.attributes Additional attributes for the `<script>` element.
 * @param {string} options.cssUrl Optional CSS resource to begin loading before the script is inserted.
 * @returns {Promise<string>} A promise that resolves to `"loaded"` after the script loads.
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
    cssUrl?: string;
  } = {
    ...defaultLoadScriptOptions,
  }
): LoadScriptReturns {
  const { id, callback, timeout, isDefer, isAsync, isCrossOrigin, attributes, cssUrl } = Object.assign(
    {
      ...defaultLoadScriptOptions,
    },
    options
  );
  // Begin loading the optional CSS resource before inserting the script.
  if (cssUrl) {
    const resolvedCssUrl = resolveCssUrl(url, cssUrl);
    if (resolvedCssUrl) loadCSS(resolvedCssUrl).catch(err => {
      console.error(`Failed to load CSS from ${resolvedCssUrl}: ${err?.message}`);
    });
  }
  return new Promise<string>((resolve, reject) => {
    const script: HTMLScriptElement = document.createElement("script");
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      script.onload = null;
      script.onerror = null;
      script.onreadystatechange = null;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const succeed = () => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        doFn(callback);
        resolve("loaded");
      } catch (err) {
        reject(err);
      }
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    script.type = "text/javascript";
    script.defer = Boolean(isDefer);
    script.async = Boolean(isAsync);
    if (isCrossOrigin) script.crossOrigin = "anonymous";
    if (id) script.id = id;
    if (attributes) {
      Object.keys(attributes).forEach(key => {
        script.setAttribute(key, attributes[key]);
      });
    }

    if (script.readyState) {
      script.onreadystatechange = function() {
        if (script.readyState === "loaded" || script.readyState === "complete") {
          succeed();
        }
      };
    } else {
      script.onload = succeed;
    }
    script.onerror = () => fail(new Error(`Failed to load script: ${url}`));
    script.src = url;

    if (timeout) {
      timeoutId = setTimeout(() => fail(new Error("timeout")), timeout);
    }

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      const parent = document.head || document.body || document.documentElement;
      parent.appendChild(script);
    }
  });
}

/**
 * Wait for the page to finish loading, including when the `load` event has
 * already fired.
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
 * @param {number} timeout Timeout in milliseconds. Defaults to 30,000.
 * @returns {Promise<string>} A promise that resolves to `"complete"` or `"load"`, or rejects on timeout.
 * @category Load
 */
export function windowLoaded(timeout = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      window.removeEventListener("load", onLoad);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    const onLoad = () => {
      cleanup();
      resolve("load");
    };

    if (document.readyState === "complete") {
      resolve("complete");
      return;
    }

    window.addEventListener("load", onLoad);
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, timeout);
  });
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
  let attributeLoads = loadingScripts.get(windowAttribute);
  const existingLoad = attributeLoads?.get(url);
  if (existingLoad) {
    return existingLoad;
  }
  if (!attributeLoads) {
    attributeLoads = new Map<string, LoadScriptReturns>();
    loadingScripts.set(windowAttribute, attributeLoads);
  }
  const clearLoad = () => {
    attributeLoads?.delete(url);
    if (attributeLoads?.size === 0) {
      loadingScripts.delete(windowAttribute);
    }
  };
  const load = loadScript(url).then(
    result => {
      clearLoad();
      return result;
    },
    error => {
      clearLoad();
      throw error;
    }
  );
  attributeLoads.set(url, load);
  return load;
}

const loadingScripts = new Map<string, Map<string, LoadScriptReturns>>();
