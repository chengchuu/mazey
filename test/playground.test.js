/** @jest-environment jsdom */
/* eslint-env jest */

import { parseDurationInput } from "../examples/index";

test.each([
  ["", null],
  ["   ", null],
  ["-1", null],
  ["Infinity", null],
  ["0", 0],
  ["90000", 90000],
])("parses playground duration %p as %p", (value, expected) => {
  expect(parseDurationInput(value)).toBe(expected);
});
