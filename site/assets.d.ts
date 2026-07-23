declare module "*.css";
declare module "*.png";

declare module "bootstrap/js/dist/collapse" {
  interface CollapseOptions {
    toggle?: boolean;
  }

  export default class Collapse {
    constructor(element: Element, options?: CollapseOptions);
    static getOrCreateInstance(
      element: Element,
      options?: CollapseOptions
    ): Collapse;
    hide(): void;
    toggle(): void;
  }
}

declare module "bootstrap/js/dist/tab" {
  export default class Tab {
    constructor(element: Element);
    static getInstance(element: Element): Tab | null;
    static getOrCreateInstance(element: Element): Tab;
    dispose(): void;
    show(): void;
  }
}
