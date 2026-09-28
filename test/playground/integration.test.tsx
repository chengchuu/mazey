/** @jest-environment jsdom */
/* eslint-env browser, jest, node */

import "@testing-library/jest-dom";

import fs from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";

import { PlaygroundErrorBoundary } from "../../examples/components/web";

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

function ThrowingExample(): React.JSX.Element {
  throw new Error("Unexpected render failure");
}

test("the error boundary shows a safe fallback and logs the original error", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation();

  render(
    <main>
      <h1>Mazey utility playground</h1>
      <PlaygroundErrorBoundary>
        <ThrowingExample />
      </PlaygroundErrorBoundary>
    </main>
  );

  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "The interactive playground could not be loaded."
  );
  expect(
    screen.getByRole("link", { name: "API documentation" })
  ).toHaveAttribute("href", "../api/");
  expect(screen.getByRole("alert")).not.toHaveTextContent(
    "Unexpected render failure"
  );
  expect(consoleError).toHaveBeenCalled();
});

test("the static document shell stays crawlable and owns the React mount", () => {
  const html = fs.readFileSync(
    path.join(process.cwd(), "examples", "index.html"),
    "utf8"
  );
  const documentRef = new DOMParser().parseFromString(html, "text/html");

  expect(documentRef.querySelectorAll("h1")).toHaveLength(1);
  expect(documentRef.getElementById("playground-root")).not.toBeNull();
  expect(
    documentRef.querySelector("#playground-root [role='status']")?.textContent
  ).toContain("Loading interactive examples…");
  expect(documentRef.querySelector("main")?.textContent).toContain(
    "Run public Mazey utilities directly in your browser."
  );
  expect(documentRef.querySelector("noscript")?.textContent).toContain(
    "JavaScript is required"
  );
  expect(html).not.toContain('data-bs-toggle="tab"');
  expect(html).not.toContain("data-date-time-form");
});

test("the entry uses one React root, StrictMode, and no Bootstrap Tab API", () => {
  const entry = fs.readFileSync(
    path.join(process.cwd(), "examples", "index.tsx"),
    "utf8"
  );
  const webSources = fs
    .readdirSync(path.join(process.cwd(), "examples", "components", "web"))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) =>
      fs.readFileSync(
        path.join(process.cwd(), "examples", "components", "web", file),
        "utf8"
      )
    )
    .join("\n");

  expect(entry).toContain('document.getElementById("playground-root")');
  expect(entry.match(/createRoot\(/g)).toHaveLength(1);
  expect(entry).toContain("<StrictMode>");
  expect(entry).toContain("<PlaygroundApp />");
  expect(`${entry}\n${webSources}`).not.toContain("bootstrap/js/dist/tab");
  expect(webSources).not.toContain("data-bs-toggle");
  expect(webSources).not.toContain("shown.bs.tab");
});
