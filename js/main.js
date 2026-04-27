import { initColorGame } from "./color-game.js";
import { initMysteryClue } from "./mystery-clue.js";
import { initLaunchForm } from "./launch-form.js";
import { initParentsForm } from "./parents-form.js";

document.querySelectorAll("[data-color-game]").forEach((el) => {
  if (el instanceof HTMLElement) initColorGame(el);
});

document.querySelectorAll("[data-mystery-clue]").forEach((el) => {
  if (el instanceof HTMLElement) {
    // fire and forget — errors caught inside initMysteryClue
    initMysteryClue(el).catch(() => {});
  }
});

document.querySelectorAll("[data-launch-form]").forEach((el) => {
  if (el instanceof HTMLElement) initLaunchForm(el);
});

document.querySelectorAll("[data-parents-form]").forEach((el) => {
  if (el instanceof HTMLElement) initParentsForm(el);
});

/* ---- Scroll reveal (IntersectionObserver) ---- */
const revealElements = document.querySelectorAll("[data-reveal]");

if (revealElements.length > 0 && "IntersectionObserver" in window) {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!prefersReducedMotion) {
    // Check each element: if already in viewport, reveal immediately (no hide flash).
    // Only hide elements that are below the fold.
    const inViewport = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    revealElements.forEach((el) => {
      if (inViewport(el)) {
        // Already visible — skip the hide/reveal cycle entirely
        el.classList.add("section--revealed");
      } else {
        // Below fold — hide now, reveal on scroll
        el.classList.add("section--reveal");
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("section--reveal");
            entry.target.classList.add("section--revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((el) => {
      if (!el.classList.contains("section--revealed")) {
        revealObserver.observe(el);
      }
    });
  }
}

/* ---- Hide scroll hint on scroll ---- */
const scrollHint = document.querySelector(".hero-scroll-hint");
if (scrollHint) {
  let hintHidden = false;
  const hideHint = () => {
    if (hintHidden) return;
    hintHidden = true;
    scrollHint.style.transition = "opacity 0.4s ease";
    scrollHint.style.opacity = "0";
    setTimeout(() => {
      scrollHint.style.display = "none";
    }, 400);
    window.removeEventListener("scroll", hideHint, { passive: true });
  };
  window.addEventListener("scroll", hideHint, { passive: true });
}
