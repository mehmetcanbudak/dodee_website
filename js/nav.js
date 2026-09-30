const MOBILE_NAV_QUERY = "(max-width: 64rem)";

function init() {
  const nav = document.querySelector(".site-nav");
  const toggle = document.getElementById("primary-nav-toggle");
  const list = document.getElementById("primary-nav-list");
  if (!(nav instanceof HTMLElement) || !(toggle instanceof HTMLButtonElement) || !list) return;

  const mq = window.matchMedia(MOBILE_NAV_QUERY);

  function setMenuOpen(open, restoreFocus = false) {
    open = open && mq.matches;
    nav.classList.toggle("is-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-nav-open", open);
    // CSS opacity/pointer-events alone leave collapsed links in the tab order.
    list.inert = mq.matches && !open;
    if (list.inert) list.setAttribute("aria-hidden", "true");
    else list.removeAttribute("aria-hidden");
    if (restoreFocus && mq.matches) toggle.focus();
  }

  toggle.addEventListener("click", () => {
    if (mq.matches) setMenuOpen(!nav.classList.contains("is-menu-open"));
  });

  // Leave link activation to the browser. Collapsing the list (making it inert)
  // or moving focus can cancel navigation, even in a task queued after the click.
  // Cross-document links arrive at a page whose menu is already closed.

  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !nav.contains(event.target)) {
      setMenuOpen(false, list.contains(document.activeElement));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-menu-open")) {
      event.preventDefault();
      setMenuOpen(false, true);
    }
  });

  // This is a navigation disclosure, not a modal. Tab can reach Close and leave it.
  nav.addEventListener("focusout", () => {
    queueMicrotask(() => {
      if (!nav.contains(document.activeElement)) setMenuOpen(false);
    });
  });

  const onBreakpointChange = () => {
    const active = document.activeElement;
    setMenuOpen(false, mq.matches && list.contains(active));
    if (!mq.matches && active === toggle) list.querySelector("a[href]")?.focus();
  };
  if (typeof mq.addEventListener === "function") mq.addEventListener("change", onBreakpointChange);
  else mq.addListener(onBreakpointChange);

  nav.dataset.enhanced = "true";
  setMenuOpen(false);
}

// Loaded as a parser-blocking script immediately after the navigation markup.
// Initialize before the rest of the page paints to avoid shifting the fallback menu.
init();
