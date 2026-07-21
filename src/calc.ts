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
