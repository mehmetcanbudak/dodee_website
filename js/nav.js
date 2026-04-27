const MOBILE_NAV_QUERY = "(max-width: 64rem)";

/**
 * @returns {boolean}
 */
function isMobileNav() {
  return window.matchMedia(MOBILE_NAV_QUERY).matches;
}

/**
 * @returns {null | { nav: HTMLElement, toggle: HTMLButtonElement, list: HTMLElement }}
 */
function getNav() {
  const nav = document.querySelector(".site-nav");
  const toggle = document.getElementById("primary-nav-toggle");
  const list = document.getElementById("primary-nav-list");
  if (!(nav instanceof HTMLElement) || !(toggle instanceof HTMLButtonElement) || !list) {
    return null;
  }
  return { nav, toggle, list };
}

/**
 * @param {boolean} open
 */
function setMenuOpen(open) {
  const parts = getNav();
  if (!parts) {
    return;
  }
  const { nav, toggle, list } = parts;
  const wasOpen = nav.classList.contains("is-menu-open");

  nav.classList.toggle("is-menu-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.classList.toggle("is-nav-open", open);

  if (open) {
    const firstLink = list.querySelector("a");
    if (firstLink instanceof HTMLAnchorElement) {
      requestAnimationFrame(() => firstLink.focus());
    }
  } else if (wasOpen) {
    toggle.focus();
  }
}

function closeMenu() {
  setMenuOpen(false);
}

function init() {
  const parts = getNav();
  if (!parts) {
    return;
  }
  const { nav, toggle, list } = parts;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isMobileNav()) {
      return;
    }
    setMenuOpen(!nav.classList.contains("is-menu-open"));
  });

  list.addEventListener("click", (e) => {
    if (!isMobileNav() || !nav.classList.contains("is-menu-open")) {
      return;
    }
    const t = e.target;
    if (t instanceof Element && t.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener(
    "click",
    (e) => {
      if (!isMobileNav() || !nav.classList.contains("is-menu-open")) {
        return;
      }
      const t = e.target;
      if (t instanceof Node && nav.contains(t)) {
        return;
      }
      closeMenu();
    },
    { capture: true }
  );

  document.addEventListener("keydown", (e) => {
    if (!nav.classList.contains("is-menu-open")) return;

    // Close on Escape
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }

    // Focus trap: keep Tab within the mobile menu
    if (e.key === "Tab" && isMobileNav()) {
      const focusable = list.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  const mq = window.matchMedia(MOBILE_NAV_QUERY);
  const onBreakpointChange = () => {
    if (!mq.matches) {
      closeMenu();
    }
  };
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onBreakpointChange);
  } else {
    mq.addListener(onBreakpointChange);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
