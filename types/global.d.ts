/**
 * @author Cheng
 */
import $ from "jquery";
import { DefineListeners, BrowserInfo } from "../src/typing";

declare global {
  interface PerformanceEntry {
    readonly processingStart?: DOMHighResTimeStamp;
    readonly processingEnd?: DOMHighResTimeStamp;
    readonly value?: number;
  }

  interface NetworkInformation {
    readonly rtt?: number;
    readonly downlink?: number;
    readonly effectiveType?: string;
    readonly saveData?: boolean;
  }

  interface Navigator {
    readonly connection?: NetworkInformation;
  }

  interface HTMLLinkElement {
    onreadystatechange: any;
    readyState: any;
    sheet: any;
  }

  interface HTMLScriptElement {
    readyState: any;
    onreadystatechange: any;
    parentNode: any;
  }

  interface Console {
    [key: string]: any;
  }

  interface ErrorEvent {
    type?: string;
    time?: number;
    readonly message: string;
    readonly filename: string; // Deprecated, but still supported.
    fileName?: string;
    readonly lineno: number; // Deprecated, but still supported.
    line?: number;
    readonly colno: number; // Deprecated, but still supported.
    column?: number;
    stack?: string;
    name?: string;
  }

  interface URLSearchParams {
    entries: () => IterableIterator<[string, string]>;
  }

  interface Window {
    // VAR
    MAZEY_DEFINE_LISTENERS: {
      [key: string]: DefineListeners;
    };
    MAZEY_BROWSER_INFO: BrowserInfo;
    // LIB
    $: typeof $;
    jQuery: typeof $;
  }
}
