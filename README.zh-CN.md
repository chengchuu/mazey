[English](https://github.com/chengchuu/mazey/blob/main/README.md) | 简体中文

# Mazey

[![npm version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/mazey
[npm-url]: https://npmjs.org/package/mazey
[l-image]: https://img.shields.io/npm/l/mazey
[l-url]: https://github.com/chengchuu/mazey

Mazey 是一个面向日常前端开发的函数工具库。前端生态已有许多优秀的库，但项目通常仍会创建 `utils.js` 或 `common.js`，用于存放通用函数。在多个项目之间重复复制相似函数既烦琐，也难以维护。因此，我创建了 Mazey，并会持续更新，为前端开发提供可靠的通用工具。

## 安装

通过 [npm](https://www.npmjs.com/package/mazey) 安装 Mazey。

```bash
npm install mazey
```

通过内容分发网络 (Content Delivery Network，CDN) 使用 Mazey。

```html
<script src="https://cdn.jsdelivr.net/npm/mazey@latest/lib/mazey.min.js"></script>
```

你也可以下载 [jsdelivr/lib/mazey.min.js](https://cdn.jsdelivr.net/npm/mazey@latest/lib/mazey.min.js)，并自行托管该文件。

## 浏览器支持

Mazey 支持 Chrome 109 及以上版本、Edge 109 及以上版本、Firefox 115 及以上版本、Safari 16.4 及以上版本、iOS Safari 16.4 及以上版本、Android Chrome 109 及以上版本，以及 Samsung Internet 21 及以上版本。软件包输出可能包含 ES2022 语法，并且不包含 JavaScript polyfill。Internet Explorer、Opera Mini、KaiOS、旧版 Android Browser 和更早的浏览器版本不在支持范围内。

开发和持续集成环境使用 Node.js 22。Mazey 未声明 Node.js 运行时兼容范围。

## 使用

下面的示例使用一个函数，判断某个值是否适合参与常规计算和比较。

通过 [npm](https://www.npmjs.com/package/mazey) 导入。

```javascript
import { isNumber } from "mazey";

const x = 123;
const y = "abc";
const z = Infinity;
isNumber(x); // 输出: true
isNumber(y); // 输出: false
isNumber(z, { isInfinityAsNumber: true }); // 输出: true
```

通过 CDN 导入。

```html
<script src="https://cdn.jsdelivr.net/npm/mazey@latest/lib/mazey.min.js"></script>
<script>
  const x = 123;
  mazey.isNumber(x); // 输出: true
</script>
```

## API 示例

下面列出一些手动维护的 API (应用程序编程接口) 示例。完整内容请查看
[完整 API 文档](https://chengchuu.github.io/mazey/api/)。

### 目录

<!-- toc - begin -->
- [目录](#目录)
- [加载资源](#加载资源)
  - [loadScript](#loadscript)
  - [loadScriptIfUndefined](#loadscriptifundefined)
  - [loadCSS](#loadcss)
  - [loadImage](#loadimage)
  - [windowLoaded](#windowloaded)
- [通用工具](#通用工具)
  - [isNumber](#isnumber)
  - [isJSONString](#isjsonstring)
  - [isValidData](#isvaliddata)
  - [genRndNumString](#genrndnumstring)
  - [formatDate](#formatdate)
  - [isValidDate](#isvaliddate)
  - [generateCalendarVersion](#generatecalendarversion)
  - [getDateDifference](#getdatedifference)
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
- [存储](#存储)
  - [Cookie 工具](#cookie-工具)
  - [Storage 工具](#storage-工具)
- [DOM](#dom)
  - [Class 工具](#class-工具)
  - [addStyle](#addstyle)
  - [genStyleString](#genstylestring)
  - [newLine](#newline)
- [计算与公式](#计算与公式)
  - [calculateAspectRatio](#calculateaspectratio)
  - [calculateCAGR](#calculatecagr)
  - [inRate](#inrate)
  - [longestComSubstring](#longestcomsubstring)
  - [longestComSubsequence](#longestcomsubsequence)
- [浏览器信息](#浏览器信息)
  - [detectVisitorType](#detectvisitortype)
  - [isPhone](#isphone)
  - [isDesktop](#isdesktop)
  - [isTablet](#istablet)
  - [getBrowserInfo](#getbrowserinfo)
  - [isSafePWAEnv](#issafepwaenv)
  - [isStandalonePWA](#isstandalonepwa)
- [Web 性能](#web-性能)
  - [getPerformance](#getperformance)
- [调试](#调试)
  - [genCustomConsole](#gencustomconsole)
- [开发环境](#开发环境)
- [脚本](#脚本)
- [返回值](#返回值)
<!-- toc - end -->

### 加载资源

#### loadScript

从服务器加载并执行 JavaScript 文件。

用法:

```javascript
loadScript(
    "http://example.com/static/js/plugin-2.1.1.min.js",
    {
      id: "iamid", // 可选，script 的 ID，默认不设置
      timeout: 5000, // 可选，超时时间，默认 `5000`
    }
  )
  .then(
    res => {
      console.log(`加载 JavaScript 脚本: ${res}`);
    }
  )
  .catch(
    err => {
      console.error(`加载 JavaScript 脚本: ${err.message}`);
    }
  );
```

输出:

```text
加载 JavaScript 脚本: loaded
```

#### loadScriptIfUndefined

当脚本尚未加载时，函数会通过指定 URL (统一资源定位符) 加载脚本。该函数使用 `window["attribute"]` 判断脚本是否已定义。

用法:

```javascript
loadScriptIfUndefined("xyz", "https://example.com/lib/xyz.min.js")
  .then(() => {
    console.log("xyz 已加载。");
  })
  .catch(err => {
    console.log("xyz 加载失败。", err);
  });
```

输出:

```text
xyz 已加载。
```

#### loadCSS

从服务器加载 CSS 文件。

用法:

```javascript
loadCSS(
    "https://example.com/path/example.css",
    {
      id: "iamid", // 可选，link 的 ID，默认不设置
    }
  )
  .then(
    res => {
      console.log(`CSS 加载成功: ${res}`);
    }
  )
  .catch(
    err => {
      console.error(`CSS 加载失败: ${err.message}`)
    }
  );
```

输出:

```text
CSS 加载成功: loaded
```

#### loadImage

从指定 URL 加载图片。

目标图片会在后台加载。加载失败时，Promise (承诺对象) 会以错误对象进入 `reject` 状态。加载成功时，Promise 会以图片对象进入 `resolve` 状态。该方法适合预加载图片，也可以利用浏览器缓存实现图片懒加载。

该方法不会把图片添加到文档对象模型 (Document Object Model，DOM)。

用法:

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

检查页面是否成功加载。即使浏览器已经触发 `load` 事件，该函数仍能正确处理。

用法:

```javascript
windowLoaded()
  .then(res => {
    console.log(`加载成功: ${res}`);
  })
  .catch(err => {
    console.log(`加载超时或失败: ${err.message}`);
  });
```

输出:

```text
加载成功: load
```

### 通用工具

#### isNumber

判断某个值是否为有效数字。

用法:

```javascript
const ret1 = isNumber(123);
const ret2 = isNumber("123");
// 默认情况下，NaN 和 Infinity 不是有效数字
const ret3 = isNumber(Infinity);
const ret4 = isNumber(Infinity, { isInfinityAsNumber: true });
const ret5 = isNumber(NaN);
const ret6 = isNumber(NaN, { isNaNAsNumber: true, isInfinityAsNumber: true });
console.log(ret1, ret2, ret3, ret4, ret5, ret6);
```

输出:

```text
true false false true false true
```

#### isJSONString

判断字符串是否为有效的 JSON 字符串。

用法:

```javascript
const ret1 = isJSONString(`['a', 'b', 'c']`);
const ret2 = isJSONString(`["a", "b", "c"]`);
console.log(ret1);
console.log(ret2);
```

输出:

```text
false
true
```

#### isValidData

判断指定路径中的数据是否有效，并且是否等于预期值。

用法:

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

输出:

```text
isValidDataResA: false
isValidDataResB: true
isValidDataResC: false
```

#### genRndNumString

生成指定长度的随机数字字符串。例如，`genRndNumString(7)` 可能返回 `"7658495"`。

用法:

```javascript
const ret1 = genRndNumString(4);
const ret2 = genRndNumString(7);
console.log(ret1);
console.log(ret2);
```

输出:

```text
9730
2262490
```

#### formatDate

按照指定格式返回本地日期字符串。`HH` 表示 24 小时制，`hh` 表示 12 小时制，`a` 表示 `AM` 或 `PM`。

用法:

```javascript
const ret1 = formatDate();
const ret2 = formatDate("Tue Jan 11 2022 14:12:26 GMT+0800 (China Standard Time)", "yyyy-MM-dd hh:mm:ss a");
const ret3 = formatDate(1641881235000, "yyyy-MM-dd hh:mm:ss a");
const ret4 = formatDate(new Date(2014, 1, 11), "MM/dd/yyyy");
console.log("默认 formatDate 值:", ret1);
console.log("字符串 formatDate 值:", ret2);
console.log("数字 formatDate 值:", ret3);
console.log("Date formatDate 值:", ret4);
```

输出:

```text
默认 formatDate 值: 2023-01-11
字符串 formatDate 值: 2022-01-11 02:12:26 PM
数字 formatDate 值: 2022-01-11 02:07:15 PM
Date formatDate 值: 02/11/2014
```

#### isValidDate

检查未知值是否表示有效日期。函数接受 `Date` 实例、有限的毫秒时间戳、受支持的本地日期字符串，以及带有 `Z` 或数字时区偏移的 ISO 8601 字符串。

字符串格式包括 `YYYY-MM-DD`、`YYYY-MM-DD HH:mm[:ss]` 和 `YYYY-MM-DDTHH:mm[:ss]`。使用 `T` 分隔的日期时间还可以包含 `Z` 或 `+HH:mm`、`-HH:mm` 时区偏移。带时区的字符串可以包含 1～3 位毫秒数字。

函数会把结构化字符串解析为数字组件，并执行严格校验。因此，`"2020-02-30"` 等无效日历日期不会被转换为其他日期。

用法:

```javascript
const ret1 = isValidDate(1577877720000);
const ret2 = isValidDate("2020-01-01 11:22");
const ret3 = isValidDate("2020-02-30");
const ret4 = isValidDate(new Date("invalid"));
console.log(ret1, ret2, ret3, ret4);
```

输出:

```text
true true false false
```

#### generateCalendarVersion

按照本地时间生成日历版本字符串。其概念格式为 `yyyy.MMdd.HHmmss`。函数会删除每个数字段的前导零。处理后的结果兼容语义化版本 (SemVer)。

在系统时钟正常前进时，版本会随日期和时间递增。该函数有意使用本地时间。因此，手动回拨时钟或夏令时回退可能生成更小的版本。

用法:

```javascript
const version = generateCalendarVersion(
  new Date(2026, 6, 11, 7, 40, 35)
);
console.log(version);
```

输出:

```text
2026.711.74035
```

#### getDateDifference

计算两个日期或时间戳之间的差值。默认返回完整秒数。`type: "d"` 返回完整天数，`type: "text"` 返回由天、小时、分钟和秒组成的英文文本。文本会省略值为 `0` 的单位。总时长为零时，函数返回 `"0 seconds"`。

`YYYY-MM-DD HH:mm:ss` 格式的字符串按本地时间解析。其他日期字符串使用运行环境原生的 `Date` 解析器。需要跨环境稳定解析时，请使用时间戳，或使用包含明确时区的 ISO 8601 字符串。结束时间早于开始时间，或任一日期无效时，函数返回空字符串。

用法:

```javascript
const days = getDateDifference(0, 90061000, { type: "d" });
const text = getDateDifference(0, 90061000, { type: "text" });
const compactText = getDateDifference(0, 90060000, { type: "text" });
const dateStringDays = getDateDifference(
  "2020-03-28 00:09:27",
  "2023-04-18 10:54:00",
  { type: "d" }
);
console.log(days);
console.log(text);
console.log(compactText);
console.log(dateStringDays);
```

输出:

```text
1
1 day 1 hour 1 minute 1 second
1 day 1 hour 1 minute
1116
```

`getFriendlyInterval` 是 `getDateDifference` 的兼容别名。新代码建议使用 `getDateDifference`。

#### formatDurationFromMs

将毫秒时长转换为适用的最大单位，包括秒、分钟、小时和天。结果最多保留 1 位小数。负数和非有限值返回 `"0 seconds"`。

用法:

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

输出:

```text
0.5 seconds
1.5 minutes
1 hour
1.5 days
```

#### deepCopy

深度复制或克隆对象。

用法:

```javascript
const ret1 = deepCopy(["a", "b", "c"]);
const ret2 = deepCopy("abc");
console.log(ret1);
console.log(ret2);
```

输出:

```text
["a", "b", "c"]
abc
```

#### deepFreeze

递归冻结对象及其可枚举嵌套值。原始值和已经冻结的对象会原样返回。函数支持包含循环引用的对象。

用法:

```javascript
const config = deepFreeze({
  api: {
    timeout: 5000,
  },
});

console.log(Object.isFrozen(config));
console.log(Object.isFrozen(config.api));
```

输出:

```text
true
true
```

#### debounce

创建防抖函数。

用法:

```javascript
const foo = debounce(() => {
  console.log("防抖函数会在 1,000 毫秒内仅执行一次，等待期间的其他调用不会生效。");
}, 1000, true);
```

#### throttle

创建节流函数。

用法:

```javascript
const foo = throttle(() => {
  console.log("在每个 1,000 毫秒等待周期内，该函数最多执行一次。");
}, 1000, { leading: true });
```

参考资料: [Lodash](https://lodash.com/docs/4.17.15#throttle)

#### convertCamelToKebab

将驼峰命名转换为短横线命名。

用法:

```javascript
const ret1 = convertCamelToKebab("ABC");
const ret2 = convertCamelToKebab("aBC");
console.log(ret1);
console.log(ret2);
```

输出:

```text
a-b-c
a-b-c
```

#### convertCamelToUnder

将驼峰命名转换为下划线命名。

用法:

```javascript
const ret1 = convertCamelToUnder("ABC");
const ret2 = convertCamelToUnder("aBC");
console.log(ret1);
console.log(ret2);
```

输出:

```text
a_b_c
a_b_c
```

#### toJavaScriptGlobalName

将文本转换为确定的、全大写的 ASCII JavaScript 标识符。该标识符适合作为 IIFE 全局名称。函数会将无效字符替换为下划线。结果以数字开头时，函数会添加下划线前缀。

```javascript
const globalName = toJavaScriptGlobalName("@scope/my-library");
console.log(globalName);
```

输出:

```text
_SCOPE_MY_LIBRARY
```

### URL

#### getQueryParam

从当前 Web URL 的查询字符串 (`location.search`) 中获取参数值。

用法:

```javascript
// http://example.com/?t1=1&t2=2&t3=3&t4=4#2333
// ?t1=1&t2=2&t3=3&t4=4
const p1 = getQueryParam("t3");
const p2 = getQueryParam("t4");
console.log(p1, p2);
```

输出:

```text
3 4
```

#### getUrlParam

从输入 URL 中获取指定查询参数的值。

用法:

```javascript
const p1 = getUrlParam("https://example.com/?t1=1&t2=2&t3=3&t4=4", "t3");
const p2 = getUrlParam("https://example.com/?t1=1&t2=2&t3=3&t4=4", "t4");
console.log(p1, p2);
```

输出:

```text
3 4
```

#### getHashQueryParam

从当前 Web URL 的哈希字符串 (`location.hash`) 中获取参数值。

用法:

```javascript
// http://example.com/?#2333?t1=1&t2=2&t3=3&t4=4
// #2333?t1=1&t2=2&t3=3&t4=4
const p1 = getHashQueryParam("t3");
const p2 = getHashQueryParam("t4");
console.log(p1, p2);
```

输出:

```text
3 4
```

#### getDomain

获取 URL 的域名，也可以组合返回其他部分。

用法:

```javascript
const ret1 = getDomain("http://example.com/?t1=1&t2=2&t3=3&t4=4");
const ret2 = getDomain("http://example.com/test/thanks?t1=1&t2=2&t3=3&t4=4", ["hostname", "pathname"]);
const ret3 = getDomain("http://example.com:7890/test/thanks", ["hostname"]);
const ret4 = getDomain("http://example.com:7890/test/thanks", ["host"]); // 包含端口
const ret5 = getDomain("http://example.com:7890/test/thanks", ["origin"]);
const ret6 = getDomain("http://example.com:7890/test/thanks?id=1", ["origin", "pathname", "search"]);
console.log(ret1);
console.log(ret2);
console.log(ret3);
console.log(ret4);
console.log(ret5);
console.log(ret6);
```

输出:

```text
example.com
example.com/test/thanks
example.com
example.com:7890
http://example.com:7890
http://example.com:7890/test/thanks?id=1
```

#### updateQueryParam

更新输入 URL 中的查询参数值。

用法:

```javascript
const ret1 = updateQueryParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t3", "three");
const ret2 = updateQueryParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t4", "four");
console.log(ret1);
console.log(ret2);
```

输出:

```text
http://example.com/?t1=1&t2=2&t3=three&t4=4
http://example.com/?t1=1&t2=2&t3=3&t4=four
```

#### isValidUrl

检查给定字符串是否为有效 URL，包括使用其他协议的 URL。

用法:

```javascript
const ret1 = isValidUrl("https://www.example.com");
const ret2 = isValidUrl("http://example.com/path/exx/ss");
const ret3 = isValidUrl("https://www.example.com/?q=hello&age=24#world");
const ret4 = isValidUrl("http://www.example.com/#world?id=9");
const ret5 = isValidUrl("ftp://example.com");
console.log(ret1, ret2, ret3, ret4, ret5);
```

输出:

```text
true true true true true
```

如果只需检查 HTTP 或 HTTPS URL，建议使用 `isValidHttpUrl`。`isValidUrl` 会匹配所有协议 URL，包括 FTP 和其他非 HTTP 协议。

#### isValidHttpUrl

检查给定字符串是否为有效的 HTTP 或 HTTPS URL。

用法:

```javascript
const ret1 = isValidHttpUrl("https://www.example.com");
const ret2 = isValidHttpUrl("http://example.com/path/exx/ss");
const ret3 = isValidHttpUrl("https://www.example.com/?q=hello&age=24#world");
const ret4 = isValidHttpUrl("http://www.example.com/#world?id=9");
const ret5 = isValidHttpUrl("ftp://example.com");
console.log(ret1, ret2, ret3, ret4, ret5);
```

输出:

```text
true true true true false
```

#### parseGitHubRepository

解析 GitHub 仓库简写、SCP 格式或支持的 Git 传输 URL，并返回规范的仓库标识信息。

```javascript
const repository = parseGitHubRepository("git@github.com:acme/widget.git");
console.log(JSON.stringify(repository));
```

输出:

```text
{"owner":"acme","name":"widget","slug":"acme/widget","url":"https://github.com/acme/widget"}
```

### 存储

#### Cookie 工具

操作 Cookie。

用法:

```javascript
setCookie("test", "123", 30, "example.com"); // 键、值、有效天数、域名
const ret = getCookie("test");
console.log(ret);
```

输出:

```text
123
```

#### Storage 工具

在 Web Storage 中存储 JSON 序列化值，并在读取时解析这些值。

用法:

```javascript
setSessionJSON("preferences", { theme: "dark" });
const sessionValue = getSessionJSON("preferences");
setLocalJSON("recentItems", [ "one", "two" ]);
const localValue = getLocalJSON("recentItems");
console.log({ sessionValue, localValue });

// 也可以按项目封装键名。
const projectName = "mazey";
function mSetLocalStorage (key, value) {
  return setLocalJSON(`${projectName}_${key}`, value);
}

function mGetLocalStorage (key) {
  return getLocalJSON(`${projectName}_${key}`);
}
```

输出:

```text
{
  sessionValue: { theme: "dark" },
  localValue: [ "one", "two" ]
}
```

`setSessionStorage`、`getSessionStorage`、`setLocalStorage` 和
`getLocalStorage` 是对应 `JSON` 工具的弃用别名。

### DOM

#### Class 工具

操作元素的 `class`。

用法:

```javascript
const dom = document.querySelector("#box");

// 判断 class
hasClass(dom, "test");
// 添加 class
addClass(dom, "test");
// 删除 class
removeClass(dom, "test");
```

#### addStyle

在 `<head>` 中添加 `<style>` 元素。

用法:

示例 1: 添加带有 `id` 的 `<style>`。重复调用会更新内容，不会添加新元素。

```javascript
import { addStyle } from "mazey";

addStyle(
  "body { background-color: #333; }",
  { id: "test" }
);
```

输出:

```html
<style id="test">body { background-color: #333; }</style>
```

示例 2: 添加不带 `id` 的 `<style>`。重复调用会添加新元素。

```javascript
import { addStyle } from "mazey";

addStyle("body { background-color: #444; }");
```

输出:

```html
<style>body { background-color: #444; }</style>
```

示例 3: 组合使用 `genStyleString` 和 `addStyle`，一次添加多条样式。

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

输出:

```html
<style id="z-style">.footer>.x-wish>a:first-child,div.wish-flex>a[href^='https://github.com/chengchuu'],.m-hide{display: none;}.footer>.y-wish:before{content: 'Copyright (c) chengchuu';color: inherit;padding-inline-start: var(--y-wish-1_5);padding-inline-end: var(--y-wish-1_5);padding-top: var(--y-wish-1);padding-bottom: var(--y-wish-1);}</style>
```

#### genStyleString

根据参数生成样式字符串。第一个参数是查询选择器，第二个参数是样式数组。

用法:

```javascript
const ret1 = genStyleString(".a", [ "color:red" ]);
const ret2 = genStyleString("#b", [ "color:red", "font-size:12px" ]);
console.log(ret1);
console.log(ret2);
```

输出:

```text
.a{color:red;}
#b{color:red;font-size:12px;}
```

下面的示例组合使用 `genStyleString` 和 `addStyle`，一次添加多条样式。

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

输出:

```html
<style id="z-style">.footer>.x-wish>a:first-child,div.wish-flex>a[href^='https://github.com/chengchuu'],.m-hide{display: none;}.footer>.y-wish:before{content: 'Copyright (c) chengchuu';color: inherit;padding-inline-start: var(--y-wish-1_5);padding-inline-end: var(--y-wish-1_5);padding-top: var(--y-wish-1);padding-bottom: var(--y-wish-1);}</style>
```

#### newLine

把文本中的换行符转换为 HTML 换行元素。

用法:

```javascript
const ret1 = newLine("a\nb\nc");
const ret2 = newLine("a\n\nbc");
console.log(ret1);
console.log(ret2);
```

输出:

```text
a<br />b<br />c
a<br /><br />bc
```

### 计算与公式

#### calculateAspectRatio

根据正安全整数形式的宽度和高度，计算精确的最简宽高比。函数使用最大公约数约分，并使用小写 `x` 连接结果。函数不会将结果近似为常见的图片或视频宽高比。

```javascript
import { calculateAspectRatio } from "mazey";

const portraitRatio = calculateAspectRatio(900, 1200);
const landscapeRatio = calculateAspectRatio(1920, 1080);

console.log(portraitRatio);
console.log(landscapeRatio);
```

输出：

```text
3x4
16x9
```

例如，`calculateAspectRatio(3440, 1440)` 返回数学意义上精确的 `"43x18"`，而不是近似标签 `"21x9"`。无效或不安全的整数尺寸会抛出 `TypeError`。零或负数尺寸会抛出 `RangeError`。

#### calculateCAGR

根据投资的开始日期、结束日期和整个周期的总回报率，计算复合年增长率（Compound Annual Growth Rate，CAGR）。

```text
CAGR = (1 + totalReturnRate)^(365 / durationInDays) - 1
```

日期可以是支持的结构化日期字符串、毫秒时间戳或 `Date` 实例。计算使用精确的毫秒间隔，包括日期中的时分秒，并固定以 365 天作为一个财务年度。

数值输入使用十进制比率，因此 `0.202` 表示 `20.2%`。字符串输入使用百分比数值，因此 `"20.2%"` 和 `"20.2"` 都表示 `20.2%`；也支持 `"2.02e1%"` 这类严格的科学记数法。返回的 CAGR 是未经舍入的十进制比率。

```javascript
import { calculateCAGR, floatToPercent } from "mazey";

const cagr = calculateCAGR(
  "2022-04-01",
  "2025-10-01",
  "20.2%"
);

console.log({
  cagr,
  percentage: floatToPercent(cagr, 2),
});
```

可能的输出：

```text
{
  cagr: 0.053908...,
  percentage: "5.39%"
}
```

等效的十进制数值调用如下：

```javascript
calculateCAGR(
  "2022-04-01",
  "2025-10-01",
  0.202
);
```

日期字符串遵循 Mazey 的严格日期校验规则。无效日期、格式错误或非有限的回报率，以及没有递增的日期范围都会抛出错误。解析后的总回报率必须大于 `-1`，因为 `-1` 表示本金完全损失，此时 CAGR 没有定义。

#### inRate

按照指定概率返回命中结果。有效概率范围为 1%～100%。

用法:

```javascript
const ret = inRate(0.5); // 0.01～1，返回 true 或 false
console.log(ret);
```

输出:

```text
true
```

下面的示例测试概率精度。

```javascript
// 测试
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

计算两个字符串的最长公共子串长度。

用法:

```javascript
const ret = longestComSubstring("fish", "finish");
console.log(ret);
```

输出:

```text
3
```

#### longestComSubsequence

计算两个字符串的最长公共子序列长度。

用法:

```javascript
const ret = longestComSubsequence("fish", "finish");
console.log(ret);
```

输出:

```text
4
```

### 浏览器信息

#### detectVisitorType

此函数使用保守的启发式规则，将访问者分类为 `"crawler"`、`"automation"` 或 `"unknown"`。函数首先检查一组明确的 User-Agent 令牌。这些令牌来自爬虫、索引、SEO、AI 抓取和链接预览客户端。随后，函数检查显式的自动化 User-Agent 令牌，以及 `navigator.webdriver === true`。

省略参数时，函数会安全地读取 `navigator.userAgent`。也可以传入明确的 User-Agent 字符串。此方式适合分析已捕获的 User-Agent、编写确定性测试或在服务端分类。SSR 或 Node.js 环境没有 `navigator` 时，默认返回 `"unknown"`。此时仍可传入明确的 User-Agent 进行分类。

```javascript
const visitorType = detectVisitorType();

console.log(visitorType);
```

可能的输出：

```text
unknown
```

下面的示例传入爬虫 User-Agent：

```javascript
const visitorType = detectVisitorType(
  "Mozilla/5.0 (compatible; Googlebot/2.1)"
);

console.log(visitorType);
```

输出：

```text
crawler
```

`"unknown"` 仅表示没有检测到受支持的爬虫或浏览器自动化信号。User-Agent 可以伪造，WebDriver 信号也可以隐藏或修改。因此，分类可能出现误判或漏判。

> `unknown` 不表示访问者已经通过真人验证。此函数只使用浏览器端启发式规则，不能作为安全边界。请勿单独使用此结果进行身份验证、授权、支付决策、速率限制、欺诈防范或访问控制。验证真实爬虫通常需要服务端请求信息，以及服务提供商规定的验证流程。

#### isPhone

检查当前浏览器是否代表手机或手持设备。此结果不包含平板电脑。

```javascript
const result = isPhone();

console.log(result);
```

#### isDesktop

检查当前浏览器是否代表桌面或笔记本电脑。触摸屏 Windows 笔记本电脑仍归类为桌面设备。

```javascript
const result = isDesktop();

console.log(result);
```

#### isTablet

检查当前浏览器是否代表平板电脑。此函数支持常规 iPad 和 iPadOS 桌面模式。他还支持不含 `Mobile` 令牌的 Android User-Agent，以及独立的 `Tablet` 令牌。

```javascript
const result = isTablet();

console.log(result);
```

可以传入 User-Agent 字符串。此方式适合确定性测试或服务端分类。

```javascript
const result = isTablet(
  "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36"
);

console.log(result);
```

输出：

```text
true
```

对于已识别的设备，这 3 个函数使用互斥的设备形态分类：

| 设备             | `isPhone` | `isDesktop` | `isTablet` |
|:-----------------|:-----------|:------------|:-----------|
| iPhone           | `true`     | `false`     | `false`    |
| Android 手机     | `true`     | `false`     | `false`    |
| iPad             | `false`    | `false`     | `true`     |
| Android 平板电脑 | `false`    | `false`     | `true`     |
| Windows 笔记本   | `false`    | `true`      | `false`    |
| MacBook          | `false`    | `true`      | `false`    |
| 未知设备         | `false`    | `false`     | `false`    |

每个函数都接受可选的 User-Agent 字符串。显式输入不会读取当前浏览器的平台或触摸信号。SSR 环境无法读取浏览器信号且没有显式输入时，这 3 个函数均返回 `false`。

设备分类使用可伪造的启发式规则，不读取视口宽度。这些函数不能作为安全 API，也不能替代响应式 CSS 和功能检测。`getBrowserInfo().platform` 保留原有的宽泛分类，并将 iOS 和 Android 报告为 `"mobile"`。新函数提供更具体的手机、平板电脑或桌面设备分类。

`isPhone` 用于检查设备形态。独立的 `isMobile` API 是 `isValidPhoneNumber` 的直接别名，用于验证 11 位中国手机号码形式的字符串，不会检查浏览器或设备。

#### getBrowserInfo

获取浏览器信息。

用法:

```javascript
const ret = getBrowserInfo();
console.log(ret);
```

输出:

```text
{"engine":"webkit","engineVs":"537.36","platform":"desktop","supporter":"chrome","supporterVs":"85.0.4183.121","system":"windows","systemVs":"10"}
```

返回字段:

| 字段 | 说明 | 类型 | 可选值 |
| :--- | :--- | :--- | :--- |
| **system** | 操作系统 | string | android、ios、windows、macos、linux |
| systemVs | 操作系统版本 | string | Windows: 2000、xp、2003、vista、7、8、8.1、10；macOS: ⋯⋯ |
| platform | 平台 | string | desktop、mobile |
| engine | 浏览器引擎 | string | webkit、gecko、presto、trident |
| engineVs | 浏览器引擎版本 | string | - |
| supporter | 浏览器 | string | edge、opera、chrome、safari、firefox、iexplore |
| supporterVs | 浏览器版本 | string | - |
| shell | 浏览器外壳 | string | 可选: wechat、qq_browser、qq_app、uc、360、2345、sougou、liebao、maxthon、bilibili |
| shellVs | 浏览器外壳版本 | string | 可选，例如 `20` |
| appleType | Apple 设备类型 | string | 可选: ipad、iphone、ipod、iwatch |

下面的示例判断当前环境是否为移动版 QQ。

```javascript
const { system, shell } = getBrowserInfo();
const isMobileQQ = ["android", "ios"].includes(system) && ["qq_browser", "qq_app"].includes(shell);
```

#### isSafePWAEnv

检查当前浏览器文档是否满足 PWA (渐进式 Web 应用) 的最低前提条件。这里只检查同步 JavaScript 能够识别的条件。函数会检查安全上下文和 Service Worker API 支持。默认情况下，文档还必须包含 Web App Manifest (Web 应用清单) 链接，而且 `href` 不能为空。

只需检查安全的 Service Worker 环境时，可以传入 `{ requireManifest: false }`。传入 `{ scope: "/app/" }` 时，当前页面还必须位于同源路径范围内。

该检查不会验证或请求 Manifest。它也不会验证 Service Worker 是否注册成功。该函数无法判断应用是否已经安装，也不保证浏览器会提供安装提示。不同浏览器还可能执行额外的安装策略。

用法:

```javascript
const ret = isSafePWAEnv();
console.log(ret);
```

输出:

```text
true
```

#### isStandalonePWA

检查当前页面是否以独立 PWA 模式显示。函数会检查标准的显示模式媒体查询，并兼容 iOS Safari 的 `navigator.standalone`。该结果只表示显示模式，不能证明应用已经安装或受 Service Worker 控制。

```javascript
if (isStandalonePWA()) {
  document.querySelector("[data-install-help]")?.remove();
}
```

### Web 性能

#### getPerformance

通过 `PerformanceNavigationTiming` 获取页面加载指标。

如果浏览器未提供导航条目，该函数返回的 Promise 会进入 rejected 状态。函数不会回退到已弃用的 `PerformanceTiming` API。

用法:

```javascript
// `camelCase: false` (默认值) 返回下划线格式 (`a_b`) 的数据
// `camelCase: true` 返回驼峰格式 (`aB`) 的数据
getPerformance()
 .then(res => {
  console.log(JSON.stringify(res));
 })
 .catch(console.error);
```

输出:

```text
{"source":"PerformanceNavigationTiming","os":"others","os_version":"","device_type":"pc","network":"4g","screen_direction":"","unload_time":0,"redirect_time":0,"dns_time":0,"tcp_time":0,"ssl_time":0,"response_time":2,"download_time":2,"first_paint_time":288,"first_contentful_paint_time":288,"dom_ready_time":0,"onload_time":0,"white_time":0,"render_time":0,"decoded_body_size":718,"encoded_body_size":718}
```

返回字段:

| 字段 | 说明 | 类型 | 计算方式 |
| :--- | :--- | :--- | :--- |
| dns_time | DNS 查询时间 | number | domainLookupEnd - domainLookupStart |
| tcp_time | 连接协商时间 | number | connectEnd - connectStart |
| response_time | 请求与响应时间 | number | responseStart - requestStart |
| white_time | 白屏时间 | number | responseStart - navigationStart |
| dom_ready_time | DOM 就绪时间 | number | domContentLoadedEventStart - navigationStart |
| onload_time | 页面加载时间 | number | loadEventStart - navigationStart |
| render_time | EventEnd 时间 | number | loadEventEnd - navigationStart |
| unload_time | 页面卸载时间 | number | 可选: unloadEventEnd - unloadEventStart |
| redirect_time | 重定向时间 | number | 可选: redirectEnd - redirectStart |
| ssl_time | SSL 连接时间 | number | 可选: connectEnd - secureConnectionStart |
| download_time | 下载时间 | number | 可选: responseEnd - responseStart |

### 调试

#### genCustomConsole

创建带有自定义前缀的控制台 (`console`) 输出对象。

用法:

```javascript
const myConsole = genCustomConsole("MazeyLog:");
myConsole.log("I am string.");
myConsole.info("I am boolean.", true);
myConsole.info("I am number.", 123, 456);
myConsole.info("I am object.", { a: 123, b: 456});
```

输出:

```text
MazeyLog: I am string.
MazeyLog: I am boolean. true
MazeyLog: I am number. 123 456
MazeyLog: I am object. {a: 123, b: 456}
```

## 参与贡献

### 开发环境

| 依赖 | 版本 |
| --- | --- |
| Node.js | v22.21.1 |
| TypeScript | v5.1.6 |

### 脚本

安装依赖:

```bash
npm i
```

启动开发环境:

```bash
npm run dev
```

构建:

```bash
npm run build
```

测试:

```bash
npm run test
```

生成文档:

```bash
npm run docs
```

### 返回值

| 值 | 说明 | 类型 |
| :--- | :--- | :--- |
| ok | 操作成功。 | string |
| loaded | 资源已经加载。 | string |
| failed | 发生错误。 | string |
| defined | 值已定义。 | string |
| undefined | 值未定义。 | string |
| timeout | 操作超时。 | string |
| true | 值为真。 | boolean |
| false | 值为假。 | boolean |

## 许可证

本软件按照 [MIT 许可证](https://github.com/chengchuu/mazey/blob/main/LICENSE) 发布。
