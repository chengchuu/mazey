<!-- markdownlint-disable MD041 -->

⚠️ Note: The document has expired, please check the latest [README.md](https://github.com/chengchuu/mazey/blob/release/v4/README.md).

⚠️ 注意: 此文档只适用于 v1.4.39 版本，[查看 v4.x 版本的文档](https://github.com/chengchuu/mazey/blob/release/v4/README.md)

<!-- omit from toc -->
# Mazey

除除的 JavaScript 函数库，所有的方法都在线上项目中使用过。

<!-- omit from toc -->
## 目录

- [安装](#安装)
- [使用](#使用)
  - [加载资源](#加载资源)
  - [存储数据](#存储数据)
  - [操作 DOM](#操作-dom)
  - [网站性能](#网站性能)
  - [公式计算](#公式计算)
  - [浏览器信息](#浏览器信息)
  - [安全边际](#安全边际)
  - [函数](#函数)
  - [调试](#调试)
- [开发](#开发)
- [参考](#参考)

## 安装

使用 [npm](https://www.npmjs.com/package/mazey/v/1.4.39) 安装 `mazey@1.4.39`：

```bash
npm install mazey@1.4.39 --save
```

## 使用

### 加载资源

加载 JavaScript：

```javascript
import { loadScript } from "mazey";

loadScript({
  url: "https://example.com/path/example.js",
  id: "iamid", // 可选，script 标签 ID，默认无 ID
  timeout: 5000, // 可选，超时时间，默认 5000
  isDefer: false, // 可选，defer，默认 false
})
  .then(
    res => {
      console.log(`加载 JavaScript 成功: ${res}`);
    }
  )
  .catch(
    err => {
      console.error(`加载 JavaScript 失败: ${err}`)
    }
  );
```

加载 CSS：

```javascript
import { loadCSS } from "mazey";

loadCSS({
  url: "https://example.com/path/example.css",
  id: "iamid", // 可选，link 标签 ID，默认无 ID
})
  .then(
    res => {
      console.log(`加载 CSS 成功: ${res}`);
    }
  )
  .catch(
    err => {
      console.error(`加载 CSS 失败: ${err}`)
    }
  );
```

判断页面是否加载完成（兼容浏览器 `load` 事件已经触发过的情况）：

```javascript
import { loadCSS } from "mazey";

windowLoaded({ timeout: 30 })
  .then(res => {
    console.log(`加载完成：${res}`); // 加载完成：load
  })
  .catch(err => {
    console.log(`加载超时或失败：${err}`);
  });
```

### 存储数据

Storage（兼容 JSON 格式，自动转换）：

```javascript
import { setSessionStorage, getSessionStorage, setLocalStorage, getLocalStorage } from "mazey";

setSessionStorage("test", "123");
getSessionStorage("test"); // 123
setLocalStorage("test", "123");
getLocalStorage("test"); // 123
```

Cookie：

```javascript
import { setCookie, getCookie } from "mazey";

setCookie("test", "123", 30, "example.com"); // key value day domain
getCookie("test"); // 123
```

### 操作 DOM

修改 `class`：

```javascript
import { hasClass, addClass, removeClass } from "mazey";

const dom = document.querySelector("#box");

// 判断 class
hasClass(dom, "test");
// 增加 class
addClass(dom, "test");
// 删除 class
removeClass(dom, "test");
```

添加内联样式：

```javascript
import { addInlineStyle } from "mazey";

// 添加有 id 的内联样式，重复添加会更新内联样式而不是新增
addInlineStyle({
  inlineStyle: `
    body {
      background-color: #333;
    }
  `,
  id: "test",
});
// <style id="test">
//   body {
//     background-color: #333;
//   }
// </style>

// 添加无 id 的内联样式，重复添加会新增内联样式
addInlineStyle({
  inlineStyle: `
    body {
      background-color: #444;
    }
  `,
});
// <style>
//   body {
//     background-color: #444;
//   }
// </style>
```

添加自定义滚动条（适用于用 `transform` 移动的元素）：

```javascript
import { customScrollBarForTransformEle } from "mazey";

// 使用类名
customScrollBarForTransformEle({
  containerClassName: "i-am-container",
  imgBoxClassName: "i-am-img-father-i-can-transform",
  imgClassName: "i-am-img",
});

// 使用 Dom 对象
customScrollBarForTransformEle({
  containerClassName: "i-am-container",
  imgBoxDom: document.querySelector(".i-am-img-father-i-can-transform"),
  imgDom: document.querySelector(".i-am-img-father-i-can-transform"),
});

// 按需直接隐藏滚动条
customScrollBarForTransformEle({
  containerClassName: "i-am-container",
  action: "hide",
});
```

计算适配容器宽度的图片的尺寸、距离顶部的距离：

```javascript
import { calcContainImageSizeAndPosition } from "mazey";

// 如果高度不足以占满容器，使其垂直居中；如果高度比容器长，由上向下铺开
calcContainImageSizeAndPosition({ oriImageWidth: 300, oriImageHeight: 300, viewportWidth: 375, viewportHeight: 812 });
// {"targetImageWidth":375,"targetImageHeight":375,"top":218.5,"wPer":1.25}
```

### 网站性能

获取加载时间：

```javascript
import { getPerformance } from "mazey";

// camelCase：true（默认） 以驼峰形式返回数据 / false 以下划线形式返回数据
getPerformance({ camelCase: true })
 .then(res => {
  console.log(JSON.stringify(res));
  // {"deviceType":"pc","network":"3g","unloadTime":0,"redirectTime":0,"dnsTime":0,"tcpTime":0,"responseTime":65,"downloadTime":1,"domreadyTime":369,"onloadTime":441,"whiteTime":94,"renderTime":441,"decodedBodySize":210,"encodedBodySize":210}
 })
 .catch(console.error);
```

| 指标 | 字段 | 计算⽅法 |
| --- | --- | --- |
| * DNS 查询时间 | dns_time | domainLookupEnd - domainLookupStart |
| * 服务器连接时间 | tcp_time | connectEnd - connectStart |
| * 服务器响应时间 | response_time | responseStart - requestStart |
| * ⽩屏时间 | white_time | responseStart - navigationStart |
| * DomReady 总时间 | domready_time  | domContentLoadedEventStart - navigationStart |
| * 页面加载时间 | onload_time | loadEventStart - navigationStart |
| * EventEnd 总时间 | render_time | loadEventEnd -navigationStart |
| 上个⽂档卸载时间 | unload_time | unloadEventEnd - unloadEventStart |
| 重定向时间 | redirect_time | redirectEnd - redirectStart |
| 客户端⽩屏时间 | custom_white_time | renderTiming - navigationStart |
| SSL连接时间 | ssl_time | connectEnd - secureConnectionStart |
| ⽹⻚下载时间 | download_time | responseEnd - responseStart |
| FCP | first_contentful_paint_time | firstPaintTime |

### 公式计算

计算两个字符串的最长公共子串：

```javascript
import { calLongestCommonSubstring } from "mazey";

calLongestCommonSubstring("fish", "finish"); // 3
```

计算两个字符串的最长公共子序列：

```javascript
import { calLongestCommonSubsequence } from "mazey";

calLongestCommonSubsequence("fish", "finish"); // 4
```

命中概率（1% ~ 100%）：

```javascript
import { inRate } from "mazey";

inRate(0.5); // 0.01 ~ 1 true / false

// 测试准确性
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

### 浏览器信息

```javascript
import { getBrowserType } from "mazey";

getBrowserType(); // {"engine":"webkit","engineVs":"537.36","platform":"desktop","supporter":"chrome","supporterVs":"85.0.4183.121","system":"windows","systemVs":"10"}
// 外壳和外壳版本 { shell: "wechat", shellVs: "20" } shell: wechat qq uc 360 2345 sougou liebao maxthon
```

### 安全边际

判断是否是安全的 PWA 运行环境：

```javascript
import { isSafePWAEnv } from "mazey";

isSafePWAEnv(); // true
```

### 函数

防抖：

```javascript
import { debounce } from "mazey";

const foo = debounce(() => {
  console.log("执行 1 秒内再次执行无反应");
}, 1000, { leading: true })
```

判断是否是有效数字：

```javascript
import { isNumber } from "mazey";

isNumber(123); // true
isNumber("123"); // false
// 默认情况下 NaN、Infinity 不算有效数字
isNumber(Infinity); // false
isNumber(Infinity, { isUnFiniteAsNumber: true }); true
isNumber(NaN); // false
isNumber(NaN, { isNaNAsNumber: true, isUnFiniteAsNumber: true }); // true
```

### 调试

自定义控制台打印（`console`）：

```javascript
import { genCustomConsole } from "mazey";

const myConsole = genCustomConsole({ prefix: "MazeyLog:" });
myConsole.log("I am string."); // MazeyLog: I am string.
myConsole.info("I am boolean.", true); // MazeyLog: I am boolean. true
myConsole.info("I am number.", 123, 456); // MazeyLog: I am number. 123 456
myConsole.info("I am object.", { a: 123, b: 456}); // MazeyLog: I am object. {a: 123, b: 456}
```

[更多接口>>](https://mazey.cn/t/m)

## 开发

Development：

```bash
npm run dev
```

Build：

```bash
npm run build
```

Document：

```bash
npm run docs
```

## 参考

1. [@babel/preset-env conflicts with @babel/plugin-transform-runtime when using core-js@3](https://github.com/babel/babel/issues/10271#issuecomment-528379505)
2. [@babel/plugin-transform-runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime)
