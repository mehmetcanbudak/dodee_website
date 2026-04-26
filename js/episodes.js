/**
 * Episodes page: filter chips (All / Out now / Coming soon).
 * Uses role="group" + aria-pressed (not tabs) so behavior matches the markup—no tabpanels required.
 */
function initEpisodeFilters(root) {
  const group = root.querySelector(".episode-filters");
  const buttons = group
    ? Array.from(group.querySelectorAll("button[data-filter]"))
    : [];
  const cards = Array.from(root.querySelectorAll("[data-episode-status]"));
  if (!group || buttons.length === 0 || cards.length === 0) return;

  const applyFilter = (value) => {
    for (const card of cards) {
      const status = card.getAttribute("data-episode-status");
      const show = value === "all" || status === value;
      card.hidden = !show;
    }
    for (const btn of buttons) {
      const pressed = btn.getAttribute("data-filter") === value;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    }
  };

  group.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const btn = t.closest("button[data-filter]");
    if (!btn || !group.contains(btn)) return;
    const value = btn.getAttribute("data-filter");
    if (value) applyFilter(value);
  });

  group.addEventListener("keydown", (e) => {
    if (!(e instanceof KeyboardEvent)) return;
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next = (i + 1) % buttons.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      next = (i - 1 + buttons.length) % buttons.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = buttons.length - 1;
    } else {
      return;
    }
    buttons[next].focus();
    const value = buttons[next].getAttribute("data-filter");
    if (value) applyFilter(value);
  });

  applyFilter("all");
}

const root = document.querySelector("[data-episodes-page]");
if (root instanceof HTMLElement) initEpisodeFilters(root);
