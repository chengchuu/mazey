/** @jest-environment node */
/* eslint-env jest, node */

import { jest } from "@jest/globals";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import projectConfig from "../project.config";
import { apiAppShellAssets, renderServiceWorker } from "../scripts/build-pages";

const apiAssets = [
  `${projectConfig.site.basePath}api/assets/icons.svg`,
  `${projectConfig.site.basePath}api/assets/main.js`,
  `${projectConfig.site.basePath}api/assets/style.css`,
];

function evaluateWorker() {
  const listeners = {};
  const runtimeCache = {
    delete: jest.fn(),
    keys: jest.fn(async () => []),
    match: jest.fn(),
    put: jest.fn(),
  };
  const caches = {
    delete: jest.fn(async () => true),
    keys: jest.fn(async () => [
      `${projectConfig.pwa.cachePrefix}old`,
      `${projectConfig.pwa.cachePrefix}test-version`,
      "unrelated-cache",
    ]),
    match: jest.fn(),
    open: jest.fn(async () => runtimeCache),
  };
  const fetch = jest.fn();
  const self = {
    addEventListener: (name, listener) => {
      listeners[name] = listener;
    },
    clients: { claim: jest.fn(async () => undefined) },
    location: { origin: new URL(projectConfig.site.url).origin },
    skipWaiting: jest.fn(),
  };
  const source = renderServiceWorker(
    readFileSync(path.join(process.cwd(), "site", "service-worker.js"), "utf8"),
    "test-version",
    apiAssets
  );
  vm.runInNewContext(source, { URL, caches, fetch, Promise, self });
  return { caches, fetch, listeners, runtimeCache, self };
}

test("API app-shell assets include local TypeDoc dependencies", () => {
  const html = `
    <link rel="canonical" href="${projectConfig.site.pages.api.url}">
    <link rel="stylesheet" href="assets/style.css">
    <script src="assets/main.js"></script>
    <svg><use href="assets/icons.svg#icon-search"></use></svg>
    <script src="https://cdn.example.com/external.js"></script>
  `;

  expect(apiAppShellAssets(html)).toEqual(apiAssets);
});

test("app-shell installation precaches API entry dependencies", async () => {
  const { fetch, listeners, runtimeCache } = evaluateWorker();
  fetch.mockResolvedValue({
    ok: true,
    status: 200,
    type: "basic",
  });
  let installation;

  listeners.install({
    waitUntil: (promise) => {
      installation = promise;
    },
  });
  await installation;

  const fetchedUrls = fetch.mock.calls.map(([url]) => url);
  for (const asset of apiAssets) {
    expect(fetchedUrls).toContain(asset);
    expect(runtimeCache.put).toHaveBeenCalledWith(
      asset,
      expect.objectContaining({ ok: true })
    );
  }
});

test("service worker ignores unsafe or out-of-scope requests", () => {
  const { listeners } = evaluateWorker();
  const respondWith = jest.fn();
  const request = (url, method = "GET") => ({
    destination: "document",
    method,
    mode: "navigate",
    url,
  });

  listeners.fetch({
    request: request(projectConfig.site.url, "POST"),
    respondWith,
  });
  listeners.fetch({
    request: request(`https://cdn.example.com${projectConfig.site.basePath}`),
    respondWith,
  });
  listeners.fetch({
    request: request(
      `${new URL(projectConfig.site.url).origin}/another-project/`
    ),
    respondWith,
  });

  expect(respondWith).not.toHaveBeenCalled();
});

test("cache write failures do not discard a successful network response", async () => {
  const { fetch, listeners, runtimeCache } = evaluateWorker();
  const response = {
    clone: jest.fn(() => ({ cached: true })),
    ok: true,
    status: 200,
    type: "basic",
  };
  runtimeCache.put.mockRejectedValue(new Error("Quota exceeded"));
  fetch.mockResolvedValue(response);
  let responsePromise;

  listeners.fetch({
    request: {
      destination: "script",
      method: "GET",
      mode: "no-cors",
      url: new URL("assets/shared.js", projectConfig.site.url).href,
    },
    respondWith: (promise) => {
      responsePromise = promise;
    },
  });

  await expect(responsePromise).resolves.toBe(response);
});

test("runtime cache trimming preserves precached app-shell entries", async () => {
  const { fetch, listeners, runtimeCache } = evaluateWorker();
  const shellRequest = {
    url: projectConfig.site.url,
  };
  const runtimeRequests = Array.from({ length: 97 }, (_, index) => ({
    url: new URL(`api/functions/example-${index}.html`, projectConfig.site.url)
      .href,
  }));
  runtimeCache.keys.mockResolvedValue([shellRequest, ...runtimeRequests]);
  fetch.mockResolvedValue({
    clone: jest.fn(() => ({ cached: true })),
    ok: true,
    status: 200,
    type: "basic",
  });
  let responsePromise;

  listeners.fetch({
    request: {
      destination: "document",
      method: "GET",
      mode: "navigate",
      url: runtimeRequests.at(-1).url,
    },
    respondWith: (promise) => {
      responsePromise = promise;
    },
  });
  await responsePromise;

  expect(runtimeCache.delete).toHaveBeenCalledWith(runtimeRequests[0]);
  expect(runtimeCache.delete).not.toHaveBeenCalledWith(shellRequest);
});

test("failed app-shell precaching aborts installation and removes partial cache", async () => {
  const { caches, fetch, listeners } = evaluateWorker();
  fetch.mockRejectedValue(new Error("Network unavailable"));
  let installation;

  listeners.install({
    waitUntil: (promise) => {
      installation = promise;
    },
  });

  await expect(installation).rejects.toThrow("Network unavailable");
  expect(caches.delete).toHaveBeenCalledWith(
    `${projectConfig.pwa.cachePrefix}test-version`
  );
});

test("offline responses come only from the current Mazey cache", async () => {
  const { caches, fetch, listeners, runtimeCache } = evaluateWorker();
  const currentResponse = { source: "current Mazey cache" };
  runtimeCache.match.mockResolvedValue(currentResponse);
  caches.match.mockResolvedValue({ source: "unrelated cache" });
  fetch.mockRejectedValue(new Error("Offline"));
  let responsePromise;
  const request = {
    destination: "script",
    method: "GET",
    mode: "no-cors",
    url: new URL("assets/shared.js", projectConfig.site.url).href,
  };

  listeners.fetch({
    request,
    respondWith: (promise) => {
      responsePromise = promise;
    },
  });

  await expect(responsePromise).resolves.toBe(currentResponse);
  expect(runtimeCache.match).toHaveBeenCalledWith(request);
  expect(caches.match).not.toHaveBeenCalled();
});

test("activation removes only obsolete Mazey caches", async () => {
  const { caches, listeners, self } = evaluateWorker();
  let activation;
  listeners.activate({
    waitUntil: (promise) => {
      activation = promise;
    },
  });
  await activation;

  expect(caches.delete).toHaveBeenCalledTimes(1);
  expect(caches.delete).toHaveBeenCalledWith(
    `${projectConfig.pwa.cachePrefix}old`
  );
  expect(self.clients.claim).toHaveBeenCalledTimes(1);
});
