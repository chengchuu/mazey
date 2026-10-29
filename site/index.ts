import { SITE_RUNTIME_CONFIG } from "./runtime-config";
import { getQuickAccessDestination } from "./quick-access";

const quickAccessDestination = getQuickAccessDestination(
  new URL(window.location.href),
  SITE_RUNTIME_CONFIG.basePath,
  SITE_RUNTIME_CONFIG.quickAccessStorageKey
);
if (quickAccessDestination) window.location.replace(quickAccessDestination);

const copyButton = document.querySelector<HTMLButtonElement>(
  "[data-copy-install]"
);
const copyStatus = document.querySelector<HTMLElement>("[data-copy-status]");

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(SITE_RUNTIME_CONFIG.installCommand);
    if (copyStatus) copyStatus.textContent = "Install command copied.";
  } catch {
    if (copyStatus) {
      copyStatus.textContent =
        "Copy was unavailable. Select the command manually.";
    }
  }
});
