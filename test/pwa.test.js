/** @jest-environment jsdom */
/* eslint-env browser, jest */

import { jest } from "@jest/globals";
import projectConfig from "../project.config";
import {
  initializeInstallExperience,
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
  const waiting = { postMessage: jest.fn() };
  const registration = Object.assign(new EventTarget(), {
    installing: null,
    waiting,
  });
  const registrationListener = jest.spyOn(registration, "addEventListener");
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: {},
    register: jest.fn().mockResolvedValue(registration),
  });
  const serviceWorkerListener = jest.spyOn(serviceWorker, "addEventListener");
  const reload = jest.fn();
  const location = {
    hostname: "chengchuu.github.io",
    pathname: projectConfig.site.basePath,
    protocol: "https:",
    reload,
  };

  await registerSiteServiceWorker(
    {
      appName,
      enabled: true,
      scope: projectConfig.site.basePath,
      serviceWorkerUrl: projectConfig.pwa.serviceWorkerUrl,
    },
    { location },
    { serviceWorker }
  );

  expect(serviceWorker.register).toHaveBeenCalledWith(
    projectConfig.pwa.serviceWorkerUrl,
    { scope: projectConfig.site.basePath }
  );
  expect(registrationListener).not.toHaveBeenCalled();
  expect(serviceWorkerListener).not.toHaveBeenCalled();
  serviceWorker.dispatchEvent(new Event("controllerchange"));
  expect(waiting.postMessage).not.toHaveBeenCalled();
  expect(reload).not.toHaveBeenCalled();
  expect(document.querySelector("[data-pwa-status]").textContent).toBe("");
});
