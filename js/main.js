import { initCountdown } from "./countdown.js";
import { initColorGame } from "./color-game.js";
import { initMysteryClue } from "./mystery-clue.js";
import { initLaunchForm } from "./launch-form.js";

document.querySelectorAll("[data-countdown]").forEach((el) => {
  if (el instanceof HTMLElement) initCountdown(el);
});

document.querySelectorAll("[data-color-game]").forEach((el) => {
  if (el instanceof HTMLElement) initColorGame(el);
});

document.querySelectorAll("[data-mystery-clue]").forEach((el) => {
  if (el instanceof HTMLElement) void initMysteryClue(el);
});

document.querySelectorAll("[data-launch-form]").forEach((el) => {
  if (el instanceof HTMLElement) initLaunchForm(el);
});
