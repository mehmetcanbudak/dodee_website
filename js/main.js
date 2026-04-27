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
