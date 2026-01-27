import type { MazeyFnParams } from "./typing";
import { isPureObject } from "./util";

const defaultGenCustomConsoleOptions = {
  isClosed: false,
  showWrap: false,
  showDate: false,
  locales: "en-US",
  isStringifyObject: false,
  logFn: () => undefined,
  errorFn: () => undefined,
};

/**
 * EN: Custom console printing (`console`).
 *
 * ZH: 生成自定义控制台打印。
 *
 * Usage:
 *
 * ```javascript
 * import { genCustomConsole } from "mazey";
 * 
 * const cusConsole = genCustomConsole("[MazeyLog]");
 * cusConsole.log("I am string.");
 * cusConsole.info("I am boolean.", true);
 * cusConsole.info("I am number.", 123, 456);
 * cusConsole.info("I am object.", { a: 123, b: 456});
 * ```
 *
 * Output:
 *
 * ```text
 * [MazeyLog] I am string.
 * [MazeyLog] I am boolean. true
 * [MazeyLog] I am number. 123 456
 * [MazeyLog] I am object. {a: 123, b: 456}
 * ```
 *
 * @param {string} prefix The prefix string.
 * @param {object} options The options object.
 * @param {boolean} options.isClosed Whether to close the console.
 * @param {boolean} options.showWrap Whether to show the wrap.
 * @param {boolean} options.showDate Whether to show the date.
 * @param {string} options.locales A locale string.
 * @param {boolean} options.isStringifyObject Whether to stringify the object.
 * @param {function} options.logFn The function with Log.
 * @param {function} options.errorFn The function with Error.
 * @returns {object} The custom console object.
 * @category Debug
 */
export function genCustomConsole(
  prefix = "",
  options: {
    isClosed?: boolean;
    showWrap?: boolean;
    showDate?: boolean;
    locales?: string;
    isStringifyObject?: boolean;
    logFn?: () => void;
    errorFn?: () => void;
  } = {
    ...defaultGenCustomConsoleOptions,
  }
): Console {
  const { isClosed, showWrap, showDate, locales, isStringifyObject, logFn, errorFn } = Object.assign(
    {
      ...defaultGenCustomConsoleOptions,
    },
    options
  );
  const methods = [ "log", "info", "warn", "error" ];
  const newConsole = Object.create(null);
  // https://stackoverflow.com/questions/3552461/how-do-i-format-a-date-in-javascript
  const formatDate = () => {
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      // hourCycle: "h24",
      minute: "numeric",
      second: "numeric",
    };
    const todayDateIns = new Date();
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
    // https://datatracker.ietf.org/doc/html/rfc4647
    const dateStr = todayDateIns.toLocaleDateString(locales, dateOptions);
    return dateStr;
  };
  methods.forEach(method => {
    newConsole[method] = function(...argu: MazeyFnParams) {
      if (isClosed) {
        return false;
      }
      let elaboratePrefix = prefix;
      let datePrefix = prefix;
      if (typeof prefix === "string" && prefix.length >= 2) {
        const len = prefix.length;
        if (prefix[len - 1] === ":") {
          elaboratePrefix = prefix.substring(0, len - 1);
        } else {
          elaboratePrefix = prefix;
        }
      }
      if (showWrap) {
        console.log(`--- ${elaboratePrefix} - begin ---`);
      }
      if (showDate) {
        if (prefix) {
          datePrefix = `${formatDate()} ${prefix}`;
        } else {
          datePrefix = `${formatDate()}`;
        }
      }
      if (isStringifyObject) {
        argu = argu.map(item => {
          if (isPureObject(item)) {
            return JSON.stringify(item);
          }
          return item;
        });
      }
      if (prefix || showDate) {
        console[method](datePrefix, ...argu);
      } else {
        console[method](...argu);
      }
      if (method === "log") {
        logFn();
      }
      if (method === "error") {
        errorFn();
      }
      if (showWrap) {
        console.log(`--- ${elaboratePrefix} - end ---`);
      }
    };
  });
  return newConsole;
}

/**
 * @hidden
 */
export const mazeyCon = genCustomConsole("[Mazey]");

/**
 * EN: Print logs with Time.
 * 
 * ZH: 打印带有时间的日志。
 * 
 * Usage:
 * 
 * ```javascript
 * timeCon("I am string.");
 * ```
 * 
 * Output:
 * 
 * ```text
 * 2024年11月2日周六 09:24:40 I am string.
 * ```
 * 
 * @hidden
 */
export const timeCon = genCustomConsole("", { showDate: true, locales: "zh-CN", isStringifyObject: true });
