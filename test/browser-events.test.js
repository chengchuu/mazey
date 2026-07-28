/** @jest-environment jsdom */
/* eslint-env browser, jest */

import {
  listenMediaQueryChanges,
  watchServiceWorkerUpdates,
} from "../lib/index.esm";

function createWorker(state = "installing") {
  return Object.assign(new EventTarget(), {
    postMessage: jest.fn(),
    state,
  });
}

function createServiceWorkerState({
  controller = {},
  installing = null,
  waiting = null,
} = {}) {
  return {
    container: Object.assign(new EventTarget(), { controller }),
    registration: Object.assign(new EventTarget(), { installing, waiting }),
  };
}

describe("listenMediaQueryChanges", () => {
  it("uses the modern API and removes the listener once", () => {
    const media = Object.assign(new EventTarget(), {
      matches: false,
      media: "(prefers-color-scheme: dark)",
    });
    const add = jest.spyOn(media, "addEventListener");
    const remove = jest.spyOn(media, "removeEventListener");
    const listener = jest.fn();
    const dispose = listenMediaQueryChanges(media, listener);
    const event = Object.assign(new Event("change"), {
      matches: true,
      media: media.media,
    });

    media.dispatchEvent(event);
    expect(listener).toHaveBeenCalledWith(event);
    expect(add).toHaveBeenCalledWith("change", listener);

    dispose();
    dispose();
    expect(remove).toHaveBeenCalledTimes(1);
    media.dispatchEvent(event);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("falls back to the legacy listener API", () => {
    let registeredListener;
    const media = {
      addListener: jest.fn(listener => {
        registeredListener = listener;
      }),
      removeListener: jest.fn(),
    };
    const listener = jest.fn();
    const dispose = listenMediaQueryChanges(media, listener);
    const event = { matches: true };

    registeredListener(event);
    expect(listener).toHaveBeenCalledWith(event);
    dispose();
    dispose();
    expect(media.removeListener).toHaveBeenCalledTimes(1);
    expect(media.removeListener).toHaveBeenCalledWith(listener);
  });

  it("returns inert cleanup when media or compatible APIs are unavailable", () => {
    const listener = jest.fn();
    expect(() => listenMediaQueryChanges(null, listener)()).not.toThrow();
    expect(() => listenMediaQueryChanges({}, listener)()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it("rejects invalid runtime inputs", () => {
    expect(() => listenMediaQueryChanges(null, null)).toThrow(TypeError);
    expect(() => listenMediaQueryChanges("dark", jest.fn())).toThrow(TypeError);
  });
});

describe("watchServiceWorkerUpdates", () => {
  it("reports and activates an existing waiting update", () => {
    const waiting = createWorker("installed");
    const { container, registration } = createServiceWorkerState({ waiting });
    const onUpdateAvailable = jest.fn();
    const watcher = watchServiceWorkerUpdates(registration, container, {
      onUpdateAvailable,
    });

    expect(onUpdateAvailable).toHaveBeenCalledWith(waiting);
    expect(watcher.activateWaiting()).toBe(true);
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(watcher.activateWaiting({ type: "CUSTOM" })).toBe(true);
    expect(waiting.postMessage).toHaveBeenLastCalledWith({ type: "CUSTOM" });
  });

  it("reports a newly installed worker only when the page has a controller", () => {
    const installing = createWorker();
    const state = createServiceWorkerState({ installing });
    const onUpdateAvailable = jest.fn();
    const watcher = watchServiceWorkerUpdates(
      state.registration,
      state.container,
      { onUpdateAvailable }
    );

    installing.state = "installed";
    installing.dispatchEvent(new Event("statechange"));
    installing.dispatchEvent(new Event("statechange"));
    expect(onUpdateAvailable).toHaveBeenCalledTimes(1);
    expect(onUpdateAvailable).toHaveBeenCalledWith(installing);
    watcher.dispose();

    const firstInstall = createWorker("installed");
    const uncontrolled = createServiceWorkerState({
      controller: null,
      installing: firstInstall,
    });
    const onFirstInstall = jest.fn();
    watchServiceWorkerUpdates(uncontrolled.registration, uncontrolled.container, {
      onUpdateAvailable: onFirstInstall,
    });
    expect(onFirstInstall).not.toHaveBeenCalled();
  });

  it("tracks replacement installers and detaches the previous worker", () => {
    const first = createWorker();
    const second = createWorker();
    const { container, registration } = createServiceWorkerState({
      installing: first,
    });
    const onUpdateAvailable = jest.fn();
    watchServiceWorkerUpdates(registration, container, { onUpdateAvailable });

    registration.installing = second;
    registration.dispatchEvent(new Event("updatefound"));
    first.state = "installed";
    first.dispatchEvent(new Event("statechange"));
    expect(onUpdateAvailable).not.toHaveBeenCalled();

    second.state = "installed";
    second.dispatchEvent(new Event("statechange"));
    expect(onUpdateAvailable).toHaveBeenCalledWith(second);
  });

  it("forwards controller changes and disposes every listener once", () => {
    const waiting = createWorker("installed");
    const { container, registration } = createServiceWorkerState({ waiting });
    const onControllerChange = jest.fn();
    const watcher = watchServiceWorkerUpdates(registration, container, {
      onUpdateAvailable: jest.fn(),
      onControllerChange,
    });
    const removeRegistration = jest.spyOn(registration, "removeEventListener");
    const removeContainer = jest.spyOn(container, "removeEventListener");

    container.dispatchEvent(new Event("controllerchange"));
    expect(onControllerChange).toHaveBeenCalledTimes(1);
    expect(watcher.activateWaiting()).toBe(true);

    watcher.dispose();
    watcher.dispose();
    expect(removeRegistration).toHaveBeenCalledTimes(1);
    expect(removeContainer).toHaveBeenCalledTimes(1);
    container.dispatchEvent(new Event("controllerchange"));
    registration.dispatchEvent(new Event("updatefound"));
    expect(onControllerChange).toHaveBeenCalledTimes(1);
  });

  it("returns false when no worker is waiting or messaging fails", () => {
    const empty = createServiceWorkerState();
    const emptyWatcher = watchServiceWorkerUpdates(
      empty.registration,
      empty.container,
      { onUpdateAvailable: jest.fn() }
    );
    expect(emptyWatcher.activateWaiting()).toBe(false);

    const waiting = createWorker("installed");
    waiting.postMessage.mockImplementation(() => {
      throw new Error("message rejected");
    });
    const state = createServiceWorkerState({ waiting });
    const watcher = watchServiceWorkerUpdates(state.registration, state.container, {
      onUpdateAvailable: jest.fn(),
    });
    expect(watcher.activateWaiting()).toBe(false);
  });

  it("rolls back listeners when initial update notification throws", () => {
    const waiting = createWorker("installed");
    const { container, registration } = createServiceWorkerState({ waiting });
    const removeRegistration = jest.spyOn(registration, "removeEventListener");
    const removeContainer = jest.spyOn(container, "removeEventListener");

    expect(() =>
      watchServiceWorkerUpdates(registration, container, {
        onUpdateAvailable() {
          throw new Error("notification failed");
        },
      })
    ).toThrow("notification failed");
    expect(removeRegistration).toHaveBeenCalledWith(
      "updatefound",
      expect.any(Function)
    );
    expect(removeContainer).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function)
    );
  });

  it("rejects invalid runtime dependencies", () => {
    const state = createServiceWorkerState();
    expect(() =>
      watchServiceWorkerUpdates(null, state.container, {
        onUpdateAvailable: jest.fn(),
      })
    ).toThrow(TypeError);
    expect(() =>
      watchServiceWorkerUpdates(state.registration, null, {
        onUpdateAvailable: jest.fn(),
      })
    ).toThrow(TypeError);
    expect(() =>
      watchServiceWorkerUpdates(state.registration, state.container, {})
    ).toThrow(TypeError);
  });
});
