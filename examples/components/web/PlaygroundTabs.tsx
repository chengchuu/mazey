import { useEffect, useRef, useState } from "react";

import type { KeyboardEvent } from "react";

import { AspectRatioExample } from "./AspectRatioExample";
import { CAGRExample } from "./CAGRExample";
import { DateIntervalExample } from "./DateIntervalExample";
import { ExamplePanel } from "./ExamplePanel";

export type PlaygroundTabId = "date-interval" | "cagr" | "aspect-ratio";

const playgroundTabs = [
  { id: "date-interval", label: "Date interval" },
  { id: "cagr", label: "CAGR" },
  { id: "aspect-ratio", label: "Aspect ratio" },
] as const;

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
  const [activeTab, setActiveTab] = useState<PlaygroundTabId>(readInitialTab);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

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
        </ExamplePanel>
        <ExamplePanel
          id="cagr"
          labelledBy="cagr-tab"
          active={activeTab === "cagr"}
        >
          <CAGRExample />
        </ExamplePanel>
        <ExamplePanel
          id="aspect-ratio"
          labelledBy="aspect-ratio-tab"
          active={activeTab === "aspect-ratio"}
        >
          <AspectRatioExample />
        </ExamplePanel>
      </div>
    </section>
  );
}
