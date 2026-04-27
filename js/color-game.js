import { getColorOfDay, getIstanbulYmd, getIstanbulYesterdayYmd } from "./campaign.js";

const STREAK_KEY = "dodee:colorStreak";
const LAST_CORRECT_KEY = "dodee:colorLastCorrectYmd";

/**
 * @param {string} key
 * @returns {string | null}
 */
function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {string} value
 */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode or quota — game still works without persistence */
  }
}

/**
 * @param {HTMLElement} root
 */
export function initColorGame(root) {
  const streakEl = root.querySelector("[data-color-streak]");
  const feedbackEl = root.querySelector("[data-color-feedback]");
  const buttons = root.querySelectorAll("[data-color-choice]");

  function readStreak() {
    const raw = storageGet(STREAK_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function writeStreak(n) {
    storageSet(STREAK_KEY, String(n));
  }

  function updateStreakDisplay() {
    const n = readStreak();
    if (streakEl) {
      streakEl.textContent = String(n);
    }
  }

  /** Reset streak if the player missed a calendar day (Istanbul) since last correct. */
  function applyStreakContinuity() {
    const streak = readStreak();
    if (streak <= 0) return;
    const last = storageGet(LAST_CORRECT_KEY);
    if (!last) return;
    const today = getIstanbulYmd();
    const yesterday = getIstanbulYesterdayYmd();
    if (last !== today && last !== yesterday) {
      writeStreak(0);
    }
  }

  applyStreakContinuity();

  function showFeedback(message, isError) {
    if (!feedbackEl) return;
    feedbackEl.textContent = message;
    feedbackEl.hidden = false;
    feedbackEl.dataset.error = isError ? "true" : "false";
  }

  updateStreakDisplay();

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = /** @type {string} */ (btn.getAttribute("data-color-choice"));
      const answer = getColorOfDay();
      const today = getIstanbulYmd();

      if (choice === answer) {
        const lastCorrect = storageGet(LAST_CORRECT_KEY);
        if (lastCorrect === today) {
          showFeedback("You already found today’s color — come back tomorrow for a new one!", false);
          return;
        }
        const next = readStreak() + 1;
        writeStreak(next);
        storageSet(LAST_CORRECT_KEY, today);
        updateStreakDisplay();
        showFeedback("Yes! That’s Dodee’s color today!", false);
      } else {
        showFeedback("Not quite — try another color!", true);
      }
    });
  });
}
