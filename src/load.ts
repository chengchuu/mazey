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
  return new Promise<string>((resolve, reject) => {
    const node = document.createElement("link");
    let settled = false;
    const cleanup = () => {
      node.onload = null;
      node.onerror = null;
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve("loaded");
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Failed to load CSS: ${url}`));
    };

    node.rel = "stylesheet";
    node.type = "text/css";
    node.href = url;
    if (typeof id !== "undefined") {
      node.id = id;
    }
    node.onload = succeed;
    node.onerror = fail;
    document.head.appendChild(node);
  });
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

    script.onload = succeed;
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
