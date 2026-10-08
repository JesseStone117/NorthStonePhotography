import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const url = 'http://127.0.0.1:4173';
const output = resolve('.local');
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { windowsHide: true, stdio: 'pipe' });
let browser;
let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
server.stderr.on('data', chunk => { serverOutput += chunk.toString(); });
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    if (server.exitCode !== null) throw new Error(`Preview failed: ${serverOutput}`);
    try { const response = await fetch(url); if (response.ok) { ready = true; break; } } catch { /* Wait for preview. */ }
    await delay(250);
  }
  assert.ok(ready, 'Production preview must start');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#hero-photo').evaluate(image => image.decode());
  assert.equal(await page.locator('.chapter-card').count(), 4);
  assert.equal(await page.locator('.gallery-item').count(), 9);
  await page.screenshot({ path: resolve(output, 'desktop-hero.png') });

  for (const [category, count] of [['graduation', 11], ['couples', 17], ['family', 12], ['maternity', 7]]) {
    const filter = page.locator(`[data-filter="${category}"]`);
    await filter.click();
    assert.equal(await filter.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.gallery-item').count(), Math.min(9, count));
    assert.equal(await page.locator('#gallery-count').textContent(), `${Math.min(9, count)} of ${count} photographs`);
    await page.locator('.gallery-item').first().click();
    assert.ok(await page.locator('#lightbox').evaluate(dialog => dialog.open));
    const initial = await page.locator('#lightbox-image').getAttribute('src');
    await page.keyboard.press('ArrowRight');
    assert.notEqual(await page.locator('#lightbox-image').getAttribute('src'), initial);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#lightbox-image').getAttribute('src'), initial);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lightbox').evaluate(dialog => dialog.open), false);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.photo), await page.locator('.gallery-item').first().getAttribute('data-photo'));
    if (count > 9) {
      await page.locator('#load-more').click();
      assert.equal(await page.locator('.gallery-item').count(), count);
      assert.equal(await page.locator('#load-more').isVisible(), false);
    }
  }
  await page.locator('[data-filter="all"]').click();
  while (await page.locator('#load-more').isVisible()) await page.locator('#load-more').click();
  assert.equal(await page.locator('.gallery-item').count(), 47);
  const broken = await page.locator('.gallery-item img').evaluateAll(images => images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.src));
  assert.deepEqual(broken, []);

  await page.locator('[data-filter="all"]').click();
  for (const section of ['.intro', '#chapters', '#approach', '#portfolio', '#experience', '#inquire', '.site-footer']) {
    await page.locator(section).scrollIntoViewIfNeeded();
    await page.waitForTimeout(950);
  }
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: resolve(output, 'desktop-full.png'), fullPage: true });
  await page.locator('details').first().locator('summary').click();
  assert.equal(await page.locator('details').first().getAttribute('open'), '');
  await page.locator('details').first().locator('summary').click();

  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  await writeFile(resolve(output, 'accessibility.json'), JSON.stringify(accessibility.violations, null, 2));
  assert.deepEqual(accessibility.violations.map(item => `${item.id}: ${item.nodes.map(node => node.target.join(' ')).join(', ')}`), [], 'WCAG A/AA accessibility checks');

  // Browser form validation and truthful email composition; suppress opening external apps.
  await page.locator('#inquire').scrollIntoViewIfNeeded();
  await page.locator('#inquiry-submit').click();
  assert.equal(await page.locator('#inquiry-status').textContent(), '');
  await page.locator('[name="name"]').fill('Alex & Jo');
  await page.locator('[name="email"]').fill('alex@example.com');
  await page.locator('[name="session"]').selectOption('family');
  await page.locator('[name="message"]').fill('We would love some autumn family photographs.');
  await page.evaluate(() => document.addEventListener('click', event => {
    if (event.target.closest('a[href^="mailto:"]')) event.preventDefault();
  }, true));
  await page.locator('#inquiry-submit').click();
  assert.match(await page.locator('#inquiry-status').textContent(), /Send it from your email app/);
  const emailDraft = await page.locator('#inquiry-status a').getAttribute('href');
  assert.match(emailDraft, /^mailto:northstonephotography@outlook\.com\?/);
  assert.equal(new URL(emailDraft).searchParams.get('subject'), 'Family session inquiry — Alex & Jo');

  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    assert.ok(overflow.document <= overflow.viewport, `No horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`);
    if (width <= 800) {
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
      await page.locator('#navigation').getByRole('link', { name: 'The portfolio' }).click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
      await page.locator('[data-category="maternity"]').click();
      assert.equal(await page.locator('[name="session"]').inputValue(), 'maternity');
      assert.equal(await page.locator('[data-filter="maternity"]').getAttribute('aria-pressed'), 'true');
    }
    if (width === 390) {
      await page.locator('[data-filter="all"]').click();
      for (const section of ['.intro', '#chapters', '#approach', '#portfolio', '#experience', '#inquire', '.site-footer']) {
        await page.locator(section).scrollIntoViewIfNeeded();
        await page.waitForTimeout(950);
      }
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
      await page.waitForTimeout(600);
      await page.screenshot({ path: resolve(output, 'mobile-full.png'), fullPage: true });
      await page.screenshot({ path: resolve(output, 'mobile-hero.png') });
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#hero-photo').evaluate(image => getComputedStyle(image).transform), 'none');
  assert.equal(await page.locator('.intro h2').evaluate(element => getComputedStyle(element).opacity), '1');
  assert.deepEqual(errors, [], 'No browser errors');
  console.log('Passed: 4 collections, all 47 photos, filters, load more, lightbox, keyboard focus, FAQ, email inquiry, 6 viewport sizes, mobile menu, reduced motion, WCAG A/AA, and no browser errors.');
  console.log(`Screenshots: ${output}`);
} finally {
  await browser?.close();
  server.kill();
}
