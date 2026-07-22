English | [简体中文](https://github.com/chengchuu/mazey/blob/main/README.zh-CN.md)

# Mazey

[![npm version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/mazey
[npm-url]: https://npmjs.org/package/mazey
[l-image]: https://img.shields.io/npm/l/mazey
[l-url]: https://github.com/chengchuu/mazey

Mazey is a functional library for daily frontend work. There are already many excellent libraries for frontend development, but creating a file named `utils.js` or `common.js` is generally used to supply common functions in projects. It's boring to copy similar functions across multiple projects. That's why I've created this library and will keep updating it to serve as a reliable resource for frontend needs.

- [Project website](https://chengchuu.github.io/mazey/)
- [Live playground](https://chengchuu.github.io/mazey/playground/)
- [API documentation](https://chengchuu.github.io/mazey/api/)

## Install

Use Mazey via [npm](https://www.npmjs.com/package/mazey).

```bash
npm install mazey
```

Use Mazey from CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/mazey@latest/lib/mazey.min.js"></script>
```

You can also download and serve the
[latest browser bundle](https://cdn.jsdelivr.net/npm/mazey@latest/lib/mazey.min.js)
yourself.

## Usage

Example: Use a function to verify if a value is a number suitable for standard calculations and comparisons.

Import from [npm](https://www.npmjs.com/package/mazey).

```javascript
import { isNumber } from "mazey";

const x = 123;
const y = "abc";
const z = Infinity;
isNumber(x); // Output: true
isNumber(y); // Output: false
isNumber(z, { isInfinityAsNumber: true }); // Output: true
```

Import from CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/mazey@latest/lib/mazey.min.js"></script>
<script>
  const x = 123;
  mazey.isNumber(x); // Output: true
</script>
```

## API Examples

There are some examples maintained by hand below. For more information, please check the
[full API documentation](https://chengchuu.github.io/mazey/api/).

### Table of Contents

<!-- toc - begin -->
- Generated with ❤️
- [Load Resource](#load-resource)
  - [loadScript](#loadscript)
  - [loadScriptIfUndefined](#loadscriptifundefined)
  - [loadCSS](#loadcss)
  - [loadImage](#loadimage)
  - [windowLoaded](#windowloaded)
- [Util](#util)
  - [isNumber](#isnumber)
  - [isJSONString](#isjsonstring)
  - [parseJsonSafe](#parsejsonsafe)
  - [sha256Hex](#sha256hex)
  - [isValidData](#isvaliddata)
  - [genRndNumString](#genrndnumstring)
  - [formatDate](#formatdate)
  - [isValidDate](#isvaliddate)
  - [isToday](#istoday)
  - [isThisYear](#isthisyear)
  - [isThisMonth](#isthismonth)
  - [isThisWeek](#isthisweek)
  - [isThisHour](#isthishour)
  - [formatDistanceToNow](#formatdistancetonow)
  - [generateCalendarVersion](#generatecalendarversion)
  - [formatDurationFromMs](#formatdurationfromms)
  - [deepCopy](#deepcopy)
  - [deepFreeze](#deepfreeze)
  - [debounce](#debounce)
  - [throttle](#throttle)
  - [convertCamelToKebab](#convertcameltokebab)
  - [convertCamelToUnder](#convertcameltounder)
  - [toJavaScriptGlobalName](#tojavascriptglobalname)
- [URL](#url)
  - [getQueryParam](#getqueryparam)
  - [getUrlParam](#geturlparam)
  - [getHashQueryParam](#gethashqueryparam)
  - [getDomain](#getdomain)
  - [updateQueryParam](#updatequeryparam)
  - [isValidUrl](#isvalidurl)
  - [isValidHttpUrl](#isvalidhttpurl)
  - [parseGitHubRepository](#parsegithubrepository)
- [Store](#store)
  - [Cookie Helpers](#cookie-helpers)
  - [Storage Helpers](#storage-helpers)
- [DOM](#dom)
  - [Class Helpers](#class-helpers)
  - [isValidCssSelector](#isvalidcssselector)
  - [extractElementText](#extractelementtext)
  - [addStyle](#addstyle)
  - [genStyleString](#genstylestring)
  - [newLine](#newline)
- [Calculate and Formula](#calculate-and-formula)
  - [inRate](#inrate)
  - [longestComSubstring](#longestcomsubstring)
  - [longestComSubsequence](#longestcomsubsequence)
- [Browser Information](#browser-information)
  - [resolveThemePreference](#resolvethemepreference)
  - [setThemePreference](#setthemepreference)
  - [resolveLanguagePreference](#resolvelanguagepreference)
  - [setLanguagePreference](#setlanguagepreference)
  - [getBrowserInfo](#getbrowserinfo)
  - [isSafePWAEnv](#issafepwaenv)
  - [isStandalonePWA](#isstandalonepwa)
- [Web Performance](#web-performance)
  - [getPerformance](#getperformance)
- [Debug](#debug)
  - [genCustomConsole](#gencustomconsole)
<!-- toc - end -->

### Load Resource

#### loadScript

Load a JavaScript file from the server and execute it.

Usage:

```javascript
loadScript(
    "http://example.com/static/js/plugin-2.1.1.min.js",
    {
      id: "iamid", // (Optional) script ID, default none
      timeout: 5000, // (Optional) timeout, default `5000`
    }
  )
  .then(
    res => {
      console.log(`Load JavaScript script: ${res}`);
    }
  )
  .catch(
    err => {
      console.error(`Load JavaScript script: ${err.message}`);
    }
  );
```

Output:

```text
Load JavaScript script: loaded
```

#### loadScriptIfUndefined

Load a script from the given URL if it (`window["attribute"]`) has not already been loaded.

Usage:

```javascript
loadScriptIfUndefined("xyz", "https://example.com/lib/xyz.min.js")
  .then(() => {
    console.log("xyz is loaded.");
  })
  .catch(err => {
    console.log("Failed to load xyz.", err);
  });
```

Output:

```text
xyz is loaded.
```

#### loadCSS

Load a CSS file from the server.

Usage:

```javascript
loadCSS(
    "https://example.com/path/example.css",
    {
      id: "iamid", // Optional, link ID, default none
    }
  )
  .then(
    res => {
      console.log(`Load CSS Success: ${res}`);
    }
  )
  .catch(
    err => {
      console.error(`Load CSS Fail: ${err.message}`)
    }
  );
```

Output:

```text
Load CSS Success: loaded
```

#### loadImage

Load an image from the given URL.

The target image will be loaded in the background, and the Promise status will change after the image is loaded. If the image fails to load, the Promise status will change to `reject` with the error object. If the image is loaded successfully, the Promise status will change to `resolve` with the image object. This method can be used to preload images and cache them in the browser. It can also be used to implement lazy loading of images.

Note that this method will not add the image to the DOM.

Usage:

```javascript
loadImage("https://example.com/example.png")
  .then((img) => {
    console.log(img);
  })
  .catch((err) => {
    console.log(err);
  });
```

#### windowLoaded

Check whether the page is loaded successfully (Keep the compatibility if the browser's `load` event has been triggered).

Usage:

```javascript
windowLoaded()
  .then(res => {
    console.log(`Load Success: ${res}`);
  })
  .catch(err => {
    console.log(`Load Timeout or Fail: ${err.message}`);
  });
```

Output:

```text
Load Success: load
```

### Util

#### isNumber

Check whether it is a right number.

Usage:

```javascript
const ret1 = isNumber(123);
const ret2 = isNumber("123");
// Default: NaN, Infinity is not Number
const ret3 = isNumber(Infinity);
const ret4 = isNumber(Infinity, { isInfinityAsNumber: true });
const ret5 = isNumber(NaN);
const ret6 = isNumber(NaN, { isNaNAsNumber: true, isInfinityAsNumber: true });
console.log(ret1, ret2, ret3, ret4, ret5, ret6);
```

Output:

```text
true false false true false true
```

#### isJSONString

Check whether it is a valid JSON string.

Usage:

```javascript
const ret1 = isJSONString(`['a', 'b', 'c']`);
const ret2 = isJSONString(`["a", "b", "c"]`);
console.log(ret1);
console.log(ret2);
```

Output:

```text
false
true
```

#### parseJsonSafe

Parse JSON and return a caller-defined fallback instead of throwing when the
input is malformed.

```javascript
const data = parseJsonSafe('{"enabled":true}');
const fallback = parseJsonSafe("invalid", {});
console.log(data, fallback);
```

#### sha256Hex

Generate a lowercase SHA-256 hexadecimal digest with the Web Crypto API.
String input also requires `TextEncoder`.

```javascript
const digest = await sha256Hex("hello world");
console.log(digest);
```

Output:

```text
b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
```

#### isValidData

Determine the validity of the data.

Usage:

```javascript
const validData = {
  a: {
    b: {
      c: 413
    }
  }
};
const isValidDataResA = isValidData(validData, ["a", "b", "c"], 2333);
const isValidDataResB = isValidData(validData, ["a", "b", "c"], 413);
const isValidDataResC = isValidData(validData, ["d", "d"], 413);
console.log("isValidDataResA:", isValidDataResA);
console.log("isValidDataResB:", isValidDataResB);
console.log("isValidDataResC:", isValidDataResC);
```

Output:

```text
isValidDataResA: false
isValidDataResB: true
isValidDataResC: false
```

#### genRndNumString

Produce a random string of number, `genRndNumString(7)` => "7658495".

Usage:

```javascript
const ret1 = genRndNumString(4);
const ret2 = genRndNumString(7);
console.log(ret1);
console.log(ret2);
```

Output:

```text
9730
2262490
```

#### formatDate

Return the formatted date string in the given format.

Usage:

```javascript
const ret1 = formatDate();
const ret2 = formatDate("Tue Jan 11 2022 14:12:26 GMT+0800 (China Standard Time)", "yyyy-MM-dd hh:mm:ss");
const ret3 = formatDate(1641881235000, "yyyy-MM-dd hh:mm:ss");
const ret4 = formatDate(new Date(2014, 1, 11), "MM/dd/yyyy");
console.log("Default formatDate value:", ret1);
console.log("String formatDate value:", ret2);
console.log("Number formatDate value:", ret3);
console.log("Date formatDate value:", ret4);
```

Output:

```text
Default formatDate value: 2023-01-11
String formatDate value: 2022-01-11 14:12:26
Number formatDate value: 2022-01-11 14:07:15
Date formatDate value: 02/11/2014
```

#### isValidDate

Check whether an unknown value represents a valid date. The function accepts
`Date` instances, finite millisecond timestamps, supported local date strings,
and ISO 8601 strings with `Z` or a numeric timezone offset.

Supported string forms are `YYYY-MM-DD`, `YYYY-MM-DD HH:mm[:ss]`,
`YYYY-MM-DDTHH:mm[:ss]`, and the same `T`-separated date-time with `Z` or a
`+HH:mm`/`-HH:mm` offset. Zoned strings may include 1-3 millisecond digits.

Structured strings are parsed into numeric components and validated strictly.
Invalid calendar dates such as `"2020-02-30"` are rejected instead of being
normalized into another date.

Usage:

```javascript
const ret1 = isValidDate(1577877720000);
const ret2 = isValidDate("2020-01-01 11:22");
const ret3 = isValidDate("2020-02-30");
const ret4 = isValidDate(new Date("invalid"));
console.log(ret1, ret2, ret3, ret4);
```

Output:

```text
true true false false
```

#### isToday

Check whether a date has the current local year, month, and day.

```javascript
isToday(new Date());
```

Output: `true`

#### isThisYear

Check whether a date is in the current local calendar year.

```javascript
isThisYear(new Date());
```

Output: `true`

#### isThisMonth

Check whether a date is in the current local calendar month and year.

```javascript
isThisMonth(new Date());
```

Output: `true`

#### isThisWeek

Check whether a date is in the current local Monday-first week. The week ends
before the following Monday.

```javascript
isThisWeek(new Date());
```

Output: `true`

#### isThisHour

Check whether a date has the current local year, month, day, and hour.

```javascript
isThisHour(new Date());
```

Output: `true`

#### formatDistanceToNow

Format the absolute distance from a date to now without adding `ago` or `in`.
Past and future dates use the same approximate English wording.

```javascript
formatDistanceToNow(new Date(Date.now() - 60 * 60 * 1000));
```

Output: `about 1 hour`

#### generateCalendarVersion

Generate a local-time Calendar Versioning string using the conceptual format `yyyy.MMdd.HHmmss`. Leading zeroes are removed from each numeric segment for Semantic Versioning compatibility.

Versions increase with the supplied local date and time under normal clock progression. Because the function intentionally follows local time, a manual clock rollback or daylight-saving fallback can produce a value lower than one generated earlier.

Usage:

```javascript
const version = generateCalendarVersion(
  new Date(2026, 6, 11, 7, 40, 35)
);
console.log(version);
```

Output:

```text
2026.711.74035
```

#### formatDurationFromMs

Format a duration in milliseconds using the largest applicable unit: seconds, minutes, hours, or days. Values are rounded to at most one decimal place; negative and non-finite durations produce `"0 seconds"`.

Usage:

```javascript
const ret1 = formatDurationFromMs(500);
const ret2 = formatDurationFromMs(90000);
const ret3 = formatDurationFromMs(3600000);
const ret4 = formatDurationFromMs(129600000);
console.log(ret1);
console.log(ret2);
console.log(ret3);
console.log(ret4);
```

Output:

```text
0.5 seconds
1.5 minutes
1 hour
1.5 days
```

#### deepCopy

Copy/Clone Object deeply.

Usage:

```javascript
const ret1 = deepCopy(["a", "b", "c"]);
const ret2 = deepCopy("abc");
console.log(ret1);
console.log(ret2);
```

Output:

```text
["a", "b", "c"]
abc
```

#### deepFreeze

Recursively freeze an object and its nested enumerable values. Primitive values
and objects that are already frozen are returned unchanged.

Usage:

```javascript
const config = deepFreeze({
  api: {
    timeout: 5000,
  },
});

console.log(Object.isFrozen(config));
console.log(Object.isFrozen(config.api));
```

Output:

```text
true
true
```

#### debounce

Debounce

Usage:

```javascript
const foo = debounce(() => {
  console.log("The debounced function will only be invoked in 1000 milliseconds, the other invoking will disappear during the wait time.");
}, 1000, true);
```

#### throttle

Throttle

Usage:

```javascript
const foo = throttle(() => {
  console.log("The function will be invoked at most once per every wait 1000 milliseconds.");
}, 1000, { leading: true });
```

Reference: [Lodash](https://lodash.com/docs/4.17.15#throttle)

#### convertCamelToKebab

Transfer CamelCase to KebabCase.

Usage:

```javascript
const ret1 = convertCamelToKebab("ABC");
const ret2 = convertCamelToKebab("aBC");
console.log(ret1);
console.log(ret2);
```

Output:

```text
a-b-c
a-b-c
```

#### convertCamelToUnder

Transfer CamelCase to Underscore.

Usage:

```javascript
const ret1 = convertCamelToUnder("ABC");
const ret2 = convertCamelToUnder("aBC");
console.log(ret1);
console.log(ret2);
```

Output:

```text
a_b_c
a_b_c
```

#### toJavaScriptGlobalName

Convert text to a deterministic uppercase ASCII identifier suitable for an
IIFE global name. Invalid identifier characters become underscores, and a
leading digit is prefixed with an underscore.

```javascript
const globalName = toJavaScriptGlobalName("@scope/my-library");
console.log(globalName);
```

Output:

```text
_SCOPE_MY_LIBRARY
```

### URL

#### getQueryParam

Get the query param's value of the current Web URL(`location.search`).

Usage:

```javascript
// http://example.com/?t1=1&t2=2&t3=3&t4=4#2333
// ?t1=1&t2=2&t3=3&t4=4
const p1 = getQueryParam("t3");
const p2 = getQueryParam("t4");
console.log(p1, p2);
```

Output:

```text
3 4
```

#### getUrlParam

Returns the value of the specified query parameter in the input URL.

Usage:

```javascript
const p1 = getUrlParam("https://example.com/?t1=1&t2=2&t3=3&t4=4", "t3");
const p2 = getUrlParam("https://example.com/?t1=1&t2=2&t3=3&t4=4", "t4");
console.log(p1, p2);
```

Output:

```text
3 4
```

#### getHashQueryParam

Get the hash query param's value of the current Web URL(`location.hash`).

Usage:

```javascript
// http://example.com/?#2333?t1=1&t2=2&t3=3&t4=4
// #2333?t1=1&t2=2&t3=3&t4=4
const p1 = getHashQueryParam("t3");
const p2 = getHashQueryParam("t4");
console.log(p1, p2);
```

Output:

```text
3 4
```

#### getDomain

Get the domain of URL, and other params.

Usage:

```javascript
const ret1 = getDomain("http://example.com/?t1=1&t2=2&t3=3&t4=4");
const ret2 = getDomain("http://example.com/test/thanks?t1=1&t2=2&t3=3&t4=4", ["hostname", "pathname"]);
const ret3 = getDomain("http://example.com:7890/test/thanks", ["hostname"]);
const ret4 = getDomain("http://example.com:7890/test/thanks", ["host"]); // With Port
const ret5 = getDomain("http://example.com:7890/test/thanks", ["origin"]);
const ret6 = getDomain("http://example.com:7890/test/thanks?id=1", ["origin", "pathname", "search"]);
console.log(ret1);
console.log(ret2);
console.log(ret3);
console.log(ret4);
console.log(ret5);
console.log(ret6);
```

Output:

```text
example.com
example.com/test/thanks
example.com
example.com:7890
http://example.com:7890
http://example.com:7890/test/thanks?id=1
```

#### updateQueryParam

Update the query param's value of the input URL.

Usage:

```javascript
const ret1 = updateQueryParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t3", "three");
const ret2 = updateQueryParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t4", "four");
console.log(ret1);
console.log(ret2);
```

Output:

```text
http://example.com/?t1=1&t2=2&t3=three&t4=4
http://example.com/?t1=1&t2=2&t3=3&t4=four
```

#### isValidUrl

Checks if the given string is a valid URL, including **scheme URLs**.

Usage:

```javascript
const ret1 = isValidUrl("https://www.example.com");
const ret2 = isValidUrl("http://example.com/path/exx/ss");
const ret3 = isValidUrl("https://www.example.com/?q=hello&age=24#world");
const ret4 = isValidUrl("http://www.example.com/#world?id=9");
const ret5 = isValidUrl("ftp://example.com");
console.log(ret1, ret2, ret3, ret4, ret5);
```

Output:

```text
true true true true true
```

If you are specifically checking for HTTP/HTTPS URLs, it is recommended to use the `isValidHttpUrl` function instead.
The `isValidUrl` function matches all scheme URLs, including FTP and other non-HTTP schemes.

#### isValidHttpUrl

Check if the given string is a valid HTTP/HTTPS URL.

Usage:

```javascript
const ret1 = isValidHttpUrl("https://www.example.com");
const ret2 = isValidHttpUrl("http://example.com/path/exx/ss");
const ret3 = isValidHttpUrl("https://www.example.com/?q=hello&age=24#world");
const ret4 = isValidHttpUrl("http://www.example.com/#world?id=9");
const ret5 = isValidHttpUrl("ftp://example.com");
console.log(ret1, ret2, ret3, ret4, ret5);
```

Output:

```text
true true true true false
```

#### parseGitHubRepository

Parse a GitHub repository shorthand, SCP form, or supported Git transport URL
into canonical identity fields.

```javascript
const repository = parseGitHubRepository("git@github.com:acme/widget.git");
console.log(JSON.stringify(repository));
```

Output:

```text
{"owner":"acme","name":"widget","slug":"acme/widget","url":"https://github.com/acme/widget"}
```

### Store

#### Cookie Helpers

Handle Cookie.

Usage:

```javascript
setCookie("test", "123", 30, "example.com"); // key value day domain
const ret = getCookie("test");
console.log(ret);
```

Output:

```text
123
```

#### Storage Helpers

Handle Storage (Keep fit for JSON, it can transfer format automatically).

Usage:

```javascript
setSessionStorage("test", "123");
const ret1 = getSessionStorage("test");
setLocalStorage("test", "123");
const ret2 = getLocalStorage("test");
console.log(ret1, ret2);

// or package in usage
const projectName = "mazey";
function mSetLocalStorage (key, value) {
  return setLocalStorage(`${projectName}_${key}`, value);
}

function mGetLocalStorage (key) {
  return getLocalStorage(`${projectName}_${key}`);
}
```

Output:

```text
123 123
```

### DOM

#### Class Helpers

Modify `class`.

Usage:

```javascript
const dom = document.querySelector("#box");

// Determine `class`
hasClass(dom, "test");
// Add `class`
addClass(dom, "test");
// Remove `class`
removeClass(dom, "test");
```

#### isValidCssSelector

Check whether a value is a CSS selector supported by the supplied query root.
Invalid selector syntax returns `false` instead of throwing.

```javascript
isValidCssSelector(".message > img"); // true
isValidCssSelector("["); // false
isValidCssSelector("", { allowEmpty: true }); // true
```

#### extractElementText

Extract normalized text from a cloned element without modifying the original
DOM. Images can contribute their `alt` text, and matching descendants can be
excluded.

```javascript
const message = document.querySelector(".message");
const text = extractElementText(message, {
  excludeSelector: ".message-actions",
});
```

#### addStyle

Add `<style>` in `<head>`.

Usage:

Example 1: Add the `<style>` with `id`, and repeated invoking will update the content instead of adding a new one.

```javascript
import { addStyle } from "mazey";

addStyle(
  "body { background-color: #333; }",
  { id: "test" }
);
```

Output:

```html
<style id="test">body { background-color: #333; }</style>
```

Example 2: Add the `<style>` without `id`, and repeated invoking will add a new one.

```javascript
import { addStyle } from "mazey";

addStyle("body { background-color: #444; }");
```

Output:

```html
<style>body { background-color: #444; }</style>
```

Example 3: Combine `genStyleString` and `addStyle` to add multiple styles at once.

```javascript
import { genStyleString, addStyle } from "mazey";

const xStyle = genStyleString(
  ".footer>.x-wish>a:first-child" +
  ",div.wish-flex>a[href^='https://github.com/chengchuu']" +
  ",.m-hide",
  [ "display: none" ]
);
const yStyle = genStyleString(
  ".footer>.y-wish:before",
  [
    `content: 'Copyright (c) chengchuu'`,
    "color: inherit",
    "padding-inline-start: var(--y-wish-1_5)",
    "padding-inline-end: var(--y-wish-1_5)",
    "padding-top: var(--y-wish-1)",
    "padding-bottom: var(--y-wish-1)",
  ]
);
addStyle(xStyle + yStyle, { id: "z-style" });
```

Output:

```html
<style id="z-style">.footer>.x-wish>a:first-child,div.wish-flex>a[href^='https://github.com/chengchuu'],.m-hide{display: none;}.footer>.y-wish:before{content: 'Copyright (c) chengchuu';color: inherit;padding-inline-start: var(--y-wish-1_5);padding-inline-end: var(--y-wish-1_5);padding-top: var(--y-wish-1);padding-bottom: var(--y-wish-1);}</style>
```

#### genStyleString

Generate the inline style string from the given parameters. The first parameter is the query selector, and the second parameter is the style array.

Usage:

```javascript
const ret1 = genStyleString(".a", [ "color:red" ]);
const ret2 = genStyleString("#b", [ "color:red", "font-size:12px" ]);
console.log(ret1);
console.log(ret2);
```

Output:

```text
.a{color:red;}
#b{color:red;font-size:12px;}
```

Example: Combine `genStyleString` and `addStyle` to add multiple styles at once.

```javascript
import { genStyleString, addStyle } from "mazey";

const xStyle = genStyleString(
  ".footer>.x-wish>a:first-child" +
  ",div.wish-flex>a[href^='https://github.com/chengchuu']" +
  ",.m-hide",
  [ "display: none" ]
);
const yStyle = genStyleString(
  ".footer>.y-wish:before",
  [
    `content: 'Copyright (c) chengchuu'`,
    "color: inherit",
    "padding-inline-start: var(--y-wish-1_5)",
    "padding-inline-end: var(--y-wish-1_5)",
    "padding-top: var(--y-wish-1)",
    "padding-bottom: var(--y-wish-1)",
  ]
);
addStyle(xStyle + yStyle, { id: "z-style" });
```

Output:

```html
<style id="z-style">.footer>.x-wish>a:first-child,div.wish-flex>a[href^='https://github.com/chengchuu'],.m-hide{display: none;}.footer>.y-wish:before{content: 'Copyright (c) chengchuu';color: inherit;padding-inline-start: var(--y-wish-1_5);padding-inline-end: var(--y-wish-1_5);padding-top: var(--y-wish-1);padding-bottom: var(--y-wish-1);}</style>
```

#### newLine

Make a new line of HTML.

Usage:

```javascript
const ret1 = newLine("a\nb\nc");
const ret2 = newLine("a\n\nbc");
console.log(ret1);
console.log(ret2);
```

Output:

```text
a<br />b<br />c
a<br /><br />bc
```

### Calculate and Formula

#### inRate

Hit probability (1% ~ 100%).

Usage:

```javascript
const ret = inRate(0.5); // 0.01 ~ 1 true/false
console.log(ret);
```

Output:

```text
true
```

Example: Test the precision.

```javascript
// Test
let trueCount = 0;
let falseCount = 0;
new Array(1000000).fill(0).forEach(() => {
  if (inRate(0.5)) {
    trueCount++;
  } else {
    falseCount++;
  }
});
console.log(trueCount, falseCount); // 499994 500006
```

#### longestComSubstring

Computes the longest common substring of two strings.

Usage:

```javascript
const ret = longestComSubstring("fish", "finish");
console.log(ret);
```

Output:

```text
3
```

#### longestComSubsequence

Computes the longest common subsequence of two strings.

Usage:

```javascript
const ret = longestComSubsequence("fish", "finish");
console.log(ret);
```

Output:

```text
4
```

### Browser Information

#### resolveThemePreference

Resolve a project-specific website theme preference without applying it to the
page. Resolution checks a `light` or `dark` URL query override, persisted
`system`/`light`/`dark` storage, the current system color scheme, and finally a
`light` fallback, in that order.

```javascript
const theme = resolveThemePreference({
  storageKey: "MY_WEBSITE_THEME",
  url: "https://example.com/?theme=dark",
});

console.log(theme);
```

Output:

```text
{
  preference: "dark",
  resolvedTheme: "dark",
  displayName: "Dark",
  source: "query"
}
```

`preference` is the selected `system`, `light`, or `dark` value, while
`resolvedTheme` is always the effective `light` or `dark` theme. The resolver
is safe during SSR, tolerates unavailable browser storage and media queries,
and does not mutate the DOM or write to storage.

#### setThemePreference

Persist an exact `system`, `light`, or `dark` preference under a
project-specific storage key. The function returns `false` when storage is
unavailable or rejects the write; it does not apply the theme to the page.

```javascript
const stored = setThemePreference({
  storageKey: "MY_WEBSITE_THEME",
  preference: "dark",
});
```

Output: `true`

#### resolveLanguagePreference

Resolve a project-configured UI language without applying translations or
changing the document. Resolution checks the `lang` URL query, exact persisted
canonical values, browser languages, and the configured fallback, in that
order.

```javascript
const languages = [
  { value: "en", label: "English", aliases: ["en-US", "en-GB"] },
  { value: "zh-CN", label: "简体中文", aliases: ["zh-Hans"] },
  { value: "ja", label: "日本語", aliases: ["ja-JP"] },
];

const language = resolveLanguagePreference({
  storageKey: "MY_WEBSITE_LANGUAGE",
  languages,
  fallback: "en",
});
```

Possible result:

```text
{
  preference: "system",
  resolvedLanguage: "ja",
  displayName: "System",
  resolvedDisplayName: "日本語",
  source: "system"
}
```

The result separates the selected `preference`, which may be `system`, from
the concrete `resolvedLanguage`. Matching is case-insensitive, treats `_` as
`-`, supports explicit aliases, and maps regional browser locales to a base
language only when that base language is configured explicitly. It does not
infer sibling regional variants. The resolver is SSR-safe and never writes
storage or mutates the DOM.

#### setLanguagePreference

Persist `system` or an exact configured canonical language. Aliases are not
accepted for writes, and the function returns `false` when storage is
unavailable or rejects the write.

```javascript
const stored = setLanguagePreference({
  storageKey: "MY_WEBSITE_LANGUAGE",
  languages,
  preference: "ja",
});
```

Output: `true`

#### getBrowserInfo

Browser Information

Usage:

```javascript
const ret = getBrowserInfo();
console.log(ret);
```

Output:

```text
{"engine":"webkit","engineVs":"537.36","platform":"desktop","supporter":"chrome","supporterVs":"85.0.4183.121","system":"windows","systemVs":"10"}
```

Results:

| Attribute | Description | Type | Values |
| :------------ | :------------ | :------------ | :------------ |
| **system** | System | string | android, ios, windows, macos, linux |
| systemVs | System version | string | Windows: 2000, xp, 2003, vista, 7, 8, 8.1, 10 macOS: ... |
| platform | Platform | string | desktop, mobile |
| engine | Engine | string | webkit, gecko, presto, trident |
| engineVs | Engine version | string | - |
| supporter | Supporter | string | edge, opera, chrome, safari, firefox, iexplore |
| supporterVs | Supporter version | string | - |
| shell | Shell | string | (Optional) wechat, qq_browser, qq_app, uc, 360, 2345, sougou, liebao, maxthon, bilibili |
| shellVs | Shell version | string | (Optional) 20/... |
| appleType | Apple device type | string | (Optional) ipad, iphone, ipod, iwatch |

Example: Determine the environment of the mobile QQ.

```javascript
const { system, shell } = getBrowserInfo();
const isMobileQQ = ["android", "ios"].includes(system) && ["qq_browser", "qq_app"].includes(shell);
```

#### isSafePWAEnv

Detect whether the current browser document provides the minimum prerequisites
for PWA functionality that synchronous JavaScript can identify: a secure
context, Service Worker API support, and, by default, a web app manifest link
with a non-empty `href`. Pass `{ requireManifest: false }` when only secure
Service Worker eligibility is needed, or `{ scope: "/app/" }` to require the
current page to be inside a same-origin path scope.

This check does not validate or request the manifest, verify service worker
registration, determine whether the app is installed, or guarantee that an
installation prompt is available. Browser-specific installation policies may
impose additional requirements.

Usage:

```javascript
const ret = isSafePWAEnv();
console.log(ret);
```

Output:

```text
true
```

#### isStandalonePWA

Detect standard standalone display mode with the iOS Safari
`navigator.standalone` fallback. This is a presentation hint, not proof that
the app is installed or controlled by a service worker.

```javascript
if (isStandalonePWA()) {
  document.querySelector("[data-install-help]")?.remove();
}
```

### Web Performance

#### getPerformance

Get page load time(`PerformanceNavigationTiming`).

This function uses the [`PerformanceNavigationTiming`](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming) API to get page load time data.
The `PerformanceNavigationTiming` API provides more accurate and detailed information about page load time than the deprecated [`PerformanceTiming`](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming) API.

Usage:

```javascript
// `camelCase：false` (Default) Return underline(`a_b`) data.
// `camelCase：true` Return hump(`aB`) data.
getPerformance()
 .then(res => {
  console.log(JSON.stringify(res));
 })
 .catch(console.error);
```

Output:

```text
{"source":"PerformanceNavigationTiming","os":"others","os_version":"","device_type":"pc","network":"4g","screen_direction":"","unload_time":0,"redirect_time":0,"dns_time":0,"tcp_time":0,"ssl_time":0,"response_time":2,"download_time":2,"first_paint_time":288,"first_contentful_paint_time":288,"dom_ready_time":0,"onload_time":0,"white_time":0,"render_time":0,"decoded_body_size":718,"encoded_body_size":718}
```

Results:

| Attribute | Description | Type | Values |
| :------------ | :------------ | :------------ | :------------ |
| dns_time | DNS Lookup | number | domainLookupEnd - domainLookupStart |
| tcp_time | Connection Negotiation | number | connectEnd - connectStart |
| response_time | Requests and Responses | number | responseStart - requestStart |
| white_time | White Screen | number | responseStart - navigationStart |
| dom_ready_time | Dom Ready | number | domContentLoadedEventStart - navigationStart |
| onload_time | Onload | number | loadEventStart - navigationStart |
| render_time | EventEnd | number | loadEventEnd -navigationStart |
| unload_time | Unload | number | (Optional) unloadEventEnd - unloadEventStart |
| redirect_time | Redirect | number | (Optional) redirectEnd - redirectStart |
| ssl_time | SSL | number | (Optional) connectEnd - secureConnectionStart |
| download_time | Download | number | (Optional) responseEnd - responseStart |

### Debug

#### genCustomConsole

Custom console printing (`console`).

Usage:

```javascript
const myConsole = genCustomConsole("MazeyLog:");
myConsole.log("I am string.");
myConsole.info("I am boolean.", true);
myConsole.info("I am number.", 123, 456);
myConsole.info("I am object.", { a: 123, b: 456});
```

Output:

```text
MazeyLog: I am string.
MazeyLog: I am boolean. true
MazeyLog: I am number. 123 456
MazeyLog: I am object. {a: 123, b: 456}
```

## Contributing

### Development Environment

| Dependency | Version  |
|------------|----------|
| Node.js    | v22.21.1 |
| TypeScript | v5.1.6   |

### Scripts

| Command               | Purpose                                                         |
| --------------------- | --------------------------------------------------------------- |
| `npm install`         | Install development dependencies.                               |
| `npm run dev`         | Start the website and playground development server.            |
| `npm run build`       | Build the publishable package files.                            |
| `npm test`            | Run the Jest test suite.                                        |
| `npm run docs`        | Build and validate the complete GitHub Pages artifact.          |
| `npm run preview`     | Run the full type, lint, build, test, and documentation checks. |
| `npm run pwa:preview` | Serve the production Pages artifact at the `/mazey/` base path. |

### Returns

| Values    | Description                              | Type    |
| :-------- | :--------------------------------------- | :------ |
| ok        | The operation was successful.            | string  |
| loaded    | Some assets have been loaded.            | string  |
| failed    | An error occurred.                       | string  |
| defined   | The value is defined.                    | string  |
| undefined | The value is undefined.                  | string  |
| timeout   | The operation timed out.                 | string  |
| true      | The value is true.                       | boolean |
| false     | The value is false.                      | boolean |

## License

This software is released under the terms of the [MIT license](https://github.com/chengchuu/mazey/blob/main/LICENSE).
