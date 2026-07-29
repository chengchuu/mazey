/** @jest-environment jsdom */
/* eslint-env browser, jest */

import "@testing-library/jest-dom";

import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  parsePlaygroundTabHash,
  PlaygroundTabs,
} from "../../examples/components/web";

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  window.history.replaceState(null, "", "/playground/");
});

test.each([
  ["#date-interval", "date-interval"],
  ["#cagr", "cagr"],
  ["#duration", "duration"],
  ["#unknown", null],
  ["", null],
])("parses tab hash %p", (hash, expected) => {
  expect(parsePlaygroundTabHash(hash)).toBe(expected);
});

test("renders three accessible tabs with date interval active by default", () => {
  render(<PlaygroundTabs />);
  const tabs = screen.getAllByRole("tab");

  expect(tabs).toHaveLength(3);
  expect(tabs.map((tab) => tab.textContent)).toEqual([
    "Date interval",
    "CAGR",
    "Duration",
  ]);
  expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  expect(tabs[0]).toHaveAttribute("tabindex", "0");
  expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  expect(tabs[1]).toHaveAttribute("tabindex", "-1");

  const panel = screen.getByRole("tabpanel");
  expect(panel).toHaveAttribute("id", "date-interval");
  expect(panel).toHaveAttribute("aria-labelledby", "date-interval-tab");
  expect(panel).toHaveAttribute("tabindex", "0");
  expect(window.location.hash).toBe("");
});

test("uses a valid initial hash and ignores an unknown hash", () => {
  window.history.replaceState(null, "", "#cagr");
  const { unmount } = render(<PlaygroundTabs />);
  expect(screen.getByRole("tab", { name: "CAGR" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "cagr");

  unmount();
  window.history.replaceState(null, "", "#unknown");
  render(<PlaygroundTabs />);
  expect(screen.getByRole("tab", { name: "Date interval" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(window.location.hash).toBe("#unknown");
});

test("clicking a tab updates content and replaces the hash", async () => {
  const user = userEvent.setup();
  const replaceState = jest.spyOn(window.history, "replaceState");
  render(<PlaygroundTabs />);

  await user.click(screen.getByRole("tab", { name: "Duration" }));

  expect(screen.getByRole("tab", { name: "Duration" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "duration");
  expect(replaceState).toHaveBeenCalledWith(null, "", "#duration");
  expect(window.location.hash).toBe("#duration");
});

test("supports wrapped arrow, Home, and End keyboard navigation", async () => {
  const user = userEvent.setup();
  render(<PlaygroundTabs />);
  const dateTab = screen.getByRole("tab", { name: "Date interval" });

  dateTab.focus();
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("tab", { name: "Duration" })).toHaveFocus();
  expect(screen.getByRole("tab", { name: "Duration" })).toHaveAttribute(
    "aria-selected",
    "true"
  );

  await user.keyboard("{ArrowRight}");
  expect(dateTab).toHaveFocus();
  await user.keyboard("{End}");
  expect(screen.getByRole("tab", { name: "Duration" })).toHaveFocus();
  await user.keyboard("{Home}");
  expect(dateTab).toHaveFocus();
});

test("responds to a later valid hash change", () => {
  render(<PlaygroundTabs />);

  act(() => {
    window.history.replaceState(null, "", "#cagr");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });

  expect(screen.getByRole("tab", { name: "CAGR" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
});

test("restricted History API access does not break tab selection", async () => {
  const user = userEvent.setup();
  jest.spyOn(window.history, "replaceState").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  render(<PlaygroundTabs />);

  await expect(
    user.click(screen.getByRole("tab", { name: "CAGR" }))
  ).resolves.toBeUndefined();
  expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "cagr");
});

test("example forms retain independent state", async () => {
  const user = userEvent.setup();
  render(<PlaygroundTabs />);

  await user.click(screen.getByRole("tab", { name: "Duration" }));
  const durationPanel = screen.getByRole("tabpanel");
  const durationInput = within(durationPanel).getByLabelText(
    "Duration in milliseconds"
  );
  await user.clear(durationInput);
  await user.type(durationInput, "-1");
  await user.click(within(durationPanel).getByRole("button"));
  expect(within(durationPanel).getByRole("alert")).toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "CAGR" }));
  const cagrPanel = screen.getByRole("tabpanel");
  expect(within(cagrPanel).queryByRole("alert")).not.toBeInTheDocument();
  expect(within(cagrPanel).getByLabelText("Total return")).toHaveValue("20.2%");

  await user.click(screen.getByRole("tab", { name: "Duration" }));
  expect(screen.getByLabelText("Duration in milliseconds")).toHaveValue(-1);
});
