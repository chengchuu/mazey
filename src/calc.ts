import type { MazeyDate } from "./typing";
import { toValidDate } from "./date";

export type InvestmentReturnRate = number | string;

const millisecondsPerDay = 24 * 60 * 60 * 1000;

function parseInvestmentReturnRate(value: InvestmentReturnRate): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(
        "totalReturnRate must be a finite number or percentage string."
      );
    }
    return value;
  }

  if (typeof value !== "string") {
    throw new TypeError(
      "totalReturnRate must be a finite number or percentage string."
    );
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new TypeError("totalReturnRate must not be empty.");
  }

  const percentageText = normalized.endsWith("%")
    ? normalized.slice(0, -1).trim()
    : normalized;
  if (!percentageText) {
    throw new TypeError(
      "totalReturnRate must be a valid percentage string."
    );
  }

  const percentage = Number(percentageText);
  if (!Number.isFinite(percentage)) {
    throw new TypeError(
      "totalReturnRate must be a valid percentage string."
    );
  }
  return percentage / 100;
}

/**
 * Calculate an investment's Compound Annual Growth Rate (CAGR).
 *
 * Numeric total returns use decimal ratios. For example, `0.202` represents
 * `20.2%`. String total returns use percentage values, so `"20.2%"` and
 * `"20.2"` both represent `20.2%`. A trailing percent sign is optional, and
 * the complete trimmed string must be a finite JavaScript number. Scientific
 * notation such as `"2.02e1%"` is accepted.
 *
 * The returned CAGR is a decimal ratio and is not rounded. The calculation
 * uses:
 *
 * `CAGR = (1 + totalReturn)^(365 / durationInDays) - 1`
 *
 * Usage:
 *
 * ```typescript
 * import {
 *   calculateCAGR,
 *   floatToPercent,
 * } from "mazey";
 *
 * const cagr = calculateCAGR(
 *   "2022-04-01",
 *   "2025-10-01",
 *   "20.2%"
 * );
 * const equivalentCagr = calculateCAGR(
 *   "2022-04-01",
 *   "2025-10-01",
 *   0.202
 * );
 * const negativeCagr = calculateCAGR(
 *   "2022-04-01",
 *   "2025-10-01",
 *   "-15.5%"
 * );
 *
 * console.log({
 *   cagr,
 *   equivalentCagr,
 *   negativeCagr,
 *   percentage: floatToPercent(cagr, 2),
 * });
 * ```
 *
 * Possible output:
 *
 * ```text
 * {
 *   cagr: 0.053908...,
 *   equivalentCagr: 0.053908...,
 *   negativeCagr: -0.046926...,
 *   percentage: "5.39%"
 * }
 * ```
 *
 * @param startDate Start date as a supported structured string, millisecond timestamp, or `Date`.
 * @param endDate End date in the same accepted forms. It must be strictly later than `startDate`.
 * @param totalReturnRate Total period return. Numbers are decimal ratios; strings are percentage values.
 * @returns The unrounded CAGR as a decimal ratio.
 * @throws {TypeError} If either date or the total return is invalid.
 * @throws {RangeError} If the dates are not increasing, the total return is at most `-1`, or the result is not finite.
 * @remarks Duration uses the exact elapsed milliseconds, including time of day, converted to fractional days. A financial year is always fixed at 365 days. Input `Date` objects are copied and never mutated.
 * @category Calculate and Formula
 */
export function calculateCAGR(
  startDate: MazeyDate,
  endDate: MazeyDate,
  totalReturnRate: InvestmentReturnRate
): number {
  const normalizedStartDate = toValidDate(startDate);
  if (!normalizedStartDate) {
    throw new TypeError("startDate must be a valid date.");
  }

  const normalizedEndDate = toValidDate(endDate);
  if (!normalizedEndDate) {
    throw new TypeError("endDate must be a valid date.");
  }

  const durationMs =
    normalizedEndDate.getTime() - normalizedStartDate.getTime();
  if (durationMs <= 0) {
    throw new RangeError("endDate must be later than startDate.");
  }

  const totalReturn = parseInvestmentReturnRate(totalReturnRate);
  if (totalReturn <= -1) {
    throw new RangeError("totalReturnRate must be greater than -1.");
  }

  const durationInDays = durationMs / millisecondsPerDay;
  const cagr = Math.pow(1 + totalReturn, 365 / durationInDays) - 1;
  if (!Number.isFinite(cagr)) {
    throw new RangeError("calculated CAGR must be finite.");
  }
  return cagr;
}

/**
 * Compute the length of the longest common substring of two strings.
 *
 * Usage:
 *
 * ```javascript
 * import { longestComSubstring } from "mazey";
 *
 * const ret = longestComSubstring("fish", "finish");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 3
 * ```
 *
 * @param {string} aStr String
 * @param {string} bStr String
 * @returns {number} Length
 * @category Calculate and Formula
 */
export function longestComSubstring(aStr: string, bStr: string): number {
  const aLen = aStr.length;
  const bLen = bStr.length;
  if (aLen === 0 || bLen === 0) {
    return 0;
  }
  const arr = Array.from({ length: aLen }, () => new Array(bLen).fill(0));
  let maxLong = 0;
  for (let i = 0; i < aLen; ++i) {
    for (let j = 0; j < bLen; ++j) {
      if (aStr[i] === bStr[j]) {
        let baseNum = 0;
        if (i > 0 && j > 0) {
          baseNum = arr[i - 1][j - 1];
        }
        arr[i][j] = baseNum + 1;
        maxLong = Math.max(maxLong, arr[i][j]);
      }
    }
  }
  return maxLong;
}

/**
 * Alias of `longestComSubstring`.
 *
 * @hidden
 */
export function calLongestCommonSubstring(aStr: string, bStr: string): number {
  return longestComSubstring(aStr, bStr);
}

/**
 * Compute the length of the longest common subsequence of two strings.
 *
 * Usage:
 *
 * ```javascript
 * import { longestComSubsequence } from "mazey";
 *
 * const ret = longestComSubsequence("fish", "finish");
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * 4
 * ```
 *
 * @param {string} aStr The first string.
 * @param {string} bStr The second string.
 * @returns {number} The length of the longest common subsequence.
 * @category Calculate and Formula
 */
export function longestComSubsequence(aStr: string, bStr: string): number {
  const aLen = aStr.length;
  const bLen = bStr.length;
  if (aLen === 0 || bLen === 0) {
    return 0;
  }
  const arr = Array.from({ length: aLen }, () => new Array(bLen).fill(0));
  for (let i = 0; i < aLen; ++i) {
    for (let j = 0; j < bLen; ++j) {
      if (aStr[i] === bStr[j]) {
        let baseNum = 0;
        if (i > 0 && j > 0) {
          baseNum = arr[i - 1][j - 1];
        }
        arr[i][j] = baseNum + 1;
      } else {
        let [ leftValue, topValue ] = [ 0, 0 ];
        if (j > 0) {
          leftValue = arr[i][j - 1];
        }
        if (i > 0) {
          topValue = arr[i - 1][j];
        }
        arr[i][j] = Math.max(leftValue, topValue);
      }
    }
  }
  return arr[aLen - 1][bLen - 1];
}

/**
 * Alias of `longestComSubsequence`.
 *
 * @hidden
 */
export function calLongestCommonSubsequence(aStr: string, bStr: string): number {
  return longestComSubsequence(aStr, bStr);
}

/**
 * Return whether a random value falls within the given probability.
 *
 * Usage:
 *
 * ```javascript
 * import { isHit } from "mazey";
 *
 * const ret = isHit(0.5); // A 50% chance of returning true.
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * Example: Test the precision.
 *
 * ```javascript
 * let trueCount = 0;
 * let falseCount = 0;
 * new Array(1000000).fill(0).forEach(() => {
 *   if (isHit(0.5)) {
 *     trueCount++;
 *   } else {
 *     falseCount++;
 *   }
 * });
 * console.log(trueCount, falseCount);
 * ```
 *
 * Output:
 *
 * ```text
 * 499994 500006
 * ```
 *
 * @param {number} rate Probability expressed as a value from 0 to 1.
 * @returns {boolean} Whether the random value is less than the probability.
 * @category Calculate and Formula
 */
export function isHit(rate: number): boolean {
  if (Math.random() < rate) {
    return true;
  }
  return false;
}

/**
 * Alias of `isHit`.
 *
 * @hidden
 */
export function inRate(rate: number): boolean {
  return isHit(rate);
}
