import { useEffect, useRef, useState } from "react";

import type { KeyboardEvent } from "react";
import { playgroundTabs } from "../../../site/quick-access";
import type { PlaygroundTabId } from "../../../site/quick-access";
import { SITE_RUNTIME_CONFIG } from "../../../site/runtime-config";
import { useQuickAccess } from "../hooks/useQuickAccess";

import { AspectRatioExample } from "./AspectRatioExample";
import { CAGRExample } from "./CAGRExample";
import { DateIntervalExample } from "./DateIntervalExample";
import { ExamplePanel } from "./ExamplePanel";

export type { PlaygroundTabId } from "../../../site/quick-access";

export function parsePlaygroundTabHash(hash: string): PlaygroundTabId | null {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  return playgroundTabs.some((tab) => tab.id === id)
    ? (id as PlaygroundTabId)
    : null;
}

function readInitialTab(): PlaygroundTabId {
  if (typeof window === "undefined") return "date-interval";
  return parsePlaygroundTabHash(window.location.hash) ?? "date-interval";
}

function replaceTabHash(tabId: PlaygroundTabId): void {
  if (typeof window === "undefined" || window.location.hash === `#${tabId}`) {
    return;
  }
  try {
    window.history.replaceState(null, "", `#${tabId}`);
  } catch {
    // History can be restricted in embedded or privacy-focused environments.
  }
}

export function PlaygroundTabs(): React.JSX.Element {
  const {
    standalone,
    selected: quickAccess,
    error: storageError,
    toggle,
  } = useQuickAccess(SITE_RUNTIME_CONFIG.quickAccessStorageKey);
  const [activeTab, setActiveTab] = useState<PlaygroundTabId>(readInitialTab);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const quickAccessControl = standalone ? (
    <div className="border-top mt-4 pt-3">
      <button
        type="button"
        className={`btn ${
          quickAccess === activeTab ? "btn-primary" : "btn-outline-primary"
        }`}
        aria-pressed={quickAccess === activeTab}
        onClick={() => toggle(activeTab)}
      >
        Quick access
      </button>
      <p className="small text-muted mt-2 mb-0">
        {quickAccess === activeTab
          ? "Enabled. This module opens when the app starts. Click again to disable."
          : "Open this module when the app starts."}
      </p>
      {storageError && <p role="alert">{storageError}</p>}
    </div>
  ) : null;

  useEffect(() => {
    const handleHashChange = (): void => {
      const tab = parsePlaygroundTabHash(window.location.hash);
      if (tab) setActiveTab(tab);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const selectTab = (tabId: PlaygroundTabId, moveFocus = false): void => {
    setActiveTab(tabId);
    replaceTabHash(tabId);
    if (moveFocus) {
      const index = playgroundTabs.findIndex((tab) => tab.id === tabId);
      tabRefs.current[index]?.focus();
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ): void => {
    let nextIndex: number | null = null;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % playgroundTabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + playgroundTabs.length) % playgroundTabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = playgroundTabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectTab(playgroundTabs[nextIndex].id, true);
  };

  return (
    <section
      className="playground-panel mb-4"
      aria-labelledby="playground-examples-title"
    >
      <h2 id="playground-examples-title" className="visually-hidden">
        Interactive utility examples
      </h2>
      <ul
        className="nav nav-tabs playground-tabs flex-nowrap overflow-x-auto text-nowrap px-3 pt-3"
        role="tablist"
        aria-label="Utility examples"
      >
        {playgroundTabs.map((tab, index) => {
          const active = tab.id === activeTab;
          return (
            <li className="nav-item" role="presentation" key={tab.id}>
              <button
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={`${tab.id}-tab`}
                className={`nav-link${active ? " active" : ""}`}
                type="button"
                role="tab"
                aria-controls={tab.id}
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="tab-content p-4">
        <ExamplePanel
          id="date-interval"
          labelledBy="date-interval-tab"
          active={activeTab === "date-interval"}
        >
          <DateIntervalExample />
          {activeTab === "date-interval" && quickAccessControl}
        </ExamplePanel>
        <ExamplePanel
          id="cagr"
          labelledBy="cagr-tab"
          active={activeTab === "cagr"}
        >
          <CAGRExample />
          {activeTab === "cagr" && quickAccessControl}
        </ExamplePanel>
        <ExamplePanel
          id="aspect-ratio"
          labelledBy="aspect-ratio-tab"
          active={activeTab === "aspect-ratio"}
        >
          <AspectRatioExample />
          {activeTab === "aspect-ratio" && quickAccessControl}
        </ExamplePanel>
      </div>
    </section>
  );
}
