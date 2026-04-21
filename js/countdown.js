import { getLaunchInstantMs } from "./campaign.js";

/**
 * @param {HTMLElement} root
 */
export function initCountdown(root) {
  const daysEl = root.querySelector("[data-countdown-days]");
  const hoursEl = root.querySelector("[data-countdown-hours]");
  const minsEl = root.querySelector("[data-countdown-minutes]");
  const secsEl = root.querySelector("[data-countdown-seconds]");
  const liveEl = root.querySelector("[data-countdown-live]");
  const targetMs = getLaunchInstantMs();

  let timerId = 0;

  function tick() {
    const now = Date.now();
    const diff = targetMs - now;

    if (diff <= 0) {
      if (daysEl) daysEl.textContent = "0";
      if (hoursEl) hoursEl.textContent = "00";
      if (minsEl) minsEl.textContent = "00";
      if (secsEl) secsEl.textContent = "00";
      if (liveEl) liveEl.textContent = "Episode 1 is live!";
      if (timerId) {
        window.clearInterval(timerId);
        timerId = 0;
      }
      return;
    }

    const sec = Math.floor(diff / 1000) % 60;
    const min = Math.floor(diff / 60000) % 60;
    const hour = Math.floor(diff / 3600000) % 24;
    const day = Math.floor(diff / 86400000);

    if (daysEl) daysEl.textContent = String(day);
    if (hoursEl) hoursEl.textContent = String(hour).padStart(2, "0");
    if (minsEl) minsEl.textContent = String(min).padStart(2, "0");
    if (secsEl) secsEl.textContent = String(sec).padStart(2, "0");
  }

  tick();
  if (Date.now() < targetMs) {
    timerId = window.setInterval(tick, 1000);
  }
}
