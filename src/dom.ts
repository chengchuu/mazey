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
  const oriCls = obj.className; // 获取对象的 class 值
  const oriClsArr = oriCls.split(/\s+/); // 分隔空格转换成数组
  for (let i = 0; i < oriClsArr.length; i++) {
    if (oriClsArr[i] === cls) {
      return true; // 若匹配到 class 则返回 True
    }
  }
  return false; // 否则返回 False
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
      ele.classList.add(item);
    });
    return;
  }
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
  let newCls = ""; // 获取对象的 class 值
  if (oriCls !== "") {
    space = " "; // 若原来的 class 不为空，跟一个空格
  }
  newCls = oriCls + space + cls; // 将新的 class 加进去
  ele.className = newCls; // 替换新 class
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
  let newCls; // 获取对象的 class 值
  newCls = " " + oriCls + " "; // 前后加空格
  newCls = newCls.replace(/(\s+)/gi, " "); // 将多余的空格替换成一个空格
  newCls = newCls.replace(" " + cls + " ", " "); // 将加了前后空格的 cls 替换成空格 " "
  newCls = newCls.replace(/(^\s+)|(\s+$)/g, ""); // 去掉前后空格
  obj.className = newCls;
}

/**
 * EN: Add `<style>` in `<head>`.
 *
 * ZH: 添加样式标签; style: 样式标签内的字符串; id: `<style>` 标签的 `id`; 返回: 添加成功/失败。
 *
 * Usage:
 * 
 * Example 1: Add the `<style>` with `id`, and repeated invoking will update the content instead of adding a new one.
 *
 * ```javascript
 * import { addStyle } from "mazey";
 * 
 * addStyle(
 *   `
 *     body {
 *       background-color: #333;
 *     }
 *   `,
 *   {
 *     id: "test",
 *   }
 * );
 * ```
 * 
 * Output:
 * 
 * ```html
 * <style id="test">
 *   body {
 *     background-color: #333;
 *   }
 * </style>
 * ```
 *
 * Example 2: Add the `<style>` without `id`, and repeated invoking will add a new one.
 *
 * ```javascript
 * import { addStyle } from "mazey";
 * 
 * addStyle(
 *   `
 *     body {
 *       background-color: #444;
 *     }
 *   `
 * );
 * ```
 * 
 * Output:
 * 
 * ```html
 * <style>
 *   body {
 *     background-color: #444;
 *   }
 * </style>
 * ```
 * 
 * @category DOM
 */
export function addStyle(style: string, options: { id?: string } = { id: "" }): boolean {
  if (!style) {
    return false;
  }
  // 创建 style 文档碎片
  const styleFrag = document.createDocumentFragment();
  let idDom: HTMLElement | null = null;
  let domId = "";
  // Custom Style
  const customStyle = document.createElement("style");
  // 如果需要 ID
  if (options.id) {
    domId = `${options.id}`;
    idDom = document.getElementById(domId);
    // 如果 Dom 不存在，插入 style
    if (!idDom) {
      customStyle.setAttribute("id", options.id);
      customStyle.innerHTML = style;
      styleFrag.appendChild(customStyle);
      document.head.appendChild(styleFrag);
    } else {
      // 如果 Dom 存在，直接更新
      idDom.innerHTML = style;
    }
  } else {
    // 不需要 ID，直接添加新标签
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
      const width = src.match(/width=([0-9]+[a-z%]*)/);
      const height = src.match(/height=([0-9]+[a-z%]*)/);
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
        const width = src.match(/width=([0-9]+[a-z%]*)/);
        const height = src.match(/height=([0-9]+[a-z%]*)/);
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
  if (!document.querySelector) return "";
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") || "";
}
