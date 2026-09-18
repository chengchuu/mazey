export interface SitePwaConfig {
  appName: string;
  enabled: boolean;
  scope: string;
  serviceWorkerUrl: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithIdleCallback {
  requestIdleCallback?: (callback: () => void) => number;
}

function listenForMediaChanges(
  media: MediaQueryList,
  listener: () => void
): () => void {
  if (media.addEventListener) {
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }
  media.addListener(listener);
  return () => media.removeListener(listener);
}

function announce(documentRef: Document, message: string): void {
  documentRef
    .querySelectorAll<HTMLElement>("[data-pwa-status]")
    .forEach((region) => {
      region.textContent = message;
    });
}

export function isStandaloneMode(
  windowRef: Window,
  navigatorRef: NavigatorWithStandalone
): boolean {
  return (
    windowRef.matchMedia("(display-mode: standalone)").matches ||
    navigatorRef.standalone === true
  );
}

export function shouldRegisterSiteServiceWorker(
  config: SitePwaConfig,
  locationRef: Location,
  navigatorRef: Navigator
): boolean {
  const isLocalhost = new Set(["localhost", "127.0.0.1", "[::1]"]).has(
    locationRef.hostname
  );
  return (
    config.enabled &&
    "serviceWorker" in navigatorRef &&
    (locationRef.protocol === "https:" || isLocalhost) &&
    locationRef.pathname.startsWith(config.scope)
  );
}

export function initializeInstallExperience(
  documentRef: Document,
  windowRef: Window,
  navigatorRef: NavigatorWithStandalone,
  appName: string
): () => void {
  const buttons = Array.from(
    documentRef.querySelectorAll<HTMLButtonElement>("[data-pwa-install]")
  );
  const help = Array.from(
    documentRef.querySelectorAll<HTMLElement>("[data-pwa-install-help]")
  );
  const displayMode = windowRef.matchMedia("(display-mode: standalone)");
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  const hideButtons = () => {
    buttons.forEach((button) => {
      button.hidden = true;
      const container = button.closest<HTMLElement>(
        "[data-pwa-install-container]"
      );
      if (container) container.hidden = true;
    });
  };
  const showInstalledState = () => {
    deferredPrompt = null;
    hideButtons();
    help.forEach((element) => {
      element.hidden = true;
    });
  };
  const handlePrompt = (event: Event) => {
    if (isStandaloneMode(windowRef, navigatorRef)) return;
    const promptEvent = event as BeforeInstallPromptEvent;
    promptEvent.preventDefault();
    deferredPrompt = promptEvent;
    buttons.forEach((button) => {
      button.disabled = false;
      button.hidden = false;
      const container = button.closest<HTMLElement>(
        "[data-pwa-install-container]"
      );
      if (container) container.hidden = false;
    });
  };
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    buttons.forEach((button) => {
      button.disabled = true;
    });
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      announce(
        documentRef,
        choice.outcome === "accepted"
          ? "The app installation was accepted."
          : "Installation was dismissed. You can use the browser install menu later."
      );
    } catch {
      announce(
        documentRef,
        "The browser could not open its installation prompt. Use the browser install menu instead."
      );
    } finally {
      hideButtons();
    }
  };
  const handleInstalled = () => {
    showInstalledState();
    announce(documentRef, `${appName} was installed.`);
  };
  const handleDisplayMode = () => {
    if (isStandaloneMode(windowRef, navigatorRef)) showInstalledState();
  };

  if (isStandaloneMode(windowRef, navigatorRef)) showInstalledState();
  buttons.forEach((button) => button.addEventListener("click", handleInstall));
  windowRef.addEventListener("beforeinstallprompt", handlePrompt);
  windowRef.addEventListener("appinstalled", handleInstalled);
  const removeDisplayModeListener = listenForMediaChanges(
    displayMode,
    handleDisplayMode
  );

  return () => {
    buttons.forEach((button) =>
      button.removeEventListener("click", handleInstall)
    );
    windowRef.removeEventListener("beforeinstallprompt", handlePrompt);
    windowRef.removeEventListener("appinstalled", handleInstalled);
    removeDisplayModeListener();
  };
}

export function monitorServiceWorkerUpdates(
  registration: ServiceWorkerRegistration,
  documentRef: Document,
  navigatorRef: Navigator,
  windowRef: Window,
  appName: string
): () => void {
  const notice = documentRef.querySelector<HTMLElement>("[data-pwa-update]");
  const updateButton = documentRef.querySelector<HTMLButtonElement>(
    "[data-pwa-update-now]"
  );
  let waitingWorker: ServiceWorker | null = registration.waiting;
  let installingWorker: ServiceWorker | null = null;
  let reloadRequested = false;

  const showUpdate = (worker: ServiceWorker) => {
    waitingWorker = worker;
    if (notice) notice.hidden = false;
    announce(
      documentRef,
      `A new version of the ${appName} website is available.`
    );
  };
  const handleStateChange = () => {
    if (
      installingWorker?.state === "installed" &&
      navigatorRef.serviceWorker.controller
    ) {
      showUpdate(installingWorker);
    }
  };
  const handleUpdateFound = () => {
    installingWorker?.removeEventListener("statechange", handleStateChange);
    installingWorker = registration.installing;
    installingWorker?.addEventListener("statechange", handleStateChange);
    handleStateChange();
  };
  const handleUpdate = () => {
    if (!waitingWorker) return;
    reloadRequested = true;
    if (updateButton) updateButton.disabled = true;
    announce(documentRef, "Updating the website now.");
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };
  const handleControllerChange = () => {
    if (notice) notice.hidden = true;
    if (!reloadRequested) return;
    reloadRequested = false;
    windowRef.location.reload();
  };

  if (registration.waiting && navigatorRef.serviceWorker.controller) {
    showUpdate(registration.waiting);
  }
  registration.addEventListener("updatefound", handleUpdateFound);
  if (registration.installing) handleUpdateFound();
  updateButton?.addEventListener("click", handleUpdate);
  navigatorRef.serviceWorker.addEventListener(
    "controllerchange",
    handleControllerChange
  );

  return () => {
    registration.removeEventListener("updatefound", handleUpdateFound);
    installingWorker?.removeEventListener("statechange", handleStateChange);
    updateButton?.removeEventListener("click", handleUpdate);
    navigatorRef.serviceWorker.removeEventListener(
      "controllerchange",
      handleControllerChange
    );
  };
}

export async function registerSiteServiceWorker(
  config: SitePwaConfig,
  documentRef: Document,
  windowRef: Window,
  navigatorRef: Navigator
): Promise<ServiceWorkerRegistration | null> {
  if (
    !shouldRegisterSiteServiceWorker(config, windowRef.location, navigatorRef)
  ) {
    return null;
  }
  try {
    const registration = await navigatorRef.serviceWorker.register(
      config.serviceWorkerUrl,
      { scope: config.scope }
    );
    monitorServiceWorkerUpdates(
      registration,
      documentRef,
      navigatorRef,
      windowRef,
      config.appName
    );
    return registration;
  } catch (error) {
    console.error(
      `Failed to register the ${config.appName} service worker.`,
      error
    );
    return null;
  }
}

export function initializeSitePwa(config: SitePwaConfig): void {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof navigator === "undefined"
  ) {
    return;
  }
  const root = document.documentElement;
  if (root.dataset.pwaReady === "true") return;
  root.dataset.pwaReady = "true";

  initializeInstallExperience(document, window, navigator, config.appName);
  if (!shouldRegisterSiteServiceWorker(config, window.location, navigator))
    return;

  const scheduleRegistration = () => {
    const idleWindow = window as unknown as WindowWithIdleCallback;
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(() => {
        void registerSiteServiceWorker(config, document, window, navigator);
      });
    } else {
      window.setTimeout(() => {
        void registerSiteServiceWorker(config, document, window, navigator);
      }, 0);
    }
  };
  if (document.readyState === "complete") scheduleRegistration();
  else window.addEventListener("load", scheduleRegistration, { once: true });
}
