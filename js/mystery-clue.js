import { getClueDayIndex } from "./campaign.js";

/**
 * @param {HTMLElement} root
 */
export async function initMysteryClue(root) {
  const dayLabel = root.querySelector("[data-clue-day-label]");
  const clueText = root.querySelector("[data-clue-text]");
  const loading = root.querySelector("[data-clue-loading]");
  const guessInput = root.querySelector("[data-clue-guess]");
  const guessBtn = root.querySelector("[data-clue-guess-btn]");
  const shareQuote = root.querySelector("[data-clue-share-quote]");

  const idx = getClueDayIndex();

  if (dayLabel) {
    if (idx >= 1 && idx <= 13) {
      dayLabel.textContent = `Day ${idx} of 13`;
    } else if (idx === 0) {
      dayLabel.textContent = "Coming soon";
    } else {
      dayLabel.textContent = "Thanks for playing!";
    }
  }

  let clues = [];
  try {
    const res = await fetch(new URL("../data/clues.json", import.meta.url));
    if (!res.ok) throw new Error("clues fetch failed");
    clues = await res.json();
  } catch {
    try {
      const res = await fetch(new URL("data/clues.json", window.location.href));
      if (!res.ok) throw new Error("clues fetch failed");
      clues = await res.json();
    } catch {
      clues = ["Clues will appear when the campaign starts. Check back soon!"];
    }
  }
  if (!Array.isArray(clues)) {
    clues = ["Clues will appear when the campaign starts. Check back soon!"];
  }

  const clueIndex = idx >= 1 && idx <= 13 ? idx - 1 : -1;
  const line =
    clueIndex >= 0 && clueIndex < clues.length
      ? clues[clueIndex]
      : idx === 0
        ? "The daily clues begin soon — get ready!"
        : "The mystery season has wrapped. See you on the channel!";

  const delay = 650;
  window.setTimeout(() => {
    if (loading) loading.hidden = true;
    if (clueText) {
      clueText.textContent = line;
      clueText.hidden = false;
    }
  }, delay);

  function submitGuess() {
    const val = guessInput && "value" in guessInput ? guessInput.value.trim() : "";
    if (!val) {
      if (shareQuote) {
        shareQuote.hidden = false;
        shareQuote.textContent = "Type a guess first, then share!";
      }
      return;
    }
    if (shareQuote) {
      shareQuote.hidden = false;
      shareQuote.textContent = ` — “${val.slice(0, 80)}${val.length > 80 ? "…" : ""}”`;
    }
  }

  if (guessBtn) {
    guessBtn.addEventListener("click", submitGuess);
  }
  if (guessInput) {
    guessInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitGuess();
    });
  }
}
