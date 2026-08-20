import type { MazeyElement } from "./typing";
import { isNonEmptyArray } from "./util";
import { mazeyCon } from "./debug";

/**
 * Modify `class`: determine `class`.
 *
 * Usage:
 *
 * ```javascript
 * import { hasClass, addClass, removeClass } from "mazey";
 *
 * const dom = document.querySelector("#box");
 * // Determine `class`
 * hasClass(dom, "test");
 * // Add `class`
 * addClass(dom, "test");
 * // Remove `class`
 * removeClass(dom, "test");
 * ```
 *
 * @category DOM
 */
export function hasClass(obj: MazeyElement, cls: string): boolean {
  if (!obj) {
    mazeyCon.error("The element is not exist.");
    return false;
  }
  const oriCls = obj.className; // Read the element's current class value.
  const oriClsArr = oriCls.split(/\s+/); // Split the class value on whitespace.
  for (let i = 0; i < oriClsArr.length; i++) {
    if (oriClsArr[i] === cls) {
      return true; // Return true when the class matches.
    }
  }
  return false; // Return false when no class matches.
}

/**
 * Add `class` to the element. The second parameter can be a single class name or an array of class names.
 *
 * Basic Usage:
 *
 * ```javascript
 * import { addClass } from "mazey";
 *
 * const ele = document.querySelector("#box");
 * addClass(ele, "test");
 * ```
 *
 * Output:
 *
 * ```html
 * <div id="box" class="test"></div>
 * ```
 *
 * Advanced Usage:
 *
 * ```javascript
 * import { addClass, genBrowserAttrs } from "mazey";
 *
 * const ele = document.querySelector("html");
 * addClass(ele, genBrowserAttrs());
 * ```
 *
 * Output:
 *
 * ```html
 * <html class="windows desktop webkit chrome"></html>
 * ```
 *
 * @category DOM
 */
export function addClass(ele: MazeyElement, cls: string | string[]): void {
  if (!ele) {
    mazeyCon.error("The element is not exist.");
    return;
  }
  if (Array.isArray(cls)) {
    cls.forEach((item) => {
      if (item) ele.classList.add(item);
    });
    return;
  }
  if (!cls) return;
  const oriCls = ele.className;
  // Should not add duplicate classes.
  const oriClsArr = oriCls.split(/\s+/);
  for (let i = 0; i < oriClsArr.length; i++) {
    if (oriClsArr[i] === cls) {
      return;
    }
  }
  // Origin logic
  let space = "";
  let newCls = ""; // Build the updated class value.
  if (oriCls !== "") {
    space = " "; // Separate the new class from existing classes.
  }
  newCls = oriCls + space + cls; // Append the new class.
  ele.className = newCls; // Replace the element's class value.
}

/**
 * Alias of `addClass`.
 *
 * @hidden
 */
export function setClass(ele: HTMLElement, cls: string): void {
  addClass(ele, cls);
}

/**
 * Modify `class`: remove `class`.
 *
 * Usage:
 *
 * ```javascript
 * import { hasClass, addClass, removeClass } from "mazey";
 *
 * const dom = document.querySelector("#box");
 * // Determine `class`
 * hasClass(dom, "test");
 * // Add `class`
 * addClass(dom, "test");
 * // Remove `class`
 * removeClass(dom, "test");
 * ```
 *
 * @category DOM
 */
export function removeClass(obj: MazeyElement, cls: string): void {
  if (!obj) {
    mazeyCon.error("The element is not exist.");
    return;
  }
  const oriCls = obj.className;
  let newCls; // Build the updated class value.
  newCls = " " + oriCls + " "; // Pad the class value with spaces.
  newCls = newCls.replace(/(\s+)/gi, " "); // Collapse consecutive whitespace.
  newCls = newCls.replace(" " + cls + " ", " "); // Remove the requested class.
  newCls = newCls.replace(/(^\s+)|(\s+$)/g, ""); // Trim surrounding whitespace.
  obj.className = newCls;
}

/**
 * Add a `<style>` element to the document `<head>`.
 *
 * Usage:
 *
 * Example 1: Add the `<style>` with `id`, and repeated invoking will update the content instead of adding a new one.
 *
 * ```javascript
 * import { addStyle } from "mazey";
 *
 * addStyle(
 *   "body { background-color: #333; }",
 *   { id: "test" }
 * );
 * ```
 *
 * Output:
 *
 * ```html
 * <style id="test">body { background-color: #333; }</style>
 * ```
 *
 * Example 2: Add the `<style>` without `id`, and repeated invoking will add a new one.
 *
 * ```javascript
 * import { addStyle } from "mazey";
 *
 * addStyle("body { background-color: #444; }");
 * ```
 *
 * Output:
 *
 * ```html
 * <style>body { background-color: #444; }</style>
 * ```
 *
 * Example 3: Combine `genStyleString` and `addStyle` to add multiple styles at once.
 *
 * ```javascript
 * import { genStyleString, addStyle } from "mazey";
 *
 * const xStyle = genStyleString(
 *   ".footer>.x-wish>a:first-child" +
 *   ",div.wish-flex>a[href^='https://github.com/chengchuu']" +
 *   ",.m-hide",
 *   [ "display: none" ]
 * );
 * const yStyle = genStyleString(
 *   ".footer>.y-wish:before",
 *   [
 *     `content: 'Copyright (c) chengchuu'`,
 *     "color: inherit",
 *     "padding-inline-start: var(--y-wish-1_5)",
 *     "padding-inline-end: var(--y-wish-1_5)",
 *     "padding-top: var(--y-wish-1)",
 *     "padding-bottom: var(--y-wish-1)",
 *   ]
 * );
 * addStyle(xStyle + yStyle, { id: "z-style" });
 * ```
 *
 * Output:
 *
 * ```html
 * <style id="z-style">.footer>.x-wish>a:first-child,div.wish-flex>a[href^='https://github.com/chengchuu'],.m-hide{display: none;}.footer>.y-wish:before{content: 'Copyright (c) chengchuu';color: inherit;padding-inline-start: var(--y-wish-1_5);padding-inline-end: var(--y-wish-1_5);padding-top: var(--y-wish-1);padding-bottom: var(--y-wish-1);}</style>
 * ```
 *
 * @param style CSS text to add to the document.
 * @param options.id Optional `<style>` element ID. An existing element with
 * the same ID is updated instead of duplicated.
 * @returns Whether non-empty CSS text was added or updated.
 * @category DOM
 */
export function addStyle(style: string, options: { id?: string } = { id: "" }): boolean {
  if (!style) {
    return false;
  }
  // Create a document fragment for the style element.
  const styleFrag = document.createDocumentFragment();
  let idDom: HTMLElement | null = null;
  let domId = "";
  // Custom Style
  const customStyle = document.createElement("style");
  // Reuse an existing element when an ID is provided.
  if (options.id) {
    domId = `${options.id}`;
    idDom = document.getElementById(domId);
    // Insert the style element when the ID does not exist.
    if (!idDom) {
      customStyle.setAttribute("id", options.id);
      customStyle.innerHTML = style;
      styleFrag.appendChild(customStyle);
      document.head.appendChild(styleFrag);
    } else {
      // Update the existing element in place.
      idDom.innerHTML = style;
    }
  } else {
    // Add a new style element when no ID is provided.
    customStyle.innerHTML = style;
    styleFrag.appendChild(customStyle);
    document.head.appendChild(styleFrag);
  }
  return true;
}

/**
 * Sets the width and height of all images on the page based on their `src` attribute.
 * The `src` attribute should contain `width` and/or `height` values in the format "width=100" or "height=100".
 * If jQuery is available, this function uses jQuery to select the images. Otherwise, it uses pure JavaScript.
 *
 * Usage:
 *
 * ```html
 * <img src="image.jpg?width=100px&height=200px">
 * ```
 *
 * ```javascript
 * import { setImgSizeBySrc } from "mazey";
 *
 * setImgSizeBySrc();
 * ```
 *
 * Output:
 *
 * ```html
 * <img src="image.jpg?width=100px&height=200px" width="100px" height="200px">
 * ```
 *
 * @returns {boolean} - Returns `true` if images were found and their dimensions were set, otherwise `false`.
 * @category DOM
 */
export function setImgSizeBySrc(): boolean {
  // Use jQuery if available, otherwise fall back to pure JavaScript
  const $ = window.jQuery || window.$;
  if ($) {
    // Use jQuery to select all images on the page
    const images = $("img");
    if (!(images && images.length)) return false;
    images.each(function() {
      const $this = $(this);
      if (!$this) return;
      // Get the `src` attribute of the image
      const src = $this.attr("src");
      const canMatch = src && typeof src === "string" && src.length;
      if (!canMatch) return;
      // Use regular expressions to extract the `width` and `height` values from the `src` attribute
      const width = src.match(/[?&]width=([0-9]+[a-z%]*)/);
      const height = src.match(/[?&]height=([0-9]+[a-z%]*)/);
      // Set the width and height of the image using jQuery's `width()` and `height()` methods
      if (width && isNonEmptyArray(width) && width[1]) $this.width(width[1]);
      if (height && isNonEmptyArray(height) && height[1]) $this.height(height[1]);
    });
    return true;
  } else {
    // Use pure JavaScript to select all images on the page
    const images = document.getElementsByTagName("img");
    if (images.length > 0) {
      // Loop through each image and set its width and height based on the `src` attribute
      Array.from(images).forEach(function(img) {
        const $this = img;
        if (!$this) return;
        // Get the `src` attribute of the image
        const src = $this.getAttribute("src");
        const canMatch = src && typeof src === "string" && src.length;
        if (!canMatch) return;
        // Use regular expressions to extract the `width` and `height` values from the `src` attribute
        const width = src.match(/[?&]width=([0-9]+[a-z%]*)/);
        const height = src.match(/[?&]height=([0-9]+[a-z%]*)/);
        // Set the width and height of the image using the `style.width` and `style.height` properties
        if (width && isNonEmptyArray(width) && width[1]) $this.style.width = width[1];
        if (height && isNonEmptyArray(height) && height[1]) $this.style.height = height[1];
      });
      return true;
    }
  }
  return false;
}

/**
 * Alias of `setImgSizeBySrc`.
 *
 * @hidden
 */
export function setImgWidHeiBySrc(): boolean {
  return setImgSizeBySrc();
}

/**
 * Generate the inline style string from the given parameters. The first parameter is the query selector, and the second parameter is the style array.
 *
 * Usage:
 *
 * ```javascript
 * const ret1 = genStyleString(".a", [ "color:red" ]);
 * const ret2 = genStyleString("#b", [ "color:red", "font-size:12px" ]);
 * console.log(ret1);
 * console.log(ret2);
 * ```
 *
 * Output:
 *
 * ```text
 * .a{color:red;}
 * #b{color:red;font-size:12px;}
 * ```
 *
 * Example: Combine `genStyleString` and `addStyle` to add multiple styles at once.
 *
 * ```javascript
 * import { genStyleString, addStyle } from "mazey";
 *
 * const xStyle = genStyleString(
 *   ".footer>.x-wish>a:first-child" +
 *   ",div.wish-flex>a[href^='https://github.com/chengchuu']" +
 *   ",.m-hide",
 *   [ "display: none" ]
 * );
 * const yStyle = genStyleString(
 *   ".footer>.y-wish:before",
 *   [
 *     `content: 'Copyright (c) chengchuu'`,
 *     "color: inherit",
 *     "padding-inline-start: var(--y-wish-1_5)",
 *     "padding-inline-end: var(--y-wish-1_5)",
 *     "padding-top: var(--y-wish-1)",
 *     "padding-bottom: var(--y-wish-1)",
 *   ]
 * );
 * addStyle(xStyle + yStyle, { id: "z-style" });
 * ```
 *
 * Output:
 *
 * ```html
 * <style id="z-style">.footer>.x-wish>a:first-child,div.wish-flex>a[href^='https://github.com/chengchuu'],.m-hide{display: none;}.footer>.y-wish:before{content: 'Copyright (c) chengchuu';color: inherit;padding-inline-start: var(--y-wish-1_5);padding-inline-end: var(--y-wish-1_5);padding-top: var(--y-wish-1);padding-bottom: var(--y-wish-1);}</style>
 * ```
 *
 * @param {string} selector
 * @param {array} styleArray
 * @returns {string} The inline style string.
 * @category DOM
 */
export function genStyleString(selector: string, styleArray: Array<string>): string {
  let style = "";
  if (styleArray && styleArray.length > 0) {
    style = styleArray.join(";") + ";";
  }
  return `${selector}{${style}}`;
}

/**
 * Get the value of the meta tag by the given name.
 *
 * Usage:
 *
 * ```html
 * <meta name="keywords" content="mazey,web,frontend">
 * ```
 *
 * ```javascript
 * import { getPageMeta } from "mazey";
 *
 * const keywords = getPageMeta("keywords");
 * console.log(keywords);
 * ```
 *
 * Output:
 *
 * ```text
 * mazey,web,frontend
 * ```
 *
 * @param {string} name - The name of the meta tag.
 * @returns {string} The content of the meta tag.
 * @category DOM
 */
export function getPageMeta(name: string): string {
  const metaTags = document.getElementsByTagName("meta");
  for (let i = 0; i < metaTags.length; i++) {
    if (metaTags[i].getAttribute("name") === name) {
      return metaTags[i].getAttribute("content") || "";
    }
  }
  return "";
}

/**
 * Check whether a value is a CSS selector supported by the supplied query
 * root without allowing selector syntax errors to escape.
 *
 * Usage:
 *
 * ```javascript
 * import { isValidCssSelector } from "mazey";
 *
 * isValidCssSelector(".message > img"); // true
 * isValidCssSelector("["); // false
 * isValidCssSelector("", { allowEmpty: true }); // true
 * ```
 *
 * @remarks Browser only unless a compatible `ParentNode` is supplied.
 * @param selector Value to validate as a CSS selector.
 * @param options.allowEmpty Whether an empty or whitespace-only string is accepted. Defaults to `false`.
 * @param options.root Query root used to validate browser support. Defaults to `document` when available.
 * @returns Whether the selector is accepted by the query root.
 * @category DOM
 */
export function isValidCssSelector(
  selector: unknown,
  options: { allowEmpty?: boolean; root?: ParentNode } = {}
): boolean {
  if (typeof selector !== "string") return false;
  const normalizedSelector = selector.trim();
  if (!normalizedSelector) return options.allowEmpty === true;

  const root = options.root ||
    (typeof document === "undefined" ? null : document);
  if (!root) return false;

  try {
    root.querySelector(normalizedSelector);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Options for resolving an element target.
 *
 * @category DOM
 */
export interface ResolveElementTargetOptions {
  /** Query root used to resolve selector targets. */
  root: ParentNode;
  /** Element returned when `target` is `undefined`. Defaults to `null`. */
  defaultElement?: Element | null;
  /** Optional adapter for ref-like or framework-specific target wrappers. */
  unwrap?: (value: unknown) => unknown;
}

function isElementTarget(value: unknown): value is Element {
  return Boolean(
    value &&
    typeof value === "object" &&
    (value as Node).nodeType === 1 &&
    typeof (value as Element).nodeName === "string" &&
    typeof (value as Element).getAttribute === "function"
  );
}

/**
 * A target accepted by the DOM visibility helpers.
 *
 * @category DOM
 */
export type DomVisibilityTarget =
  | string
  | Element
  | Iterable<Element>
  | ArrayLike<Element>
  | null
  | undefined;

type StyleElement = Element & ElementCSSInlineStyle;

const storedDisplayValues = new WeakMap<Element, string>();
const defaultDisplayValues = new WeakMap<Document, Map<string, string>>();

const defaultDisplayByTag: Record<string, string> = {
  button: "inline-block",
  input: "inline-block",
  select: "inline-block",
  textarea: "inline-block",
  table: "table",
  caption: "table-caption",
  colgroup: "table-column-group",
  col: "table-column",
  thead: "table-header-group",
  tbody: "table-row-group",
  tfoot: "table-footer-group",
  tr: "table-row",
  td: "table-cell",
  th: "table-cell",
  li: "list-item",
  summary: "list-item",
};

const blockDisplayTags = new Set([
  "address", "article", "aside", "blockquote", "body", "dd", "details",
  "dialog", "div", "dl", "dt", "fieldset", "figcaption", "figure",
  "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header",
  "hgroup", "hr", "html", "main", "nav", "ol", "p", "pre", "section",
  "ul",
]);

function getStyleElement(value: unknown): StyleElement | null {
  if (!isElementTarget(value)) return null;
  const style = (value as Partial<ElementCSSInlineStyle>).style;
  return style && typeof style.display === "string"
    ? value as StyleElement
    : null;
}

function resolveVisibilityTargets(target: unknown): StyleElement[] {
  const resolved = new Set<StyleElement>();
  const add = (value: unknown) => {
    const element = getStyleElement(value);
    if (element) resolved.add(element);
  };

  if (typeof target === "string") {
    if (typeof document === "undefined") return [];
    try {
      document.querySelectorAll(target).forEach(add);
    } catch (error) {
      return [];
    }
    return Array.from(resolved);
  }

  const directElement = getStyleElement(target);
  if (directElement) return [ directElement ];
  if (!target || typeof target !== "object") return [];

  const iterator = (target as Partial<Iterable<unknown>>)[Symbol.iterator];
  if (typeof iterator === "function") {
    for (const value of target as Iterable<unknown>) add(value);
    return Array.from(resolved);
  }

  const length = (target as Partial<ArrayLike<unknown>>).length;
  if (!Number.isSafeInteger(length) || (length as number) < 0) return [];
  for (let index = 0; index < (length as number); index += 1) {
    add((target as ArrayLike<unknown>)[index]);
  }

  return Array.from(resolved);
}

function getComputedDisplay(element: Element): string | null {
  const view = element.ownerDocument.defaultView;
  return view ? view.getComputedStyle(element).display : null;
}

function getFallbackDisplay(tagName: string): string {
  if (defaultDisplayByTag[tagName]) return defaultDisplayByTag[tagName];
  return blockDisplayTags.has(tagName) ? "block" : "inline";
}

function getDefaultDisplay(element: Element): string {
  const ownerDocument = element.ownerDocument;
  const tagName = element.localName.toLowerCase();
  let documentValues = defaultDisplayValues.get(ownerDocument);
  if (!documentValues) {
    documentValues = new Map();
    defaultDisplayValues.set(ownerDocument, documentValues);
  }

  const namespace = element.namespaceURI || "";
  const cacheKey = `${namespace}:${tagName}`;
  const cachedValue = documentValues.get(cacheKey);
  if (cachedValue) return cachedValue;

  let display = "";
  const isAutonomousCustomElement =
    namespace === "http://www.w3.org/1999/xhtml" && tagName.includes("-");
  const parent = ownerDocument.body || ownerDocument.documentElement;
  if (parent && !isAutonomousCustomElement) {
    const probe = namespace && namespace !== "http://www.w3.org/1999/xhtml"
      ? ownerDocument.createElementNS(namespace, tagName)
      : ownerDocument.createElement(tagName);
    parent.appendChild(probe);
    try {
      display = getComputedDisplay(probe) || "";
    } finally {
      parent.removeChild(probe);
    }
  }

  if (!display || display === "none") display = getFallbackDisplay(tagName);
  documentValues.set(cacheKey, display);
  return display;
}

/**
 * Hide every resolved element while preserving its visible inline `display`
 * value for a later call to {@link show}.
 *
 * ```javascript
 * import { hide } from "mazey";
 *
 * hide(".notice");
 * ```
 *
 * @remarks Selectors use the global document. Direct elements and collections
 * use their owning documents. Invalid selectors and unsupported values are
 * ignored. Duplicate elements are mutated once.
 * @param target Selector, element, iterable, array-like collection, or an empty target.
 * @returns The original target unchanged, to support chaining by the caller.
 * @category DOM
 */
export function hide<T extends DomVisibilityTarget>(target: T): T {
  resolveVisibilityTargets(target).forEach(element => {
    const computedDisplay = getComputedDisplay(element);
    if (computedDisplay !== "none" && element.style.display !== "none") {
      storedDisplayValues.set(element, element.style.display);
    }
    element.style.display = "none";
  });
  return target;
}

/**
 * Show every resolved element by restoring a display value preserved by
 * {@link hide}, or by applying the document-aware default for CSS-hidden
 * elements.
 *
 * ```javascript
 * import { show } from "mazey";
 *
 * const notices = document.querySelectorAll(".notice");
 * show(notices);
 * ```
 *
 * @remarks Selectors use the global document. Direct elements and collections
 * use their owning documents. Invalid selectors and unsupported values are
 * ignored. Duplicate elements are mutated once.
 * @param target Selector, element, iterable, array-like collection, or an empty target.
 * @returns The original target unchanged, to support chaining by the caller.
 * @category DOM
 */
export function show<T extends DomVisibilityTarget>(target: T): T {
  resolveVisibilityTargets(target).forEach(element => {
    if (storedDisplayValues.has(element)) {
      element.style.display = storedDisplayValues.get(element) as string;
      storedDisplayValues.delete(element);
    } else if (element.style.display === "none") {
      element.style.display = "";
    }

    if (element.style.display === "" && getComputedDisplay(element) === "none") {
      element.style.display = getDefaultDisplay(element);
    }
  });
  return target;
}

/**
 * Resolve an element from a direct element, a selector, an optionally
 * unwrapped value, or a component-like object containing an `$el` element.
 * Selector queries are scoped to the supplied root. Invalid selectors,
 * unmatched selectors, `null`, and unsupported values return `null`.
 *
 * Usage:
 *
 * ```javascript
 * import { resolveElementTarget } from "mazey";
 *
 * const element = resolveElementTarget("#dialog", {
 *   root: document,
 *   defaultElement: document.documentElement,
 * });
 * console.log(element?.id);
 * ```
 *
 * Output:
 *
 * ```text
 * dialog
 * ```
 *
 * Ref-like values can be supported without coupling Mazey to a framework:
 *
 * ```javascript
 * const elementRef = { value: document.querySelector("#dialog") };
 * const element = resolveElementTarget(elementRef, {
 *   root: document,
 *   unwrap: value => value?.value,
 * });
 * ```
 *
 * @remarks Browser only unless compatible DOM objects are supplied. The
 * function does not query or mutate the DOM when given a direct element.
 * `defaultElement` is used only when `target` is `undefined`; an explicit
 * `null` target resolves to `null`.
 * @param target Direct element, selector, wrapped value, component-like value, or `undefined`.
 * @param options Query root, optional default element, and optional unwrap adapter.
 * @returns The resolved element, or `null` when the target cannot be resolved.
 * @category DOM
 */
export function resolveElementTarget(
  target: unknown,
  options: ResolveElementTargetOptions
): Element | null {
  if (target === undefined) {
    return isElementTarget(options.defaultElement)
      ? options.defaultElement
      : null;
  }

  let value = options.unwrap ? options.unwrap(target) : target;
  if (value == null) return null;

  if (typeof value === "string") {
    try {
      return options.root.querySelector(value);
    } catch (error) {
      return null;
    }
  }

  if (typeof value === "object" && "$el" in value) {
    value = (value as { $el?: unknown }).$el;
  }

  return isElementTarget(value) ? value : null;
}

/**
 * Extract text from a cloned element without modifying the original DOM.
 * Images can be replaced by their `alt` text, selected descendants can be
 * removed, and whitespace can be normalized before returning the text.
 *
 * Invalid exclusion selectors are ignored.
 *
 * Usage:
 *
 * ```javascript
 * import { extractElementText } from "mazey";
 *
 * const element = document.querySelector(".message");
 * const text = extractElementText(element, {
 *   excludeSelector: ".message-actions",
 * });
 * ```
 *
 * @remarks Browser only.
 * @param element Element whose cloned contents are read.
 * @param options.excludeSelector Selector for descendants to remove from the clone.
 * @param options.replaceImagesWithAlt Whether images with an `alt` attribute are replaced by that text. Defaults to `true`.
 * @param options.normalizeWhitespace Whether whitespace is collapsed and trimmed. Defaults to `true`.
 * @returns Extracted text from the cloned element.
 * @category DOM
 */
export function extractElementText(
  element: Element,
  options: {
    excludeSelector?: string;
    replaceImagesWithAlt?: boolean;
    normalizeWhitespace?: boolean;
  } = {}
): string {
  const {
    excludeSelector = "",
    replaceImagesWithAlt = true,
    normalizeWhitespace = true,
  } = options;
  const clone = element.cloneNode(true) as Element;

  if (replaceImagesWithAlt) {
    Array.from(clone.querySelectorAll("img[alt]")).forEach(imageElement => {
      const imageText = imageElement.getAttribute("alt") || "";
      imageElement.parentNode?.replaceChild(
        clone.ownerDocument.createTextNode(imageText),
        imageElement
      );
    });
  }

  const normalizedExcludeSelector = excludeSelector.trim();
  if (
    normalizedExcludeSelector &&
    isValidCssSelector(normalizedExcludeSelector, { root: clone })
  ) {
    Array.from(clone.querySelectorAll(normalizedExcludeSelector)).forEach(
      excludedElement => excludedElement.parentNode?.removeChild(excludedElement)
    );
  }

  const innerText = (clone as HTMLElement).innerText;
  const text = innerText || clone.textContent || "";
  return normalizeWhitespace
    ? text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
    : text;
}
