import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { getClueDayIndex, getColorOfDay, getIstanbulYmd, getIstanbulYesterdayYmd } from "../js/campaign.js";
import { initColorGame } from "../js/color-game.js";

// Small browser-boundary doubles; tests drive real public initialization and events.
class Element extends EventTarget {
  constructor(selectors = {}) {
    super();
    this.selectors = selectors;
    this.attributes = new Map();
    this.dataset = {};
    this.hidden = true;
    this.disabled = true;
    this.textContent = "";
    this.value = "";
    this.children = [];
    this.classes = new Set();
    this.classList = {
      contains: (name) => this.classes.has(name),
      add: (name) => this.classes.add(name),
      remove: (name) => this.classes.delete(name),
      toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name),
    };
  }
  querySelector(selector) { return this.selectors[selector] ?? null; }
  querySelectorAll(selector) { return this.selectors[selector] ?? []; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  contains(element) { return this === element || this.children.some((child) => child.contains(element)); }
  focus() { this.focused = true; if (globalThis.document) globalThis.document.activeElement = this; }
  closest(selector) { return selector === "a" && this.isAnchor ? this : null; }
  click() { this.dispatchEvent(new Event("click", { cancelable: true })); }
}

const replacedGlobals = new WeakMap();
function globalFor(t, name, value) {
  if (!replacedGlobals.has(t)) replacedGlobals.set(t, new Set());
  const replaced = replacedGlobals.get(t);
  if (!replaced.has(name)) {
    replaced.add(name);
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  }
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}
function keyboard(key, options = {}) {
  const event = new Event("keydown", { cancelable: true });
  Object.assign(event, { key, ...options });
  return event;
}
function memoryStorage(values = {}) {
  const data = new Map(Object.entries(values));
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
function game() {
  const streak = new Element();
  const feedback = new Element();
  const buttons = ["RED", "GREEN", "BLUE"].map((color) => {
    const button = new Element();
    button.setAttribute("data-color-choice", color);
    return button;
  });
  const root = new Element({ "[data-color-streak]": streak, "[data-color-feedback]": feedback, "[data-color-choice]": buttons });
  initColorGame(root);
  const correct = () => buttons.find((button) => button.getAttribute("data-color-choice") === getColorOfDay()).click();
  return { streak, feedback, buttons, correct };
}

test("Istanbul campaign boundaries and yesterday cross UTC midnight, year, and leap day correctly", () => {
  assert.equal(getIstanbulYmd(new Date("2026-04-09T21:00:00Z")), "2026-04-10");
  assert.equal(getClueDayIndex(new Date("2026-04-09T20:59:59Z")), 0);
  assert.equal(getClueDayIndex(new Date("2026-04-09T21:00:00Z")), 1);
  assert.equal(getClueDayIndex(new Date("2026-04-22T20:59:59Z")), 13);
  assert.equal(getClueDayIndex(new Date("2026-04-22T21:00:00Z")), 14);
  assert.equal(getIstanbulYesterdayYmd(new Date("2026-01-01T00:00:00Z")), "2025-12-31");
  assert.equal(getIstanbulYesterdayYmd(new Date("2024-03-01T00:00:00Z")), "2024-02-29");
});

test("daily color is independent of the browser timezone and daylight saving", (t) => {
  const original = process.env.TZ;
  t.after(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });
  const date = new Date("2026-07-15T12:00:00Z");
  const colors = ["UTC", "America/New_York", "Europe/Berlin", "Pacific/Auckland"].map((timezone) => {
    process.env.TZ = timezone;
    return getColorOfDay(date);
  });
  assert.deepEqual(colors, ["GREEN", "GREEN", "GREEN", "GREEN"]);
});

test("game migrates a consecutive legacy streak and awards only once per day", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-30T12:00:00Z") });
  const storage = memoryStorage({ "dodee:colorStreak": "4", "dodee:colorLastCorrectYmd": "2026-09-29" });
  globalFor(t, "localStorage", storage);
  const view = game();
  assert.equal(view.streak.textContent, "4");
  assert.ok(view.buttons.every((button) => !button.disabled));
  view.correct();
  view.correct();
  assert.equal(view.streak.textContent, "5");
  assert.match(view.feedback.textContent, /already found/);
  assert.deepEqual(JSON.parse(storage.getItem("dodee:colorProgress")), { streak: 5, lastCorrect: "2026-09-30" });
});

test("game remains playable with denied storage and does not award repeatedly", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-30T12:00:00Z") });
  globalFor(t, "localStorage", { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } });
  const view = game();
  view.correct();
  view.correct();
  assert.equal(view.streak.textContent, "1");
  assert.match(view.feedback.textContent, /already found/);
});

test("failed storage writes preserve same-page progress", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-30T12:00:00Z") });
  const storage = memoryStorage({ "dodee:colorProgress": JSON.stringify({ streak: 2, lastCorrect: "2026-09-29" }) });
  storage.setItem = () => { throw new Error("quota"); };
  globalFor(t, "localStorage", storage);
  const view = game();
  view.correct();
  view.correct();
  assert.equal(view.streak.textContent, "3");
});

test("a tab left open across missed days resets the streak before awarding", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-30T12:00:00Z") });
  globalFor(t, "localStorage", memoryStorage());
  const view = game();
  view.correct();
  t.mock.timers.tick(3 * 86400000);
  view.correct();
  assert.equal(view.streak.textContent, "1");
  t.mock.timers.tick(86400000);
  view.correct();
  assert.equal(view.streak.textContent, "2");
});

test("malformed, missing-date, and unsafe streak records are ignored", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-30T12:00:00Z") });
  for (const value of ["broken json", "null", JSON.stringify({ streak: 42 }), JSON.stringify({ streak: 1e40, lastCorrect: "2026-09-29" })]) {
    const storage = memoryStorage({ "dodee:colorProgress": value });
    globalFor(t, "localStorage", storage);
    const view = game();
    assert.equal(view.streak.textContent, "0");
    view.correct();
    assert.equal(view.streak.textContent, "1");
    assert.equal(JSON.parse(storage.getItem("dodee:colorProgress")).streak, 1);
  }
});

async function navigation(t, mobile = true, readyState = "complete") {
  const firstLink = new Element();
  firstLink.isAnchor = true;
  const list = new Element({ "a[href]": firstLink });
  list.children.push(firstLink);
  const toggle = new Element();
  const nav = new Element();
  nav.children.push(toggle, list);
  const document = new Element({ ".site-nav": nav });
  document.body = new Element();
  document.readyState = readyState;
  document.activeElement = document.body;
  document.getElementById = (id) => ({ "primary-nav-toggle": toggle, "primary-nav-list": list })[id];
  const mq = new EventTarget();
  mq.matches = mobile;
  globalFor(t, "document", document);
  globalFor(t, "window", { matchMedia: () => mq });
  for (const name of ["HTMLElement", "HTMLButtonElement", "Element", "Node"]) globalFor(t, name, Element);
  await import(`../js/nav.js?test=${encodeURIComponent(t.name)}`);
  return { nav, list, toggle, firstLink, document, mq };
}

test("mobile navigation keeps closed links inert and allows Tab to leave the disclosure", async (t) => {
  const view = await navigation(t);
  assert.equal(view.nav.dataset.enhanced, "true");
  assert.equal(view.list.inert, true);
  view.toggle.focus();
  view.toggle.click();
  assert.equal(view.toggle.getAttribute("aria-expanded"), "true");
  assert.equal(view.list.inert, false);
  assert.equal(view.document.activeElement, view.toggle);
  const tab = keyboard("Tab");
  view.document.dispatchEvent(tab);
  assert.equal(tab.defaultPrevented, false);
  view.document.activeElement = new Element();
  const focusout = new Event("focusout");
  Object.defineProperty(focusout, "relatedTarget", { value: view.document.activeElement });
  view.nav.dispatchEvent(focusout);
  await Promise.resolve();
  assert.equal(view.toggle.getAttribute("aria-expanded"), "false");
  assert.notEqual(view.document.activeElement, view.toggle);
});

test("Escape returns focus to menu toggle while desktop resize preserves a focused link", async (t) => {
  const view = await navigation(t);
  view.toggle.click();
  view.firstLink.focus();
  view.document.dispatchEvent(keyboard("Escape"));
  assert.equal(view.document.activeElement, view.toggle);
  assert.equal(view.list.inert, true);
  view.toggle.click();
  view.firstLink.focus();
  view.mq.matches = false;
  view.mq.dispatchEvent(new Event("change"));
  assert.equal(view.list.inert, false);
  assert.equal(view.document.activeElement, view.firstLink);
  view.mq.matches = true;
  view.mq.dispatchEvent(new Event("change"));
  assert.equal(view.list.inert, true);
  assert.equal(view.document.activeElement, view.toggle);
});

test("navigation initializes during parsing and preserves native link activation and focus", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const view = await navigation(t, true, "loading");
  assert.equal(view.nav.dataset.enhanced, "true");
  view.toggle.click();
  view.document.activeElement = view.document.body;
  const internalFocusout = new Event("focusout");
  Object.defineProperty(internalFocusout, "relatedTarget", { value: view.firstLink });
  view.nav.dispatchEvent(internalFocusout);
  await Promise.resolve();
  assert.equal(view.list.inert, false, "A transient body focus must not hide the link receiving focus");
  view.nav.dispatchEvent(new Event("focusout"));
  await Promise.resolve();
  assert.equal(view.list.inert, false, "Unknown next focus must not cancel pending native link activation");
  view.firstLink.focus();
  const click = new Event("click", { cancelable: true });
  Object.defineProperty(click, "target", { value: view.firstLink });
  view.list.dispatchEvent(click);
  assert.equal(click.defaultPrevented, false);
  assert.equal(view.list.inert, false);
  t.mock.timers.tick(0);
  assert.equal(view.list.inert, false);
  assert.equal(view.document.activeElement, view.firstLink);
});

test("episode filters enable progressively and handle nested SVG clicks and keyboard activation", async (t) => {
  class HtmlElement extends Element {}
  const buttons = ["all", "live", "upcoming"].map((value) => {
    const button = new HtmlElement();
    button.setAttribute("data-filter", value);
    return button;
  });
  const cards = ["live", "upcoming"].map((value) => {
    const card = new HtmlElement();
    card.setAttribute("data-episode-status", value);
    return card;
  });
  const group = new HtmlElement({ "button[data-filter]": buttons });
  group.children.push(...buttons);
  const root = new HtmlElement({ ".episode-filters": group, "[data-episode-status]": cards });
  const document = new HtmlElement({ "[data-episodes-page]": root });
  globalFor(t, "document", document);
  globalFor(t, "HTMLElement", HtmlElement);
  globalFor(t, "Element", Element);
  globalFor(t, "KeyboardEvent", Event);
  await import("../js/episodes.js?test=filters");
  assert.equal(group.hidden, false);
  assert.deepEqual(cards.map((card) => card.hidden), [false, false]);
  const svg = new Element();
  svg.closest = () => buttons[1];
  const click = new Event("click");
  Object.defineProperty(click, "target", { value: svg });
  group.dispatchEvent(click);
  assert.deepEqual(cards.map((card) => card.hidden), [false, true]);
  buttons[1].focus();
  group.dispatchEvent(keyboard("End"));
  assert.equal(document.activeElement, buttons[2]);
  group.dispatchEvent(keyboard("Enter"));
  assert.deepEqual(cards.map((card) => card.hidden), [true, false]);
  assert.deepEqual(buttons.map((button) => button.getAttribute("aria-pressed")), ["false", "false", "true"]);
});

test("scroll reveal handles tall sections and makes keyboard-focused content visible immediately", async (t) => {
  const above = new Element();
  const below = new Element();
  const tall = new Element();
  above.getBoundingClientRect = () => ({ top: -5000, bottom: -100 });
  below.getBoundingClientRect = () => ({ top: 1200, bottom: 1800 });
  tall.getBoundingClientRect = () => ({ top: 2000, bottom: 18000 });
  const document = new Element({ "[data-reveal]": [above, below, tall] });
  const window = new EventTarget();
  window.innerHeight = 800;
  window.matchMedia = () => ({ matches: false });
  let observer;
  class Observer {
    constructor(callback, options) { Object.assign(this, { callback, options }); observer = this; }
    observe() {}
    unobserve() {}
  }
  window.IntersectionObserver = Observer;
  globalFor(t, "document", document);
  globalFor(t, "window", window);
  globalFor(t, "HTMLElement", Element);
  globalFor(t, "IntersectionObserver", Observer);
  await import("../js/main.js?test=reveal");
  assert.equal(above.classList.contains("section--reveal"), false);
  assert.equal(below.classList.contains("section--reveal"), true);
  assert.equal(observer.options.threshold, 0);
  below.dispatchEvent(new Event("focusin"));
  assert.equal(below.classList.contains("section--reveal"), false);
  observer.callback([{ target: tall, isIntersecting: true }]);
  assert.equal(tall.classList.contains("section--reveal"), false);
  assert.equal(tall.classList.contains("section--revealed"), true);
});

test("public clue archive is readable without scripts and cannot restart from the client clock", async () => {
  const homepage = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const main = await readFile(new URL("../js/main.js", import.meta.url), "utf8");
  const clues = JSON.parse(await readFile(new URL("../data/clues.json", import.meta.url), "utf8"));
  assert.match(homepage, /Campaign archive/);
  assert.match(homepage, /datetime="2026-04-10"/);
  assert.match(homepage, /datetime="2026-04-22"/);
  assert.match(homepage, /13-day mystery clue campaign has ended/);
  assert.doesNotMatch(homepage, /data-mystery-clue|data-clue-guess|data-clue-loading/);
  assert.doesNotMatch(main, /initMysteryClue|mystery-clue/);
  assert.equal(clues.length, 13);
  assert.ok(clues.every((clue) => typeof clue === "string" && clue.trim()));
});

test("production pages contain no signup collection or unverified partner identities", async () => {
  for (const name of ["index", "about", "videos", "for-parents", "sponsors", "contact", "press", "privacy"]) {
    const html = await readFile(new URL(`../${name}.html`, import.meta.url), "utf8");
    const navigationScript = html.indexOf('<script src="js/nav.js"></script>');
    assert.ok(navigationScript > html.indexOf("</header>") && navigationScript < html.indexOf("<main "), `${name}: initialize navigation while parsing, after its markup`);
    assert.equal((html.match(/src="js\/nav\.js"/g) ?? []).length, 1, name);
    assert.doesNotMatch(html, /<form\b|<input\b[^>]*type=["']email["']/i, name);
    assert.doesNotMatch(html, /ebebek|humm|lindos|sponsor-[a-z]+\.svg/i, name);
    assert.doesNotMatch(html, /You’re on the list|You’re in!|Unsubscribe anytime|weekly emails/i, name);
  }
});
