import type { SitePwaConfig } from "./pwa";

export interface SiteRuntimeConfig {
  basePath: string;
  quickAccessStorageKey: string;
  installCommand: string;
  themeStorageKey: string;
  pwa: SitePwaConfig;
}

declare const __SITE_RUNTIME_CONFIG__: SiteRuntimeConfig;

export const SITE_RUNTIME_CONFIG = Object.freeze(__SITE_RUNTIME_CONFIG__);
