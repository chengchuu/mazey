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
