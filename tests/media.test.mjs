import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("teaser HTML stays local until activation and keeps a no-JavaScript watch link", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /<(?:iframe|embed|object)\b/i, "Initial HTML must not start a third-party player");
  for (const tag of html.match(/<(?:script|link|img|source)\b[^>]*>/gi) ?? []) {
    assert.doesNotMatch(tag, /(?:youtube(?:-nocookie)?\.com|youtu\.be|ytimg\.com|googlevideo\.com|gstatic\.com)/i,
      "Initial resource and connection hints must not contact the video provider");
  }

  const facade = html.match(/<div\b[^>]*\bdata-media\b[^>]*>([\s\S]*?)<\/div>/)?.[1];
  assert.ok(facade, "A local preview must remain when scripts are unavailable");
  const poster = facade.match(/<img\b[^>]*\bsrc="(assets\/[^"?#]+)"/)?.[1];
  assert.ok(poster, "The preview image must be a local asset");
  assert.ok((await readFile(new URL(`../${poster}`, import.meta.url))).length > 0);
  const button = facade.match(/<button\b[^>]*\bdata-media-play\b[^>]*>/)?.[0];
  assert.ok(button, "Use a native button for keyboard activation");
  assert.match(button, /\btype="button"/);
  assert.match(button, /\bhidden(?:\s|>|=)/, "Do not expose a dead play button when JavaScript fails");
  assert.match(button, /\baria-describedby="teaser-provider-note"/);
  assert.match(html, /id="teaser-provider-note"[^>]*>[^<]*loads YouTube/);
  assert.match(html, /<a\b[^>]*href="https:\/\/www\.youtube\.com\/watch\?v=tHlpVMTYDhg"[^>]*>Watch teaser on YouTube<\/a>/);
  assert.doesNotMatch(facade, /<a\b/, "The permanent watch link must survive replacement of the preview");
  assert.match(html, /<script\b[^>]*type="module"[^>]*src="js\/media\.js"/);
});

test("teaser requires one explicit activation and never steals focus after loading", async (t) => {
  // Browser-boundary doubles exercise the public initializer and native events;
  // actual keyboard activation and network isolation are covered by browser QA.
  const button = new EventTarget();
  button.hidden = true;
  const created = [];
  const root = {
    dataset: {},
    children: [button],
    querySelector: () => root.children.includes(button) ? button : null,
    replaceChildren: (...children) => { root.children = children; },
  };
  const document = {
    activeElement: null,
    querySelectorAll: () => [root],
    createElement: (tagName) => {
      const element = new EventTarget();
      element.tagName = tagName;
      element.attributes = new Map();
      element.setAttribute = (name, value) => element.attributes.set(name, value);
      element.focus = (options) => { document.activeElement = element; element.focusOptions = options; };
      created.push(element);
      return element;
    },
  };
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { configurable: true, value: document });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "document", original);
    else delete globalThis.document;
  });

  const { initMedia } = await import("../js/media.js");
  initMedia(root);
  assert.equal(button.hidden, false, "Reveal play only after enhancement is ready");
  assert.equal(created.length, 0, "Initialization must not create a network-capable player");
  button.dispatchEvent(new Event("click"));
  button.dispatchEvent(new Event("click"));
  initMedia(root);
  assert.equal(created.length, 1, "Repeated initialization or activation must not reload the player");
  const [frame] = created;
  assert.equal(frame.tagName, "iframe");
  assert.deepEqual(root.children, [frame]);
  const url = new URL(frame.src);
  assert.equal(url.origin, "https://www.youtube-nocookie.com");
  assert.equal(url.pathname, "/embed/tHlpVMTYDhg");
  assert.equal(url.searchParams.get("autoplay"), "1");
  assert.equal(url.searchParams.get("playsinline"), "1");
  assert.ok(frame.title, "The player needs an accessible name");
  assert.equal(frame.referrerPolicy, "strict-origin-when-cross-origin");
  assert.doesNotMatch(frame.attributes.get("sandbox"), /allow-top-navigation|allow-forms/);
  assert.equal(document.activeElement, frame, "Keyboard focus must follow the requested player");
  assert.equal(frame.focusOptions.preventScroll, true);

  const nextControl = {};
  document.activeElement = nextControl;
  const load = new Event("load");
  frame.dispatchEvent(load);
  frame.onload?.(load);
  await Promise.resolve();
  assert.equal(document.activeElement, nextControl, "Delayed provider loading must not reclaim focus");
});
