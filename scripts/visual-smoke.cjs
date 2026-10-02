// Run against `npm run start`: NODE_PATH=<Playwright installation>/node_modules node scripts/visual-smoke.cjs
// EVIDENCE_DIR and BASE_URL are optional. Uses an installed Chromium or CHROMIUM_PATH.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const output = process.env.EVIDENCE_DIR || '/tmp/bikepacking-visual-checks';
const base = process.env.BASE_URL || 'http://localhost:3000';
(async () => {
  await fs.mkdir(output, {recursive:true});
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context = await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(base, {waitUntil:'networkidle'});
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2500);
    for (const [width,height] of [[1440,1000],[1280,800],[1024,768],[768,1024],[390,844],[320,740]]) {
      await page.setViewportSize({width,height});
      await page.waitForTimeout(1800);
      const bounds = await page.locator('canvas').boundingBox();
      assert(bounds.width >= Math.min(280,width-30), `Preview width at ${width}: ${bounds.width}`);
      assert(bounds.height >= 200, `Preview height at ${width}: ${bounds.height}`);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${width}`);
      if(width <= 980) {
        await page.getByRole('button',{name:'Bottles: Mounted',exact:true}).scrollIntoViewIfNeeded();
        assert(await page.evaluate(()=>scrollY > 0), 'Mobile page must scroll to summary');
        await page.evaluate(()=>scrollTo(0,0));
      } else {
        const summary = await page.locator('.summary-card').boundingBox();
        assert(summary.x >= bounds.x+bounds.width || summary.y >= bounds.y+bounds.height, 'Summary covers preview');
      }
      if ([1440,390,1024].includes(width)) await page.screenshot({path:path.join(output, `after-${width===1440?'desktop':width===390?'mobile':'tablet'}.png`),fullPage:true});
      console.log(`PASS layout ${width}x${height}: canvas ${Math.round(bounds.width)}x${Math.round(bounds.height)}, no horizontal overflow`);
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.getByRole('button',{name:'Bike',exact:true}).click();
    await page.getByRole('button',{name:/Trek Checkpoint/}).click();
    await page.getByRole('button',{name:'Size 54cm',exact:true}).click();
    assert.match(await page.locator('.preview-heading').innerText(), /54cm[\s\S]*Trek/);
    await page.getByRole('button',{name:'Gear',exact:true}).click();
    await page.getByRole('searchbox',{name:'Search gear'}).fill('Terrapin');
    await page.getByRole('button',{name:'Mount to Rig',exact:true}).click();
    assert.match(await page.locator('.summary-card').innerText(), /14 L/);
    await page.getByRole('button',{name:'Remove',exact:true}).click();
    assert.match(await page.locator('.summary-card').innerText(), /0 L/);
    await page.getByRole('searchbox',{name:'Search gear'}).fill('not-a-bag');
    assert(await page.getByText('No gear matches.',{exact:false}).isVisible());
    await page.getByRole('searchbox',{name:'Search gear'}).fill('');
    await page.getByRole('button',{name:'Bottles: Mounted',exact:true}).click();
    await page.getByLabel('Load a preset').selectOption('overloaded');
    assert(await page.getByRole('button',{name:'Bottles: Mounted',exact:true}).isVisible());
    assert.match(await page.locator('.clearance-notices').innerText(), /bottle cages/);
    await page.getByRole('button',{name:'Bottles: Mounted',exact:true}).click();
    assert(!/bottle cages/.test(await page.locator('.clearance-notices').innerText()));
    await page.getByLabel('Load a preset').selectOption('endurance');
    await page.getByRole('button',{name:'Payload',exact:true}).click();
    await page.getByRole('slider',{name:'Gear payload estimate'}).fill('3500');
    assert.match(await page.locator('.summary-card').innerText(), /3.50 kg/);
    console.log('PASS bike/size, gear search + mount/remove, payload, presets and bottle-warning consistency');
    for (const name of ['Side View','Cockpit','Rear Tire','Isometric']) {
      await page.getByRole('button',{name,exact:true}).click();
      assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');
      await page.waitForTimeout(1500);
    }
    await page.screenshot({path:path.join(output,'after-loaded-rig.png'),fullPage:true});
    await page.locator('canvas').screenshot({path:path.join(output,'camera-home.png')});
    const canvas = await page.locator('canvas').boundingBox();
    await page.mouse.move(canvas.x+canvas.width*.6, canvas.y+canvas.height*.5);
    await page.mouse.down(); await page.mouse.move(canvas.x+canvas.width*.3,canvas.y+canvas.height*.55,{steps:12}); await page.mouse.up();
    await page.waitForTimeout(2000);
    await page.locator('canvas').screenshot({path:path.join(output,'camera-orbit.png')});
    await page.waitForTimeout(2000);
    await page.locator('canvas').screenshot({path:path.join(output,'camera-orbit-held.png')});
    await page.getByRole('button',{name:'Isometric',exact:true}).click();
    await page.waitForTimeout(1800);
    await page.locator('canvas').screenshot({path:path.join(output,'camera-reset.png')});
    console.log('PASS camera presets; orbit persistence and same-preset reset captured for pixel comparison');
    await page.getByRole('button',{name:'Share rig',exact:true}).click();
    const share = await page.evaluate(()=>navigator.clipboard.readText());
    assert(share.includes('bags=') && share.includes('p=3500'));
    await page.getByRole('button',{name:'Export manifest',exact:true}).click();
    const dialog=page.getByRole('dialog');
    assert(await dialog.isVisible());
    await page.getByRole('button',{name:'Markdown Table',exact:true}).click();
    assert.match(await dialog.locator('pre').innerText(),/Rig Manifest/);
    await page.getByRole('button',{name:'CSV Spreadsheet',exact:true}).click();
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Download .CSV File',exact:true}).click();
    const download=await downloadPromise;
    await download.saveAs(path.join(output,'tested-manifest.csv'));
    assert.match(await fs.readFile(path.join(output,'tested-manifest.csv'),'utf8'), /TOTAL RIG SUMMARY/);
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Printable Summary',exact:true}).click();
    await page.screenshot({path:path.join(output,'after-mobile-export.png'),fullPage:true});
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('.workspace-heading').evaluate(el=>getComputedStyle(el).display),'none');
    await page.emulateMedia({media:'screen'});
    await page.keyboard.press('Escape');
    assert.equal(await dialog.count(),0);
    assert.equal(await page.getByRole('button',{name:'Export manifest',exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.goto(share);
    await page.waitForSelector('canvas');
    assert.match(await page.locator('.summary-card').innerText(),/3.50 kg/);
    console.log('PASS clipboard sharing + URL restore, Markdown, downloaded CSV, mobile dialog, print isolation, Escape + focus restoration');
    for (const route of ['/routes/index.html','/routes/manitoba.html','/routes/Manitoba.gpx']) assert.equal((await context.request.get(base+route)).status(),200);
    console.log('PASS preserved route/GPX URLs respond 200 (external map tiles not tested)');
    assert.deepEqual(errors,[]);
    console.log('PASS no JavaScript page errors');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
