import { getColorOfDay, getIstanbulYmd, getIstanbulYesterdayYmd } from "./campaign.js";

const PROGRESS_KEY = "dodee:colorProgress";
const LEGACY_STREAK_KEY = "dodee:colorStreak";
const LEGACY_DATE_KEY = "dodee:colorLastCorrectYmd";

/** @param {HTMLElement} root */
export function initColorGame(root) {
  const streakEl = root.querySelector("[data-color-streak]");
  const feedbackEl = root.querySelector("[data-color-feedback]");
  const buttons = root.querySelectorAll("[data-color-choice]");
  // Retain progress for this page even when storage is blocked or full.
  let progress = { streak: 0, lastCorrect: null };
  let storageAvailable = true;

  function readProgress() {
    if (!storageAvailable) return progress;
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      let value = null;
      if (saved === null) {
        value = {
          streak: Number(localStorage.getItem(LEGACY_STREAK_KEY)),
          lastCorrect: localStorage.getItem(LEGACY_DATE_KEY),
        };
      } else {
        try { value = JSON.parse(saved); } catch { /* Repair malformed data on the next win. */ }
      }
      progress = value && Number.isSafeInteger(value.streak) && value.streak >= 0 &&
        typeof value.lastCorrect === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.lastCorrect)
        ? { streak: value.streak, lastCorrect: value.lastCorrect }
        : { streak: 0, lastCorrect: null };
    } catch {
      // Storage errors must not break the game.
      storageAvailable = false;
    }
    return progress;
  }

  function saveProgress(next) {
    progress = next;
    if (!storageAvailable) return;
    try {
      // A single record avoids mismatched streak/date values if a write fails.
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      storageAvailable = false;
    }
  }

  function refresh(now) {
    const current = readProgress();
    if (current.lastCorrect !== getIstanbulYmd(now) &&
        current.lastCorrect !== getIstanbulYesterdayYmd(now)) {
      progress = { streak: 0, lastCorrect: null };
    }
    if (streakEl) streakEl.textContent = String(progress.streak);
  }

  function showFeedback(message, isError) {
    if (!feedbackEl) return;
    feedbackEl.textContent = message;
    feedbackEl.hidden = false;
    feedbackEl.dataset.error = String(isError);
  }

  if (feedbackEl) {
    feedbackEl.setAttribute("role", "status");
    feedbackEl.setAttribute("aria-live", "polite");
  }
  refresh(new Date());

  buttons.forEach((btn) => {
    btn.disabled = false;
    btn.addEventListener("click", () => {
      // Recheck continuity at play time: a tab may remain open for several days.
      const now = new Date();
      refresh(now);
      const today = getIstanbulYmd(now);
      if (progress.lastCorrect === today) {
        showFeedback("You already found today’s color — come back tomorrow for a new one!", false);
        return;
      }
      if (btn.getAttribute("data-color-choice") !== getColorOfDay(now)) {
        showFeedback("Not quite — try another color!", true);
        return;
      }
      saveProgress({ streak: Math.min(progress.streak + 1, Number.MAX_SAFE_INTEGER), lastCorrect: today });
      if (streakEl) streakEl.textContent = String(progress.streak);
      showFeedback("Yes! That’s Dodee’s color today!", false);
    });
  });
}
