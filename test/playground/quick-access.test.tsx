/** @jest-environment jsdom */
/* eslint-env browser, jest */

import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaygroundTabs } from "../../examples/components/web/PlaygroundTabs";
import {
  enableHomeBypass,
  getQuickAccessDestination,
  readQuickAccess,
} from "../../site/quick-access";

jest.mock("../../site/runtime-config", () => ({
  SITE_RUNTIME_CONFIG: { quickAccessStorageKey: "test:quick-access" },
}));

const key = "test:quick-access";
const standaloneDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "standalone"
);

beforeEach(() => {
  Object.defineProperty(navigator, "standalone", {
    configurable: true,
    value: true,
  });
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  jest.restoreAllMocks();
  localStorage.clear();
  if (standaloneDescriptor)
    Object.defineProperty(navigator, "standalone", standaloneDescriptor);
  else Reflect.deleteProperty(navigator, "standalone");
  window.history.replaceState(null, "", "/");
});

test("selects, persists, replaces and clears a single quick module", async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, "", "/mazey/playground/#cagr");
  const first = render(<PlaygroundTabs />);
  await user.click(screen.getByRole("button", { name: "Quick access" }));
  expect(localStorage.getItem(key)).toBe("cagr");
  expect(screen.getByRole("button", { name: "Quick access" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  first.unmount();
  render(<PlaygroundTabs />);
  expect(screen.getByRole("button", { name: "Quick access" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await user.click(screen.getByRole("tab", { name: "Aspect ratio" }));
  await user.click(screen.getByRole("button", { name: "Quick access" }));
  expect(localStorage.getItem(key)).toBe("aspect-ratio");
  await user.click(screen.getByRole("tab", { name: "CAGR" }));
  expect(screen.getByRole("button", { name: "Quick access" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await user.click(screen.getByRole("tab", { name: "Aspect ratio" }));
  await user.click(screen.getByRole("button", { name: "Quick access" }));
  expect(localStorage.getItem(key)).toBeNull();
  await user.click(screen.getByRole("tab", { name: "Date interval" }));
  expect(
    screen.getByRole("button", { name: "Quick access" })
  ).toBeInTheDocument();
});

test("ordinary browser visits hide controls and never redirect", () => {
  Object.defineProperty(navigator, "standalone", {
    configurable: true,
    value: false,
  });
  localStorage.setItem(key, "cagr");
  render(<PlaygroundTabs />);
  expect(screen.queryByRole("button", { name: "Quick access" })).toBeNull();
  expect(
    getQuickAccessDestination(
      new URL("https://example.com/mazey/"),
      "/mazey/",
      key
    )
  ).toBeNull();
});

test.each(["setItem", "removeItem"] as const)(
  "failed %s preserves the saved selection and reports failure",
  async (method) => {
    const user = userEvent.setup();
    if (method === "removeItem") localStorage.setItem(key, "date-interval");
    jest.spyOn(Storage.prototype, method).mockImplementation(() => {
      throw new Error("Blocked");
    });
    render(<PlaygroundTabs />);
    await user.click(screen.getByRole("button", { name: "Quick access" }));
    expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
    expect(
      screen.getByRole("button", { name: "Quick access" })
    ).toHaveAttribute("aria-pressed", String(method === "removeItem"));
  }
);

test("only standalone homepage visits with a valid saved module redirect", () => {
  const destination = (path: string) =>
    getQuickAccessDestination(
      new URL(path, "https://example.com"),
      "/mazey/",
      key
    );
  expect(destination("/mazey/")).toBeNull();
  localStorage.setItem(key, "https://evil.example/");
  expect(destination("/mazey/")).toBeNull();
  localStorage.setItem(key, "cagr");
  expect(destination("/mazey/")).toBe("/mazey/playground/#cagr");
  expect(destination("/mazey/?theme=dark")).toBe(
    "/mazey/playground/?theme=dark#cagr"
  );
  for (const path of [
    "/mazey/?home=1",
    "/mazey/#install",
    "/mazey/#usage",
    "/mazey/playground/#aspect-ratio",
    "/mazey/api/",
  ]) {
    expect(destination(path)).toBeNull();
  }
  expect(
    getQuickAccessDestination(new URL("https://example.com/"), "/", key)
  ).toBe("/playground/#cagr");
});

test("blocked storage leaves the homepage available", () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  expect(readQuickAccess(key)).toBeNull();
  expect(
    getQuickAccessDestination(
      new URL("https://example.com/mazey/"),
      "/mazey/",
      key
    )
  ).toBeNull();
});

test("standalone Home links bypass redirection without altering anchors or external links", () => {
  document.body.innerHTML =
    '<a href="/mazey/">Home</a><a href="/mazey/#install">Install</a><a href="https://example.com/mazey/">External</a>';
  enableHomeBypass("/mazey/");
  const links = document.querySelectorAll("a");
  expect(new URL(links[0].href).search).toBe("?home=1");
  expect(links[1].getAttribute("href")).toBe("/mazey/#install");
  expect(links[2].href).toBe("https://example.com/mazey/");
});
