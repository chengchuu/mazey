interface CollapseInstance {
  hide(): void;
  toggle(): void;
}

interface CollapseConstructor {
  getOrCreateInstance(
    element: Element,
    options: { toggle: boolean }
  ): CollapseInstance;
}

export function initializeNavigation(
  Collapse: CollapseConstructor,
  documentRef: Document = document
): void {
  documentRef
    .querySelectorAll<HTMLElement>("[data-site-navbar]")
    .forEach((navbar) => {
      if (navbar.dataset.navigationReady === "true") return;

      const toggle =
        navbar.querySelector<HTMLButtonElement>("[data-nav-toggle]");
      const navigation = navbar.querySelector<HTMLElement>("[data-mobile-nav]");
      if (!toggle || !navigation) return;

      navbar.dataset.navigationReady = "true";
      documentRef.documentElement.dataset.navEnhanced = "true";
      navigation.classList.add("collapse");
      const collapse = Collapse.getOrCreateInstance(navigation, {
        toggle: false,
      });
      let restoreFocus = false;

      toggle.addEventListener("click", () => collapse.toggle());
      navigation.addEventListener("show.bs.collapse", () => {
        toggle.setAttribute("aria-expanded", "true");
      });
      navigation.addEventListener("hide.bs.collapse", () => {
        toggle.setAttribute("aria-expanded", "false");
      });
      navigation.addEventListener("hidden.bs.collapse", () => {
        if (restoreFocus) toggle.focus();
        restoreFocus = false;
      });
      navigation.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest("a") && navigation.classList.contains("show")) {
          collapse.hide();
        }
      });
      documentRef.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !navigation.classList.contains("show"))
          return;
        restoreFocus = true;
        collapse.hide();
      });
    });
}
