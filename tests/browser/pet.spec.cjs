const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const crypto = require('node:crypto');
const original = crypto.createHash('sha256').update(fs.readFileSync('pet.png')).digest('hex');
async function open(page) {
  await page.clock.install({ time: new Date("2026-10-25T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-25T00:00:01Z"));
  await page.goto('/');
  await expect(page.locator('#pet-image')).toHaveJSProperty('complete', true);
  await expect(page.locator('#pet-image')).toHaveJSProperty('naturalWidth', 1116);
}
async function state(page, value) { await expect(page.locator('#pet')).toHaveAttribute('data-state', value); }
async function advance(page, ms) { await page.clock.runFor(ms); }

test('one intact original character, no SVG/body-part overlays; centered on desktop and phone', async ({ page }) => {
  const errors = []; page.on('pageerror', e=>errors.push(e.message));
  await open(page);
  await expect(page.locator('img')).toHaveCount(1);
  await expect(page.locator('svg, .face, .eyelids, .blush, .greeting-hand')).toHaveCount(0);
  const response = await page.request.get(await page.locator('#pet-image').getAttribute('src'));
  expect(crypto.createHash('sha256').update(await response.body()).digest('hex')).toBe(original);
  await state(page,'greet'); await advance(page,1000); await state(page,'idle');
  const box = await page.locator('.pet-home').boundingBox();
  expect(Math.abs(box.x+box.width/2-640)).toBeLessThan(2);
  expect(Math.abs(box.y+box.height/2-400)).toBeLessThan(2);
  expect(box.width).toBeLessThanOrEqual(240);
  expect(await page.locator('.pet-art').evaluate(e=>getComputedStyle(e).animationName)).toBe('breathe');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>localStorage.clear()); await page.reload(); await advance(page,1000);
  const mobile = await page.locator('.pet-home').boundingBox();
  expect(Math.abs(mobile.x+mobile.width/2-195)).toBeLessThan(2);
  expect(mobile.x).toBeGreaterThanOrEqual(0); expect(mobile.x+mobile.width).toBeLessThanOrEqual(390);
  await expect(page.locator('.sleep-mark')).toHaveCSS('position','absolute');
  expect(await page.locator('.sleep-mark').evaluate(e=>e.offsetParent.className)).toBe('pet-art');
  expect(errors).toEqual([]);
});

test('hover, single and double click are distinct; whole image animates and returns to idle', async ({ page }) => {
  await open(page);await advance(page,1000);
  const states=[];
  await page.exposeFunction('recordState', state=>states.push(state));
  await page.evaluate(()=>new MutationObserver(()=>window.recordState(document.querySelector('#pet').dataset.state)).observe(document.querySelector('#pet'),{attributes:true,attributeFilter:['data-state']}));
  await page.locator('#pet').hover();await advance(page,1499);await state(page,'idle');
  await advance(page,1);await state(page,'shy');await advance(page,800);await state(page,'idle');
  await page.locator('#pet').click();await advance(page,349);await state(page,'idle');
  await advance(page,1);await state(page,'happy');
  await expect(page.locator('#bubble')).toContainText('今天想了解');
  await advance(page,700);await state(page,'idle');
  await advance(page,2300);await expect(page.locator('#bubble')).not.toHaveClass('visible');
  states.length=0;
  await page.locator('#pet').dblclick({delay:80});await state(page,'playInstrument');
  await advance(page,2999);await state(page,'playInstrument');await advance(page,1);await state(page,'idle');
  expect(states).not.toContain('happy');
  await expect(page.locator('#pet-image')).toHaveAttribute('src',/pet\.[a-f0-9]+\.png/);
});

test('drag suppresses click, lands, saves position and clamps restored coordinates on a smaller viewport', async ({ page }) => {
  await open(page);await advance(page,1000);
  const home=page.locator('.pet-home');const start=await home.boundingBox();
  await page.mouse.move(start.x+start.width/2,start.y+100);await page.mouse.down();
  await page.mouse.move(start.x+start.width/2+150,start.y+160);await state(page,'drag');
  await advance(page,1600);await state(page,'drag');
  await page.mouse.up();await state(page,'land');await advance(page,420);await state(page,'idle');
  const end=await home.boundingBox();expect(end.x-start.x).toBeCloseTo(150,0);expect(end.y-start.y).toBeCloseTo(60,0);
  await expect(page.locator('#bubble')).not.toHaveClass('visible');
  await advance(page,500);await state(page,'idle');
  await page.reload();const restored=await home.boundingBox();
  expect(restored.x).toBeCloseTo(end.x,0);expect(restored.y).toBeCloseTo(end.y,0);
  await page.setViewportSize({width:360,height:640});
  await expect.poll(async()=>{const b=await home.boundingBox();return b.x+b.width<=360 && b.y+b.height<=640;}).toBe(true);
  await page.reload();const small=await home.boundingBox();expect(small.x+small.width).toBeLessThanOrEqual(360);
});

test('sleep after four minutes, Zzz stays attached; click wakes and reminders do not interrupt sleep', async ({ page }) => {
  await open(page);await advance(page,90000);await state(page,'greet');
  await expect(page.locator('#bubble')).toContainText('剪纸');
  await advance(page,150000);await state(page,'sleep');
  await expect(page.locator('.sleep-mark')).toHaveCSS('position','absolute');
  await advance(page,180000);await state(page,'sleep');
  await expect(page.locator('#bubble')).not.toHaveClass('visible');
  await page.locator('#pet').click();await advance(page,350);await state(page,'happy');
  await advance(page,700);await state(page,'idle');
  await page.evaluate(()=>window.dispatchEvent(new Event('pet:celebrate')));await state(page,'greet');
  await expect(page.locator('#bubble')).toContainText('太棒');
});

test('pointer cancellation releases drag, keyboard works, reduced motion disables movement, corrupt storage is safe', async ({ page }) => {
  await open(page);await advance(page,1000);
  await page.locator('#pet').focus();await page.keyboard.press('Enter');await state(page,'happy');await advance(page,700);
  const b=await page.locator('#pet').boundingBox();
  await page.mouse.move(b.x+100,b.y+100);await page.mouse.down();await page.mouse.move(b.x+130,b.y+120);await state(page,'drag');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await state(page,'land');await page.mouse.up();
  await advance(page,420);await state(page,'idle');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.pet-art')).toHaveCSS('animation-name','none');
  await page.evaluate(()=>localStorage.setItem('amazing-pet.position.v1','{invalid'));
  await page.reload();await state(page,'greet');
  await page.evaluate(()=>localStorage.setItem('amazing-pet.position.v1',JSON.stringify({x:-1e9,y:1e9})));
  await page.reload();const restored=await page.locator('.pet-home').boundingBox();
  expect(restored.x).toBeGreaterThanOrEqual(0);expect(restored.y+restored.height).toBeLessThanOrEqual(800);
});
