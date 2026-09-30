/**
 * Optional browser QA; adds no production dependencies.
 * See docs/STATIC-BROWSER-QA.md for runtime setup and environment options.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const playwrightModule = process.env.PLAYWRIGHT_MODULE || 'playwright';
const playwright = await import(path.isAbsolute(playwrightModule)
  ? pathToFileURL(playwrightModule).href : playwrightModule);
const axePath = process.env.AXE_MODULE || require.resolve('axe-core/axe.min.js');
const axeSource = await fs.readFile(axePath, 'utf8');
const browserType = process.env.BROWSER_TYPE || 'chromium';
assert.ok(['chromium', 'firefox', 'webkit'].includes(browserType), 'Unsupported BROWSER_TYPE');
const channel = process.env.BROWSER_CHANNEL ?? '';
const browser = await playwright[browserType].launch({
  headless: true,
  timeout: 20000,
  ...(browserType === 'chromium' && channel ? { channel } : {}),
});
const origin = (process.env.SITE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const widths = (process.env.QA_WIDTHS || '320,390,768,1440').split(',').map(Number);
const routes = (process.env.QA_ROUTES || 'index,about,videos,for-parents,contact,press,sponsors,privacy').split(',');
const outputDir = path.join(projectRoot, 'test-results', 'static-browser', browserType, process.env.QA_RUN_NAME || 'latest');
await fs.mkdir(outputDir, { recursive: true });
const motions = (process.env.QA_MOTIONS || 'reduce,no-preference').split(',');
const results = [];
let failed = false;

async function revealPage(page) {
  await page.evaluate(async () => {
    for (const node of document.querySelectorAll('[data-reveal]')) {
      node.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await document.fonts.ready;
  });
  await page.waitForTimeout(700);
}

async function auditPage(page) {
  if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const audit = await Promise.race([
      window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('axe audit exceeded 20 seconds')), 20000)),
    ]);
    const details = result => ({ id: result.id, impact: result.impact, nodes: result.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) });
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      violations: audit.violations.map(details),
      incomplete: audit.incomplete.map(details),
      runningAnimations: document.getAnimations().filter(animation => animation.playState === 'running').length,
    };
  });
}

// Axe cannot always resolve translucent panels, images and decorative pseudo-elements.
// Sample their rendered background with text paint suppressed, preserving layout and color.
// This is a conservative pixel check of the full text rectangles, not a WCAG certificate.
async function pixelContrast(page, checks) {
  const targets = checks.incomplete.filter(rule => rule.id === 'color-contrast')
    .flatMap(rule => rule.nodes.map(node => node.target)).filter(target => target.length === 1).map(target => target[0]);
  if (!targets.length) return [];
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const samples = await page.evaluate(selectors => {
    const texts = [];
    const visited = new Set();
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) continue;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (visited.has(node) || !node.textContent.trim() || !node.parentElement.checkVisibility() || node.parentElement.closest('.visually-hidden, [aria-hidden=true]')) continue;
        visited.add(node);
        const style = getComputedStyle(node.parentElement);
        const range = document.createRange(); range.selectNodeContents(node);
        const color = style.color.match(/[\d.]+/g).map(Number);
        let opacity = 1;
        for (let parent = node.parentElement; parent; parent = parent.parentElement) opacity *= Number(getComputedStyle(parent).opacity);
        color[3] = (color[3] ?? 1) * opacity;
        const size = parseFloat(style.fontSize);
        const threshold = size >= 24 || (size >= 18.666 && parseFloat(style.fontWeight) >= 700) ? 3 : 4.5;
        texts.push({ selector, text: node.textContent.trim(), color, threshold, rects: [...range.getClientRects()].map(rect => ({ left: rect.left, top: rect.top + scrollY, right: rect.right, bottom: rect.bottom + scrollY })) });
      }
    }
    return texts;
  }, targets);
  const hideText = await page.addStyleTag({ content: '* { -webkit-text-fill-color: transparent !important; text-shadow: none !important; }' });
  let pixels;
  try { pixels = await page.screenshot({ fullPage: true, animations: 'disabled' }); }
  finally { await hideText.evaluate(element => element.remove()); }
  return page.evaluate(async ({ png, samples }) => {
    const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    const luminance = rgb => rgb.map(channel => { const value = channel / 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
    return samples.map(sample => {
      let minimum = Infinity, darkestPixel = null;
      for (const rect of sample.rects) {
        for (let y = Math.max(0, Math.ceil(rect.top)); y < Math.min(image.height, Math.floor(rect.bottom)); y++) {
          for (let x = Math.max(0, Math.ceil(rect.left)); x < Math.min(image.width, Math.floor(rect.right)); x++) {
            const index = (y * image.width + x) * 4;
            const background = [data[index], data[index + 1], data[index + 2]];
            const foreground = sample.color.slice(0, 3).map((value, i) => value * sample.color[3] + background[i] * (1 - sample.color[3]));
            const a = luminance(foreground), b = luminance(background);
            const contrast = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
            if (contrast < minimum) { minimum = contrast; darkestPixel = { x, y, background }; }
          }
        }
      }
      return { selector: sample.selector, text: sample.text, threshold: sample.threshold, minimumRatio: Math.round(minimum * 100) / 100, passed: minimum + .005 >= sample.threshold, worstPixel: darkestPixel };
    });
  }, { png: pixels.toString('base64'), samples });
}

async function auditWithContrast(page) {
  const checks = await auditPage(page);
  checks.pixelContrast = await pixelContrast(page, checks);
  return checks;
}

async function probeMedia() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const report = { origin, playback: 'unverified', keyboardPause: 'unverified', captions: 'unverified' };
  try {
    const response = await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle', timeout: 20000 });
    report.headers = await response.allHeaders();
    await page.locator('iframe').scrollIntoViewIfNeeded();
    const frame = page.frameLocator('iframe');
    const play = frame.getByRole('button', { name: /^(Play video|Videoyu oynat)$/i });
    await play.focus();
    await play.press('Enter');
    const video = frame.locator('video');
    await video.waitFor();
    const mediaFrame = page.frames().find(item => item.url().includes('youtube-nocookie.com/embed/'));
    await mediaFrame.waitForFunction(() => { const video = document.querySelector('video'); return video && video.currentTime > 2 && !video.paused; }, null, { timeout: 20000 });
    report.playback = 'passed';
    report.video = await video.evaluate(video => ({ time: video.currentTime, duration: video.duration, paused: video.paused, readyState: video.readyState }));
    report.captionControls = await frame.locator('button').evaluateAll(buttons => buttons.filter(button => /caption|altyaz/i.test(button.getAttribute('aria-label') || '')).map(button => ({ label: button.getAttribute('aria-label'), visible: button.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && !button.closest('[aria-hidden=true]'), disabled: button.disabled || button.getAttribute('aria-disabled') === 'true' })));
    report.captionData = await mediaFrame.evaluate(() => {
      const player = document.querySelector('#movie_player');
      return { tracks: player?.getOption?.('captions', 'tracklist') || [], available: player?.getPlayerResponse?.()?.captions || null };
    });
    const captionControl = report.captionControls.find(control => control.visible && !control.disabled);
    if (captionControl) {
      const captions = frame.getByRole('button', { name: captionControl.label, exact: true });
      if (await captions.isVisible()) {
        await captions.focus(); await captions.press('Enter');
        await page.waitForTimeout(1500);
        report.captionAfterToggle = await mediaFrame.evaluate(() => {
          const player = document.querySelector('#movie_player');
          return { tracks: player?.getOption?.('captions', 'tracklist') || [], selected: player?.getOption?.('captions', 'track') || null, segments: [...document.querySelectorAll('.ytp-caption-segment')].map(node => node.textContent) };
        });
        report.captions = report.captionAfterToggle.segments.length ? 'rendered' : 'toggle-tested-no-rendered-text';
      }
    } else {
      report.captions = report.captionData.tracks.length || report.captionData.available ? 'tracks-present-control-unavailable' : 'no-tracks-exposed';
    }
    // Exercise the actual keyboard event, not the provider's programmatic pause API.
    const player = frame.locator('#movie_player');
    await player.focus(); await player.press('k');
    await page.waitForTimeout(200);
    report.keyboardPause = await video.evaluate(video => video.paused) ? 'passed' : 'failed';
    await page.screenshot({ path: path.join(outputDir, 'media.png') });
  } catch (error) {
    report.error = error.message;
    await page.screenshot({ path: path.join(outputDir, 'media.png') }).catch(() => {});
  } finally {
    await fs.writeFile(path.join(outputDir, 'media.json'), JSON.stringify(report, null, 2) + '\n');
    await context.close();
  }
  results.push({ media: report });
  console.log(`Media: playback=${report.playback}, keyboardPause=${report.keyboardPause}, captions=${report.captions}`);
  failed ||= report.playback !== 'passed' || report.keyboardPause !== 'passed';
}

function recordAudit(label, checks, extra = {}) {
  results.push({ ...extra, ...checks });
  failed ||= checks.overflow || checks.violations.length > 0 || checks.pixelContrast?.some(sample => !sample.passed);
  console.log(`${label}: overflow=${checks.overflow}, axe=${checks.violations.length}, manual=${checks.incomplete.length}`);
}

async function assertTextReflow(page, description) {
  const clipped = await page.evaluate(() => {
    const failures = [];
    const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || !node.parentElement.checkVisibility() || node.parentElement.closest('.visually-hidden, [aria-hidden=true]')) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      let clippedByAncestor = false;
      for (let parent = node.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        const bounds = parent.getBoundingClientRect();
        if (['hidden', 'clip'].includes(style.overflowY) && [...range.getClientRects()].some(rect => rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) clippedByAncestor = true;
      }
      if (clippedByAncestor || [...range.getClientRects()].some(rect => rect.left < -1 || rect.right > innerWidth + 1)) {
        failures.push(node.textContent.trim().slice(0, 80));
      }
    }
    return failures;
  });
  assert.deepEqual(clipped, [], `${description}: text must remain inside the viewport`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${description}: horizontal reflow`);
}

try {
  for (const motion of motions) {
    for (const width of widths) {
      // CSP bypass is limited to axe injection. Interaction smoke below uses native CSP.
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: motion, bypassCSP: true });
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(20000);
      // Third-party playback is checked separately; deterministic axe excludes its iframe.
      await page.route('https://www.youtube-nocookie.com/**', route => route.abort());
      for (const route of routes) {
        await page.goto(`${origin}/${route}.html`, { waitUntil: 'networkidle' });
        await revealPage(page);
        const checks = await auditPage(page);
        if (motion === 'reduce' && (width === 390 || width === 1512)) checks.pixelContrast = await pixelContrast(page, checks);
        recordAudit(`${motion} ${width}px ${route}`, checks, { width, route, motion });
        if (motion === 'reduce') assert.equal(checks.runningAnimations, 0, 'Reduced motion must stop decorative animations');
        if (width === 390 || width === 1440 || width === 1512) {
          await page.screenshot({ path: path.join(outputDir, `${route}-${width}-${motion}.png`), fullPage: true });
        }
      }
      await context.close();
    }
  }

  const accessibility = await browser.newContext({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce', bypassCSP: true });
  const accessiblePage = await accessibility.newPage();
  await accessiblePage.route('https://www.youtube-nocookie.com/**', route => route.abort());
  for (const route of routes) {
    await accessiblePage.goto(`${origin}/${route}.html`, { waitUntil: 'networkidle' });
    await accessiblePage.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await assertTextReflow(accessiblePage, `${route} 200% text`);
    await accessiblePage.screenshot({ path: path.join(outputDir, `${route}-text-200.png`), fullPage: true });
    await accessiblePage.evaluate(() => { document.documentElement.style.fontSize = ''; });
    const spacing = await accessiblePage.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
    await assertTextReflow(accessiblePage, `${route} WCAG text spacing`);
    await accessiblePage.screenshot({ path: path.join(outputDir, `${route}-text-spacing.png`), fullPage: true });
    await spacing.evaluate(el => el.remove());
    results.push({ route, text200Percent: 'passed', textSpacing: 'passed' });
  }
  await accessiblePage.goto(`${origin}/videos.html`, { waitUntil: 'networkidle' });
  await accessiblePage.locator('#primary-nav-toggle').click();
  await accessiblePage.waitForTimeout(100);
  recordAudit('Open menu', await auditWithContrast(accessiblePage), { state: 'open-menu' });
  await accessiblePage.keyboard.press('Escape');
  await accessiblePage.getByRole('button', { name: 'Updates', exact: true }).click();
  recordAudit('Selected filter', await auditWithContrast(accessiblePage), { state: 'selected-filter' });
  await accessiblePage.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });
  const correctColor = await accessiblePage.evaluate(async () => (await import('/js/campaign.js')).getColorOfDay(new Date()));
  const wrongColor = ['RED', 'GREEN', 'BLUE'].find(color => color !== correctColor);
  await accessiblePage.getByRole('button', { name: wrongColor, exact: true }).click();
  assert.equal(await accessiblePage.locator('[data-color-feedback]').getAttribute('data-error'), 'true');
  recordAudit('Incorrect game answer', await auditWithContrast(accessiblePage), { state: 'game-incorrect' });
  await accessiblePage.getByRole('button', { name: correctColor, exact: true }).click();
  assert.equal(await accessiblePage.locator('[data-color-feedback]').getAttribute('data-error'), 'false');
  recordAudit('Correct game answer', await auditWithContrast(accessiblePage), { state: 'game-correct' });
  await accessiblePage.emulateMedia({ reducedMotion: 'no-preference' });
  await accessiblePage.waitForTimeout(100);
  assert.ok(await accessiblePage.evaluate(() => document.getAnimations().some(animation => animation.playState === 'running')), 'Normal-motion homepage runs its decorative animation');
  await accessiblePage.emulateMedia({ reducedMotion: 'reduce' });
  await accessiblePage.waitForTimeout(100);
  assert.equal(await accessiblePage.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length), 0, 'Changing motion preference stops active animation');
  results.push({ dynamicMotionPreference: 'passed', interactiveStates: 'passed' });
  await accessibility.close();

  const nojs = await browser.newContext({ viewport: { width: 320, height: 600 }, javaScriptEnabled: false });
  const nojsPage = await nojs.newPage();
  await nojsPage.goto(`${origin}/videos.html`);
  assert.equal(await nojsPage.getByRole('link', { name: 'About', exact: true }).isVisible(), true, 'No-JS mobile navigation must remain usable');
  assert.equal(await nojsPage.locator('.episode-filters').isHidden(), true, 'No-JS filters must stay hidden');
  await nojs.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 700 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const pageErrors = [];
  const typographyRequests = [];
  page.on('request', request => { if (['font', 'stylesheet'].includes(request.resourceType())) typographyRequests.push(request.url()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${origin}/videos.html`);
  await page.evaluate(() => document.fonts.ready);
  assert.ok(typographyRequests.every(url => url.startsWith(origin + '/')), 'Typography resources must be hosted locally');
  const loadedFonts = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family));
  assert.ok(loadedFonts.includes('DynaPuff') && loadedFonts.includes('Nunito'), 'Both local font families must load under native CSP');
  results.push({ selfHostedFonts: 'passed', typographyRequests });
  const toggle = page.locator('#primary-nav-toggle');
  assert.equal(await page.locator('#primary-nav-list').evaluate(el => el.inert), true);
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await page.getByRole('link', { name: 'About', exact: true }).focus();
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
  await toggle.click();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await page.waitForURL('**/about.html');
  await page.goto(`${origin}/videos.html`);
  for (const [label, count] of [['Out now', 1], ['Updates', 2], ['All', 3]]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    assert.equal(await page.locator('.episode-card:visible').count(), count);
  }
  await page.goto(`${origin}/index.html`);
  await page.getByRole('button', { name: 'RED', exact: true }).click();
  assert.ok(await page.locator('[data-color-feedback]').textContent());
  assert.equal(await page.locator('input[type=email]').count(), 0);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '200% text must reflow');
  assert.equal(await toggle.evaluate(el => { const bounds = el.getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= innerWidth; }), true, 'Enlarged-text menu button must remain fully on-screen');
  await toggle.click();
  assert.equal(await page.locator('#primary-nav-list').evaluate(el => el.scrollHeight > el.clientHeight), true);
  await page.screenshot({ path: path.join(outputDir, 'zoom-menu.png') });
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => document.querySelector('#primary-nav-toggle').getAttribute('aria-expanded') === 'false');
  assert.equal(await page.locator('#primary-nav-list').evaluate(el => el.inert), false);
  assert.deepEqual(pageErrors, []);
  await context.close();
  results.push({ functionalSmoke: 'passed', noJavaScript: 'passed' });
  console.log('PASS: navigation, filters, color game, no fake signup, no-JS fallback and 200% text reflow.');
  if (process.env.QA_MEDIA === '1') await probeMedia();
} catch (error) {
  results.push({ error: error.message });
  throw error;
} finally {
  await fs.writeFile(path.join(outputDir, 'audit.json'), JSON.stringify(results, null, 2) + '\n');
  await browser.close();
}
if (failed) process.exitCode = 1;
console.log(`Evidence: ${path.relative(projectRoot, outputDir)}`);
