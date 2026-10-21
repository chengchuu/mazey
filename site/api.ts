import "./api.css";
import { enableHomeBypass } from "./quick-access";
import { initializeSitePwa } from "./pwa";
import { SITE_RUNTIME_CONFIG } from "./runtime-config";
import { initializeThemeControls } from "./theme";

initializeThemeControls(SITE_RUNTIME_CONFIG.themeStorageKey);
enableHomeBypass(SITE_RUNTIME_CONFIG.basePath);
initializeSitePwa(SITE_RUNTIME_CONFIG.pwa);
