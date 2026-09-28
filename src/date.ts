import type { MazeyDate } from "./typing";

export function getDateTime(value: object): number | null {
  try {
    return Date.prototype.getTime.call(value);
  } catch (e) {
    return null;
  }
}

const localDateStringPattern = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;
const zonedDateStringPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/;

function hasMatchingDateComponents(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond = 0,
  utc = false
): boolean {
  const date = new Date(0);
  if (utc) {
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(hour, minute, second, millisecond);
    return Number.isFinite(date.getTime())
      && date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day
      && date.getUTCHours() === hour
      && date.getUTCMinutes() === minute
      && date.getUTCSeconds() === second
      && date.getUTCMilliseconds() === millisecond;
  }

  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, second, millisecond);
  return Number.isFinite(date.getTime())
    && date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    && date.getHours() === hour
    && date.getMinutes() === minute
    && date.getSeconds() === second
    && date.getMilliseconds() === millisecond;
}

function createLocalDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond = 0
): Date {
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, second, millisecond);
  return date;
}

function createZonedDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timezone: string
): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  if (timezone === "Z") {
    return date;
  }

  const direction = timezone[0] === "+" ? 1 : -1;
  const offsetMinutes =
    Number(timezone.slice(1, 3)) * 60 + Number(timezone.slice(4, 6));
  return new Date(date.getTime() - direction * offsetMinutes * 60 * 1000);
}

export function toValidDate(value: unknown): Date | null {
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(value) && Number.isFinite(date.getTime())
      ? date
      : null;
  }

  if (typeof value === "object" && value !== null) {
    const dateTime = getDateTime(value);
    return dateTime !== null && Number.isFinite(dateTime)
      ? new Date(dateTime)
      : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const localMatch = localDateStringPattern.exec(trimmedValue);
  if (localMatch) {
    const [ year, month, day, hour = "0", minute = "0", second = "0" ] =
      localMatch.slice(1);
    const [ numericYear, numericMonth, numericDay, numericHour, numericMinute, numericSecond ] =
      [ year, month, day, hour, minute, second ].map(Number);
    if (!hasMatchingDateComponents(
      numericYear,
      numericMonth,
      numericDay,
      numericHour,
      numericMinute,
      numericSecond
    )) {
      return null;
    }
    return createLocalDate(
      numericYear,
      numericMonth,
      numericDay,
      numericHour,
      numericMinute,
      numericSecond
    );
  }

  const zonedMatch = zonedDateStringPattern.exec(trimmedValue);
  if (!zonedMatch) {
    return null;
  }

  const [ year, month, day, hour, minute, second = "0", fraction = "", timezone ] =
    zonedMatch.slice(1);
  const millisecond = Number(`${fraction}00`.slice(0, 3));
  if (!hasMatchingDateComponents(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    millisecond,
    true
  )) {
    return null;
  }

  if (timezone !== "Z") {
    const offsetHour = Number(timezone.slice(1, 3));
    const offsetMinute = Number(timezone.slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) {
      return null;
    }
  }

  return createZonedDate(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    millisecond,
    timezone
  );
}

/**
 * Precision used by `formatLocalDateTime`.
 *
 * @category Util
 */
export type LocalDateTimePrecision = "minute" | "second" | "millisecond";

const localDateTimePattern = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

function padLocalDateTimeComponent(value: number, width: number): string {
  const input = String(value);
  return input.length >= width
    ? input
    : `${"0".repeat(width - input.length)}${input}`;
}

/**
 * Parse an HTML `datetime-local` value into a local `Date`.
 *
 * Accepted normalized values use a year with at least four digits followed by
 * `-MM-DDTHH:mm`, with optional seconds and 1-3 fractional-second digits.
 * Components are validated strictly, so impossible dates and times return
 * `null` instead of being normalized by `Date`.
 *
 * Usage:
 *
 * ```javascript
 * import { parseLocalDateTime } from "mazey";
 *
 * const date = parseLocalDateTime("2026-07-21T14:30:45.123");
 * console.log(date?.getFullYear());
 * console.log(date?.getHours());
 * console.log(date?.getMilliseconds());
 * ```
 *
 * Output:
 *
 * ```text
 * 2026
 * 14
 * 123
 * ```
 *
 * @param value A normalized HTML `datetime-local` value without a timezone.
 * @returns A local `Date`, or `null` when the value is malformed or represents an impossible local date and time.
 * @remarks The value is interpreted using the runtime's local timezone. Timezone suffixes, surrounding whitespace, and date-only values are rejected.
 * @category Util
 */
export function parseLocalDateTime(value: string): Date | null {
  if (typeof value !== "string") return null;

  const match = localDateTimePattern.exec(value);
  if (!match) return null;

  const [ year, month, day, hour, minute, second = "0", fraction = "" ] =
    match.slice(1);
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const numericHour = Number(hour);
  const numericMinute = Number(minute);
  const numericSecond = Number(second);
  const millisecond = Number(`${fraction}00`.slice(0, 3));

  if (numericYear < 1 || !hasMatchingDateComponents(
    numericYear,
    numericMonth,
    numericDay,
    numericHour,
    numericMinute,
    numericSecond,
    millisecond
  )) {
    return null;
  }

  return createLocalDate(
    numericYear,
    numericMonth,
    numericDay,
    numericHour,
    numericMinute,
    numericSecond,
    millisecond
  );
}

/**
 * Format a `Date` as an HTML `datetime-local` value using local fields.
 *
 * | Precision     | Output shape                  |
 * | ------------- | ----------------------------- |
 * | `minute`      | `YYYY-MM-DDTHH:mm`            |
 * | `second`      | `YYYY-MM-DDTHH:mm:ss`         |
 * | `millisecond` | `YYYY-MM-DDTHH:mm:ss.SSS`     |
 *
 * Usage:
 *
 * ```javascript
 * import { formatLocalDateTime } from "mazey";
 *
 * const date = new Date(2026, 6, 21, 14, 30, 45, 123);
 * const minutes = formatLocalDateTime(date);
 * const seconds = formatLocalDateTime(date, { precision: "second" });
 * const milliseconds = formatLocalDateTime(date, {
 *   precision: "millisecond",
 * });
 * console.log(minutes);
 * console.log(seconds);
 * console.log(milliseconds);
 * ```
 *
 * Output:
 *
 * ```text
 * 2026-07-21T14:30
 * 2026-07-21T14:30:45
 * 2026-07-21T14:30:45.123
 * ```
 *
 * @param date A valid `Date` to format.
 * @param options Formatting options. Precision defaults to `minute`.
 * @returns A normalized HTML `datetime-local` value containing local calendar fields. The year is padded to at least four digits.
 * @throws {TypeError} If `date` is not a `Date` or `precision` is unsupported.
 * @throws {RangeError} If `date` is invalid or its local year is earlier than 1.
 * @remarks This function does not call `toISOString()` and does not convert the value to UTC. It does not mutate the supplied `Date`.
 * @category Util
 */
export function formatLocalDateTime(
  date: Date,
  options: { precision?: LocalDateTimePrecision } = {}
): string {
  const dateTime = typeof date === "object" && date !== null
    ? getDateTime(date)
    : null;
  if (dateTime === null) {
    throw new TypeError("date must be a Date");
  }
  if (!Number.isFinite(dateTime)) {
    throw new RangeError("Invalid date");
  }

  const precision = options.precision ?? "minute";
  if (precision !== "minute"
    && precision !== "second"
    && precision !== "millisecond") {
    throw new TypeError("precision must be minute, second, or millisecond");
  }

  const localDate = new Date(dateTime);
  const year = localDate.getFullYear();
  if (year < 1) {
    throw new RangeError("Date year must be greater than zero");
  }

  const formattedDate = [
    padLocalDateTimeComponent(year, 4),
    padLocalDateTimeComponent(localDate.getMonth() + 1, 2),
    padLocalDateTimeComponent(localDate.getDate(), 2),
  ].join("-");
  const formattedTime = [
    padLocalDateTimeComponent(localDate.getHours(), 2),
    padLocalDateTimeComponent(localDate.getMinutes(), 2),
  ];

  if (precision !== "minute") {
    formattedTime.push(padLocalDateTimeComponent(localDate.getSeconds(), 2));
  }

  let output = `${formattedDate}T${formattedTime.join(":")}`;
  if (precision === "millisecond") {
    output += `.${padLocalDateTimeComponent(localDate.getMilliseconds(), 3)}`;
  }
  return output;
}

/**
 * Subtract a number of calendar years from a date.
 *
 * Positive decimal amounts are rounded with `Math.floor`; negative decimal
 * amounts are rounded with `Math.ceil`. A negative amount therefore adds
 * calendar years. When the destination year does not contain the original
 * day, the result is clamped to the final day of that month.
 *
 * Usage:
 *
 * ```javascript
 * import { formatDate, subYears } from "mazey";
 *
 * const result = subYears(new Date(2014, 8, 1), 5);
 * console.log(formatDate(result, "yyyy-MM-dd"));
 * ```
 *
 * Output:
 *
 * ```text
 * 2009-09-01
 * ```
 *
 * @param date Date or timestamp in milliseconds to change.
 * @param amount Number of years to subtract. Positive decimals use `Math.floor`; negative decimals use `Math.ceil`.
 * @returns A new `Date` with the specified number of calendar years subtracted. Invalid inputs produce an invalid `Date`.
 * @remarks The calculation uses local calendar fields and preserves the local month, time, and day where possible. The supplied `Date` is not mutated.
 * @category Util
 */
export function subYears(date: Date | number, amount: number): Date {
  const dateTime = typeof date === "number"
    ? date
    : typeof date === "object" && date !== null
      ? getDateTime(date)
      : null;
  const result = new Date(dateTime ?? NaN);
  const integerAmount = typeof amount === "number"
    ? amount < 0
      ? Math.ceil(amount)
      : Math.floor(amount)
    : NaN;

  if (!Number.isFinite(result.getTime()) || !Number.isFinite(integerAmount)) {
    return new Date(NaN);
  }
  if (integerAmount === 0) return result;

  const originalMonth = result.getMonth();
  const originalDay = result.getDate();
  const targetYear = result.getFullYear() - integerAmount;
  const endOfTargetMonth = new Date(result.getTime());
  endOfTargetMonth.setFullYear(targetYear, originalMonth + 1, 0);
  const daysInTargetMonth = endOfTargetMonth.getDate();

  if (originalDay >= daysInTargetMonth) {
    return endOfTargetMonth;
  }

  result.setFullYear(targetYear, originalMonth, originalDay);
  return result;
}

/**
 * Get the current timestamp in milliseconds.
 *
 * Usage:
 *
 * ```javascript
 * import { mNow } from "mazey";
 *
 * const ret = mNow();
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 1585325367122
 * ```
 *
 * @returns {number} The current timestamp in milliseconds.
 * @category Util
 */
export function mNow(): number {
  let ret = 0;
  if (Date.now) {
    ret = Date.now();
  } else {
    ret = new Date().getTime();
  }
  return ret;
}


const defaultGetDateDifferenceOptions = {
  type: "d",
};

function normalizeDateDifferenceDate(value: number | string | Date): number | string | Date {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.replace(" ", "T");
  }
  return value;
}

/**
 * Calculate the interval between two dates or timestamps.
 *
 * The default `d` type returns the number of whole days. The `text` type
 * returns an English duration using days, hours, minutes, and seconds while
 * omitting zero-valued units. A zero interval returns `"0 seconds"`. Any other
 * type returns the number of whole seconds. Negative intervals and invalid
 * dates return an empty string.
 *
 * Usage:
 *
 * ```javascript
 * import { getDateDifference } from "mazey";
 *
 * const days = getDateDifference(0, 90061000);
 * const text = getDateDifference(0, 90061000, { type: "text" });
 * const compactText = getDateDifference(0, 90060000, { type: "text" });
 * const dateStringDays = getDateDifference(
 *   "2020-03-28 00:09:27",
 *   "2023-04-18 10:54:00"
 * );
 * console.log(days);
 * console.log(text);
 * console.log(compactText);
 * console.log(dateStringDays);
 * ```
 *
 * Output:
 *
 * ```text
 * 1
 * 1 day 1 hour 1 minute 1 second
 * 1 day 1 hour 1 minute
 * 1116
 * ```
 *
 * @param start Start date or timestamp.
 * @param end End date or timestamp.
 * @param options Formatting options. Use `d` for whole days or `text` for an English duration.
 * @returns Whole days, whole seconds, an English duration, or an empty string for a negative or invalid interval.
 * @remarks Strings in `YYYY-MM-DD HH:mm:ss` format are normalized and parsed as local time. Other date strings use the runtime's native `Date` parser; use timestamps or ISO strings with an explicit timezone when parsing must be portable.
 * @category Util
 */
export function getDateDifference(start: number | string | Date = 0, end: number | string | Date = 0, options: { type?: string } = defaultGetDateDifferenceOptions): number | string {
  options = Object.assign({}, defaultGetDateDifferenceOptions, options);
  const { type } = options;
  if (typeof start !== "number" || !Number.isFinite(start)) start = new Date(normalizeDateDifferenceDate(start)).getTime();
  if (typeof end !== "number" || !Number.isFinite(end)) end = new Date(normalizeDateDifferenceDate(end)).getTime();
  const t = Number(end) - Number(start);
  let ret = "";
  let [ d, h, m, s ] = new Array(4).fill(0);
  if (t >= 0) {
    d = Math.floor(t / 1000 / 60 / 60 / 24);
    h = Math.floor(t / 1000 / 60 / 60);
    m = Math.floor(t / 1000 / 60);
    s = Math.floor(t / 1000);
    switch (type) {
      case "d":
        ret = d;
        break;
      case "text":
        d = Math.floor(t / 1000 / 60 / 60 / 24);
        h = Math.floor((t / 1000 / 60 / 60) % 24);
        m = Math.floor((t / 1000 / 60) % 60);
        s = Math.floor((t / 1000) % 60);
        ret = [
          { value: d, unit: "day" },
          { value: h, unit: "hour" },
          { value: m, unit: "minute" },
          { value: s, unit: "second" },
        ]
          .filter(({ value }) => value > 0)
          .map(({ value, unit }) => formatDurationUnit(value, unit))
          .join(" ") || formatDurationUnit(0, "second");
        break;
      default:
        ret = s;
    }
  }
  return ret;
}

/**
 * Alias of `getDateDifference`.
 *
 * @hidden
 */
export function getFriendlyInterval(start: number | string | Date = 0, end: number | string | Date = 0, options: { type?: string } = defaultGetDateDifferenceOptions): number | string {
  return getDateDifference(start, end, options);
}

function formatDurationUnit(value: number, unit: string): string {
  const roundedValue = Math.round(value * 10) / 10;
  const unitLabel = roundedValue === 1 ? unit : `${unit}s`;
  return `${roundedValue} ${unitLabel}`;
}

/**
 * Format a duration in milliseconds using its largest applicable English unit.
 *
 * Values are rounded to at most one decimal place. Negative durations are
 * clamped to zero, and non-finite values return `"0 seconds"`.
 *
 * Usage:
 *
 * ```javascript
 * import { formatDurationFromMs } from "mazey";
 *
 * formatDurationFromMs(500);        // "0.5 seconds"
 * formatDurationFromMs(90000);      // "1.5 minutes"
 * formatDurationFromMs(3600000);    // "1 hour"
 * formatDurationFromMs(129600000);  // "1.5 days"
 * ```
 *
 * @param {number} durationMs Duration in milliseconds.
 * @returns {string} Concise duration using seconds, minutes, hours, or days.
 * @category Util
 */
export function formatDurationFromMs(durationMs: number): string {
  const normalizedDurationMs = Number.isFinite(durationMs) ? Math.max(durationMs, 0) : 0;
  const seconds = normalizedDurationMs / 1000;

  if (seconds >= 24 * 60 * 60) {
    return formatDurationUnit(seconds / 24 / 60 / 60, "day");
  }
  if (seconds >= 60 * 60) {
    return formatDurationUnit(seconds / 60 / 60, "hour");
  }
  if (seconds >= 60) {
    return formatDurationUnit(seconds / 60, "minute");
  }
  return formatDurationUnit(seconds, "second");
}


/**
 * Check whether an unknown value represents a valid date.
 *
 * Valid inputs include `Date` instances, finite millisecond timestamps,
 * structured local date strings, and ISO 8601 strings with `Z` or a numeric
 * timezone offset. Structured strings are parsed into numeric components and
 * validated strictly, so invalid calendar dates are not normalized.
 *
 * Supported string forms are `YYYY-MM-DD`, `YYYY-MM-DD HH:mm[:ss]`,
 * `YYYY-MM-DDTHH:mm[:ss]`, and the same `T`-separated date-time with `Z` or
 * a `+HH:mm`/`-HH:mm` offset. Zoned strings may include 1-3 millisecond digits.
 *
 * Usage:
 *
 * ```javascript
 * import { isValidDate } from "mazey";
 *
 * const ret1 = isValidDate(1577877720000);
 * const ret2 = isValidDate("2020-01-01 11:22");
 * const ret3 = isValidDate("2020-02-30");
 * const ret4 = isValidDate(new Date("invalid"));
 *
 * console.log(ret1, ret2, ret3, ret4);
 * ```
 *
 * Output:
 *
 * ```text
 * true true false false
 * ```
 *
 * @param value A `Date`, millisecond timestamp, or supported structured date string.
 * @returns Whether the value represents a valid date.
 * @category Util
 */
export function isValidDate(value: unknown): boolean {
  return toValidDate(value) !== null;
}

/**
 * Check whether a date is today in the runtime's local timezone.
 *
 * Usage:
 *
 * ```javascript
 * import { isToday } from "mazey";
 *
 * const ret = isToday(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value has the current local year, month, and day. Invalid input returns `false`.
 * @remarks Hours, minutes, seconds, and milliseconds are ignored. Results depend on the runtime's local timezone.
 * @category Util
 */
export function isToday(date: MazeyDate): boolean {
  const target = toValidDate(date);
  if (!target) return false;
  const now = new Date();
  return target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth()
    && target.getDate() === now.getDate();
}

/**
 * Check whether a date is in the current local calendar year.
 *
 * Usage:
 *
 * ```javascript
 * import { isThisYear } from "mazey";
 *
 * const ret = isThisYear(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value has the current local year. Invalid input returns `false`.
 * @remarks Results depend on the runtime's local timezone.
 * @category Util
 */
export function isThisYear(date: MazeyDate): boolean {
  const target = toValidDate(date);
  return target !== null && target.getFullYear() === new Date().getFullYear();
}

/**
 * Check whether a date is in the current local calendar month and year.
 *
 * Usage:
 *
 * ```javascript
 * import { isThisMonth } from "mazey";
 *
 * const ret = isThisMonth(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value has the current local year and month. Invalid input returns `false`.
 * @remarks Results depend on the runtime's local timezone.
 * @category Util
 */
export function isThisMonth(date: MazeyDate): boolean {
  const target = toValidDate(date);
  if (!target) return false;
  const now = new Date();
  return target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth();
}

/**
 * Check whether a date is in the current Monday-first local calendar week.
 *
 * Usage:
 *
 * ```javascript
 * import { isThisWeek } from "mazey";
 *
 * const ret = isThisWeek(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value is in the current local week. Invalid input returns `false`.
 * @remarks The week begins on Monday and ends before the following Monday. Boundaries use local time and a half-open range.
 * @category Util
 */
export function isThisWeek(date: MazeyDate): boolean {
  const target = toValidDate(date);
  if (!target) return false;

  const startOfWeek = new Date();
  const daysSinceMonday = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
  const startOfNextWeek = new Date(startOfWeek.getTime());
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
  const targetTime = target.getTime();
  return targetTime >= startOfWeek.getTime()
    && targetTime < startOfNextWeek.getTime();
}

/**
 * Check whether a date is within the current local clock hour.
 *
 * Usage:
 *
 * ```javascript
 * import { isThisHour } from "mazey";
 *
 * const ret = isThisHour(new Date());
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns Whether the value has the current local year, month, day, and hour. Invalid input returns `false`.
 * @remarks Minutes, seconds, and milliseconds are ignored. Results depend on the runtime's local timezone.
 * @category Util
 */
export function isThisHour(date: MazeyDate): boolean {
  const target = toValidDate(date);
  if (!target) return false;
  const now = new Date();
  return target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth()
    && target.getDate() === now.getDate()
    && target.getHours() === now.getHours();
}

function formatApproximateDistance(value: number, unit: string): string {
  const roundedValue = Math.max(1, Math.round(value));
  return `about ${roundedValue} ${unit}${roundedValue === 1 ? "" : "s"}`;
}

/**
 * Format the absolute distance from a date to now in concise English words.
 *
 * Usage:
 *
 * ```javascript
 * import { formatDistanceToNow } from "mazey";
 *
 * const ret = formatDistanceToNow(new Date(Date.now() - 60 * 60 * 1000));
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * about 1 hour
 * ```
 *
 * @param date A `Date`, millisecond timestamp, or string accepted by `isValidDate`.
 * @returns The absolute approximate distance phrase, or an empty string for invalid input.
 * @remarks Past and future dates use the same wording without `ago` or `in`. Months and years use fixed approximate durations of 30 and 365 days.
 * @category Util
 */
export function formatDistanceToNow(date: MazeyDate): string {
  const target = toValidDate(date);
  if (!target) return "";

  const secondMs = 1000;
  const minuteMs = 60 * secondMs;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const distanceMs = Math.abs(target.getTime() - Date.now());

  if (distanceMs < 30 * secondMs) return "less than a minute";
  if (distanceMs < 90 * secondMs) return "about 1 minute";
  if (distanceMs < 45 * minuteMs) {
    return formatApproximateDistance(distanceMs / minuteMs, "minute");
  }
  if (distanceMs < 90 * minuteMs) return "about 1 hour";
  if (distanceMs < 24 * hourMs) {
    return formatApproximateDistance(distanceMs / hourMs, "hour");
  }
  if (distanceMs < 42 * hourMs) return "about 1 day";
  if (distanceMs < 30 * dayMs) {
    return formatApproximateDistance(distanceMs / dayMs, "day");
  }
  if (distanceMs < 45 * dayMs) return "about 1 month";
  if (distanceMs < 365 * dayMs) {
    return formatApproximateDistance(distanceMs / (30 * dayMs), "month");
  }
  if (distanceMs < 545 * dayMs) return "about 1 year";
  return formatApproximateDistance(distanceMs / (365 * dayMs), "year");
}

/**
 * Return the formatted date string in the given format.
 *
 * Supported format tokens:
 *
 * | Token  | Meaning                                | Range or example |
 * | ------ | -------------------------------------- | ---------------- |
 * | `yyyy` | Four-digit year                        | `2022`           |
 * | `MM`   | Two-digit month                        | `01`–`12`        |
 * | `dd`   | Two-digit day of the month             | `01`–`31`        |
 * | `HH`   | Two-digit hour using the 24-hour clock | `00`–`23`        |
 * | `hh`   | Two-digit hour using the 12-hour clock | `01`–`12`        |
 * | `mm`   | Two-digit minute                       | `00`–`59`        |
 * | `ss`   | Two-digit second                       | `00`–`59`        |
 * | `a`    | Uppercase meridiem indicator           | `AM` or `PM`     |
 *
 * The function creates a native `Date` and reads its local date and time
 * fields. Timestamp output can therefore differ between runtime time zones.
 *
 * Usage:
 *
 * ```javascript
 * import { formatDate } from "mazey";
 *
 * const ret1 = formatDate();
 * const ret2 = formatDate("Tue Jan 11 2022 14:12:26 GMT+0800 (China Standard Time)", "yyyy-MM-dd hh:mm:ss a");
 * const ret3 = formatDate(1641881235000, "yyyy-MM-dd hh:mm:ss a");
 * const ret4 = formatDate(new Date(2014, 1, 11), "MM/dd/yyyy");
 * console.log("Default formatDate value:", ret1);
 * console.log("String formatDate value:", ret2);
 * console.log("Number formatDate value:", ret3);
 * console.log("Date formatDate value:", ret4);
 * ```
 *
 * Output:
 *
 * ```text
 * Default formatDate value: 2023-01-11
 * String formatDate value: 2022-01-11 02:12:26 PM
 * Number formatDate value: 2022-01-11 02:07:15 PM
 * Date formatDate value: 02/11/2014
 * ```
 *
 * @param {MazeyDate} dateIns Original date value. Defaults to the current date and time.
 * @param {string} format Format string composed of supported format tokens. Defaults to `yyyy-MM-dd`.
 * @returns {string} The formatted date string.
 * @throws {RangeError} If `dateIns` is not a valid date.
 * @category Util
 */
export function formatDate(dateIns?: MazeyDate, format = "yyyy-MM-dd"): string {
  if (dateIns === undefined) {
    dateIns = new Date();
  }
  const tempDate = new Date(dateIns);
  if (!Number.isFinite(tempDate.getTime())) {
    throw new RangeError("Invalid date");
  }
  const hours = tempDate.getHours();
  const o: {
    [key: string]: string | number;
  } = {
    yyyy: tempDate.getFullYear(),
    MM: tempDate.getMonth() + 1,
    dd: tempDate.getDate() < 10 ? "0" + tempDate.getDate() : tempDate.getDate(),
    HH: hours < 10 ? "0" + hours : hours,
    hh: ((hours % 12) || 12) < 10 ? "0" + ((hours % 12) || 12) : (hours % 12) || 12,
    mm: tempDate.getMinutes() < 10 ? "0" + tempDate.getMinutes() : tempDate.getMinutes(),
    ss: tempDate.getSeconds() < 10 ? "0" + tempDate.getSeconds() : tempDate.getSeconds(),
    a: hours < 12 ? "AM" : "PM",
  };
  let tempFormat = format || "yyyy-MM-dd";
  Object.keys(o).forEach(key => {
    let value = o[key];
    if (key === "MM" && Number(value) <= 9) {
      value = `0${value}`;
    }
    tempFormat = tempFormat.split(key).join(String(value));
  });
  return tempFormat;
}

/**
 * Generate a local-time Calendar Versioning string from a date.
 *
 * The conceptual format is `yyyy.MMdd.HHmmss`. Leading zeroes are removed
 * from each segment to keep numeric Semantic Versioning identifiers valid.
 *
 * Usage:
 *
 * ```javascript
 * import { generateCalendarVersion } from "mazey";
 *
 * const ret = generateCalendarVersion(new Date(2026, 6, 11, 7, 40, 35));
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 2026.711.74035
 * ```
 *
 * @param {MazeyDate} dateIns Original date. Defaults to the current date.
 * @returns {string} Return the generated calendar version.
 * @throws {RangeError} If `dateIns` is not a valid date.
 * @category Util
 */
export function generateCalendarVersion(dateIns?: MazeyDate): string {
  const normalizedDateIns = dateIns === undefined
    ? new Date()
    : new Date(dateIns instanceof Date ? dateIns.getTime() : dateIns);
  return formatDate(normalizedDateIns, "yyyy.MMdd.HHmmss")
    .split(".")
    .map(segment => String(Number(segment)))
    .join(".");
}
