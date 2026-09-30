import { initColorGame } from "./color-game.js";

document.querySelectorAll("[data-color-game]").forEach((el) => {
  if (el instanceof HTMLElement) initColorGame(el);
});

/* ---- Scroll reveal (IntersectionObserver) ---- */
const revealElements = document.querySelectorAll("[data-reveal]");

if (revealElements.length > 0 && "IntersectionObserver" in window) {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!prefersReducedMotion) {
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
      // Tall sections must reveal even when less than 12% can fit on screen.
      { threshold: 0, rootMargin: "0px 0px 40px 0px" }
    );

    revealElements.forEach((el) => {
      // Leave everything already reached visible, including restored scroll positions.
      if (el.getBoundingClientRect().top >= window.innerHeight) {
        el.classList.add("section--reveal");
        revealObserver.observe(el);
        el.addEventListener("focusin", () => {
          // Keyboard users must never focus an invisible control while awaiting an observer.
          el.classList.remove("section--reveal");
          revealObserver.unobserve(el);
        }, { once: true });
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
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 400;
    scrollHint.style.transition = delay ? "opacity 0.4s ease" : "none";
    scrollHint.style.opacity = "0";
    setTimeout(() => {
      scrollHint.style.display = "none";
    }, delay);
    window.removeEventListener("scroll", hideHint, { passive: true });
  };
  window.addEventListener("scroll", hideHint, { passive: true });
  if (window.scrollY > 0) hideHint();
}
