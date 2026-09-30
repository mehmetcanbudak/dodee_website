/** Load the third-party player only after the visitor chooses to play. */
export function initMedia(root) {
  const button = root.querySelector("[data-media-play]");
  if (!button || root.dataset.mediaReady === "true") return;
  root.dataset.mediaReady = "true";

  button.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.className = "teaser-embed__iframe";
    iframe.src = "https://www.youtube-nocookie.com/embed/tHlpVMTYDhg?autoplay=1&playsinline=1";
    iframe.title = "Dodee teaser on YouTube";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups");
    root.replaceChildren(iframe);
    // Keep keyboard users at the player they requested, without moving focus
    // again after loading if they have already continued to another control.
    iframe.focus({ preventScroll: true });
  }, { once: true });

  // A missing or failed script leaves the permanent direct YouTube link usable.
  button.hidden = false;
}

document.querySelectorAll("[data-media]").forEach(initMedia);
