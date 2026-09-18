import "./api.css";
import { initializeSitePwa } from "./pwa";
import { SITE_RUNTIME_CONFIG } from "./runtime-config";
import { initializeThemeControls } from "./theme";

initializeThemeControls(SITE_RUNTIME_CONFIG.themeStorageKey);
initializeSitePwa(SITE_RUNTIME_CONFIG.pwa);
