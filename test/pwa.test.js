/** @jest-environment jsdom */
/* eslint-env browser, jest */

import { jest } from "@jest/globals";
import projectConfig from "../project.config";
import {
  initializeInstallExperience,
  monitorServiceWorkerUpdates,
  registerSiteServiceWorker,
} from "../site/pwa";

const appName = projectConfig.brand.displayName;

function renderPwaControls() {
  document.body.innerHTML = `
    <section data-pwa-install-help>
      <span data-pwa-install-container hidden>
        <button type="button" data-pwa-install hidden>Install app</button>
      </span>
    </section>
    <aside data-pwa-update hidden>
      <button type="button" data-pwa-update-now>Update now</button>
    </aside>
    <p data-pwa-status></p>
  `;
}

test("install state changes use standard MediaQueryList listeners", () => {
  renderPwaControls();
  const media = {
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const windowRef = Object.assign(new EventTarget(), {
    matchMedia: () => media,
  });
  const cleanup = initializeInstallExperience(
    document,
    windowRef,
    navigator,
    appName
  );

  expect(media.addEventListener).toHaveBeenCalledTimes(1);
  cleanup();
  expect(media.removeEventListener).toHaveBeenCalledTimes(1);
});

test("service worker registration uses the configured URL and scope", async () => {
  renderPwaControls();
  const registration = Object.assign(new EventTarget(), {
    installing: null,
    waiting: null,
  });
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: null,
    register: jest.fn().mockResolvedValue(registration),
  });
  const location = {
    hostname: "chengchuu.github.io",
    pathname: projectConfig.site.basePath,
    protocol: "https:",
  };

  await registerSiteServiceWorker(
    {
      appName,
      enabled: true,
      scope: projectConfig.site.basePath,
      serviceWorkerUrl: projectConfig.pwa.serviceWorkerUrl,
    },
    document,
    { location },
    { serviceWorker }
  );

  expect(serviceWorker.register).toHaveBeenCalledWith(
    projectConfig.pwa.serviceWorkerUrl,
    { scope: projectConfig.site.basePath }
  );
});

test("waiting service workers reload only after explicit confirmation", () => {
  renderPwaControls();
  const waiting = { postMessage: jest.fn() };
  const registration = Object.assign(new EventTarget(), {
    installing: null,
    waiting,
  });
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: {},
  });
  const windowRef = { location: { reload: jest.fn() } };
  const cleanup = monitorServiceWorkerUpdates(
    registration,
    document,
    { serviceWorker },
    windowRef,
    appName
  );

  serviceWorker.dispatchEvent(new Event("controllerchange"));
  expect(windowRef.location.reload).not.toHaveBeenCalled();
  document.querySelector("[data-pwa-update-now]").click();
  expect(waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  serviceWorker.dispatchEvent(new Event("controllerchange"));
  serviceWorker.dispatchEvent(new Event("controllerchange"));
  expect(windowRef.location.reload).toHaveBeenCalledTimes(1);
  cleanup();
});
