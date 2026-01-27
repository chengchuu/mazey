import {
  getUrlParam, updateQueryParam, getHashQueryParam, getDomain,
  camelCaseToKebabCase, camelCase2Underscore, timeCon,
  generateRndNum, genHashCode, inRate, genCustomConsole,
  isNonEmptyArray, isValidData, isSupportWebp, isNumber,
  getFileSize, getScriptQueryParam,
  debounce, formatDate,
  getFriendlyInterval, getBrowserInfo,
  repeatUntilConditionMet,
  loadScript, loadScriptIfUndefined,
  deepCopyObject, deepCopy,
  setCookie, getCookie, delCookie,
  getFCP, getFP, getLCP, getFID,
  getCLS, getTTFB, getPerformance,
  longestComSubsequence,
} from "../src/index";

// Sync
console.log("[v1]Is Infinity number?", isNumber(Infinity, { isInfinityAsNumber: true }));
console.log("Is NaN number?", isNumber(NaN, { isNaNAsNumber: true, isUnFiniteAsNumber: true }));
console.log("Did ttt exist?", getHashQueryParam("ttt"));
console.log("What is t3?", getUrlParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t3"));
console.log("Can query param update successfully?", updateQueryParam("http://example.com/?t1=1&t2=2&t3=3&t4=4", "t3", "three"));
console.log("What is domain?", getDomain("http://example.com/?t1=1&t2=2&t3=3&t4=4"));
console.log("Get KebabCase:", camelCaseToKebabCase("aBC"));
console.log("Get Underscore:", camelCase2Underscore("bBC"));
console.log("Get a string with random number:", generateRndNum(7));
console.log("Is non-empty array?", isNonEmptyArray([ "a", 123 ]));
console.log("Get file size:", getFileSize(2000));
console.log("Generate a Hash from a string:", genHashCode("123"));
const genLog = genCustomConsole("GenLog:", {
  isClosed: false,
  showWrap: false,
  showDate: true,
  locales: "zh-CN",
});
genLog.log("test?");
const genLogWithString = genCustomConsole("[GenLogWithString]", {
  isStringifyObject: true,
});
genLogWithString.log({ a: 1, b: 2 });
timeCon.log("test?");
timeCon.log({ a: 1, b: 2 });
// const s011101 = ;
console.log("Default formatDate value:", formatDate());
// 2022-01-11
console.log("String formatDate value:", formatDate("Tue Jan 11 2022 14:12:26 GMT+0800 (China Standard Time)", "yyyy-MM-dd hh:mm:ss"));
// 2022-01-11 14:12:26
console.log("Number formatDate value:", formatDate(1641881235000, "yyyy-MM-dd hh:mm:ss"));
// 2022-01-11 14:07:15
// (new Date(2014, 1, 11), "MM/dd/yyyy")
console.log("Date formatDate value:", formatDate(new Date(2014, 1, 11), "MM/dd/yyyy"));
// Date formatDate value: 02/11/2014
const validData = {
  ["a"]: {
    ["b"]: {
      ["c"]: 413,
    },
  },
};
const isValidDataResA = isValidData(validData, [ "a", "b", "c" ], 2333);
const isValidDataResB = isValidData(validData, [ "a", "b", "c" ], 413);
const isValidDataResC = isValidData(validData, [ "d", "d" ], 413);
console.log("isValidDataResA:", isValidDataResA);
console.log("isValidDataResB:", isValidDataResB);
console.log("isValidDataResC:", isValidDataResC);
// isValidDataResA: false
// isValidDataResB: true
// isValidDataResC: false

console.log("getFriendlyInterval:", getFriendlyInterval(new Date("2020-03-28 00:09:27"), new Date("2023-04-18 10:54:00"), { type: "d" })); // 1116
console.log("getFriendlyInterval:", getFriendlyInterval(1585325367000, 1681786440000, { type: "text" })); // 1116 天 10 时 44 分 33 秒
console.log(
  "getFriendlyInterval:",
  getFriendlyInterval("2020-03-28 00:09:27", "2023-04-18 10:54:00", {
    type: "text",
  })
); // 1116 天 10 时 44 分 33 秒

console.log("getBrowserInfo:", getBrowserInfo());
console.log("getBrowserInfo again:", getBrowserInfo());

const conFn = () => {
  const ret = inRate(0.3);
  console.log("conFn", ret, Date.now());
  return ret;
};
repeatUntilConditionMet(conFn);

loadScriptIfUndefined("$", "https://i.mazey.net/lib/jquery/3.1.1/jquery.min.js")
  .then(res => {
    console.log("loadScriptIfUndefined success", res);
  })
  .catch(err => {
    console.log("loadScriptIfUndefined fail", err);
  });
const loadScriptOptions = {
  id: "load-aug",
  callback: function() {
    /* pass */
  },
  timeout: 5000,
  isDefer: true,
  isAsync: true,
  isCrossOrigin: true,
  attributes: { onece: "onece-9977", class: "diy-script" },
  cssUrl: "swiper.min.css",
};
loadScript("//i.mazey.net/lib/swiper/9.3.2/swiper.min.js", {
  ...loadScriptOptions,
});

const obj = {
  a: 1,
  b: {
    c: 2,
    d: { e: 3 },
  },
};
const obj2 = deepCopyObject(obj);
console.log("deepCopyObject obj2", obj2);
const simpleObj = { a: 1, b: 2 };
const simpleObj2 = deepCopy(simpleObj);
console.log("deepCopyObject simpleObj2", simpleObj2);

setCookie("test1", "testValue1");
console.log("getCookie test1", getCookie("test1"));
setCookie("test2", "testValue2");
console.log("getCookie test2", getCookie("test2"));
setCookie("test3", "testValue3", 1);
console.log("getCookie test3", getCookie("test3"));
console.log("delCookie test2", delCookie("test2"));
console.log("delCookie test2 again", delCookie("test2"));
console.log("getCookie test1", getCookie("test1"));
console.log("All Cookie", document.cookie);

console.log("getScriptQueryParams id", getScriptQueryParam("id", "jquery"));
console.log("getScriptQueryParams _", getScriptQueryParam("_", ""));
console.log("getScriptQueryParams empty", getScriptQueryParam("empty"));

const longestSS = longestComSubsequence("fish", "finish");
console.log("longestComSubsequence:", longestSS);

// Async
(async () => {
  console.log("Detect webp support:", await isSupportWebp());

  // debounce
  console.log("Test debounce - begin");
  const c = debounce(
    () => {
      console.log("Test debounce - fun myself");
    },
    3000,
    true
  );
  console.log("Test debounce - invoke first");
  c();
  setTimeout(() => {
    c();
    console.log("Test debounce - 2000ms second");
  }, 2000);
  setTimeout(() => {
    c();
    console.log("Test debounce - 10000ms third");
  }, 10000);
  console.log("Test debounce - end");

  getCLS().then(cls => {
    console.log("getCLS", cls);
  });
  getFID().then(fid => {
    console.log("getFID", fid);
  });

  getPerformance(false).then(performance => {
    console.log("getPerformance", performance);
  });

  // await
  const fcp = await getFCP();
  console.log("getFCP", fcp);
  const fp = await getFP();
  console.log("getFP", fp);
  const lcp = await getLCP();
  console.log("getLCP", lcp);
  const ttfb = await getTTFB();
  console.log("getTTFB", ttfb);
})();

// Event
$("#btn").on("click", () => {
  console.log("click");
  getFID().then(fid => {
    console.log("Event getFID", fid);
  });
});
