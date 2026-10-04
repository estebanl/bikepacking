// NODE_PATH=/opt/codex/runtimes/cua/lib/node_modules BASE_URL=http://localhost:3001 node scripts/independent-validation.cjs
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const output=process.env.EVIDENCE_DIR || '/workspace/bikepacking-evidence/realism-independent';
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(), errors=[], report=[];
 page.on('pageerror',e=>errors.push(e.message));
 const log=message=>{report.push(message);console.log(message);};
 try{
  await page.goto(process.env.BASE_URL||'http://localhost:3001',{waitUntil:'networkidle'});
  await page.locator('canvas').waitFor();
  for(const model of ['Blur','Stigmata']){
   await page.getByRole('button',{name:'Bike',exact:true}).click();
   await page.getByRole('button',{name:new RegExp('Santa Cruz '+model)}).click();
   await page.getByRole('button',{name:'Size M',exact:true}).click();
   assert.match(await page.locator('.preview-heading').innerText(),new RegExp(model));
   await page.getByRole('button',{name:'Side View',exact:true}).click();
   await page.waitForTimeout(2000);
   await page.screenshot({path:path.join(output,`${model.toLowerCase()}-desktop.png`),fullPage:true});
   await page.locator('canvas').screenshot({path:path.join(output,`${model.toLowerCase()}-side.png`)});
   await page.getByRole('button',{name:'Isometric',exact:true}).click();
   await page.waitForTimeout(1600);
   await page.locator('canvas').screenshot({path:path.join(output,`${model.toLowerCase()}-iso.png`)});
   await page.setViewportSize({width:390,height:844});
   await page.waitForTimeout(1500);
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:path.join(output,`${model.toLowerCase()}-mobile.png`),fullPage:true});
   await page.setViewportSize({width:1440,height:1000});
   log(`PASS ${model} selected M, side/isometric controls, desktop and phone captures`);
  }
  for(const [width,height]of [[1440,1000],[1024,768],[768,1024],[390,844],[320,740]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(1500);
   const canvas=await page.locator('canvas').boundingBox();
   assert(canvas.width>=Math.min(280,width-30)&&canvas.height>=200,`canvas collapsed ${width}`);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
   if(width<981){
    await page.getByRole('button',{name:/Bottles:/}).scrollIntoViewIfNeeded();
    assert(await page.evaluate(()=>scrollY>0),'summary unreachable');await page.evaluate(()=>scrollTo(0,0));
   }
   if(width===390)await page.screenshot({path:path.join(output,'stigmata-mobile.png'),fullPage:true});
   log(`PASS viewport ${width}x${height}, canvas${Math.round(canvas.width)}x${Math.round(canvas.height)}`);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Gear',exact:true}).click();
  await page.getByRole('searchbox',{name:'Search gear'}).fill('Tailfin');
  const names=await page.locator('.config-content h4').allTextContents();
  assert(names.length===191,`Expected191Tailfin variants, got${names.length}`);
  log(`Visible Tailfin product cards: ${names.length}`);
  const product = async(name) => {
   await page.getByRole('searchbox',{name:'Search gear'}).fill(name);
   return page.getByRole('heading',{name,exact:true}).locator('xpath=../../..');
  };
  const mount = async(name,socket) => {
   const card=await product(name);
   await card.locator('select').selectOption(socket);
   await card.getByRole('button',{name:/^(Mount to Rig|Replace gear)$/}).click();
   assert(await card.getByRole('button',{name:/^Remove /}).count()>0);
  };
  const packName='Cage Packs · 3L';
  let pack=await product(packName);
  await pack.locator('select').selectOption('forkRight_0');
  assert(await pack.getByRole('button',{name:'Mount to Rig',exact:true}).isDisabled());
  await mount('Suspension Fork Mounts · Carbon','forkMountLeft');
  await mount('Cargo Cages · Small','cageLeft');
  pack=await product(packName);
  await pack.locator('select').selectOption('forkRight_0');
  assert(await pack.getByRole('button',{name:'Mount to Rig',exact:true}).isDisabled(),'left hardware cannot enable right bag');
  await mount(packName,'forkLeft_0');
  await mount('Suspension Fork Mounts · Carbon','forkMountRight');
  await mount('Cargo Cages · Small','cageRight');
  await mount(packName,'forkRight_0');
  pack=await product(packName);
  assert.equal(await pack.getByRole('button',{name:/^Remove /}).count(),2,'paired identical fork bags must be independently mounted');
  const leftMount=await product('Suspension Fork Mounts · Carbon');
  await leftMount.getByRole('button',{name:/^Remove .*Left/}).click();
  pack=await product(packName);
  assert.equal(await pack.getByRole('button',{name:/^Remove /}).count(),1,'left removal cascades to left bag only');
  await mount('Universal Thru Axle · Universal kit','rearAxleHardware');
  await mount('UDH Adaptor Set','rearUdhHardware');
  await mount('CargoPack System · Carbon / Fast Release / with pannier mounts','rearRack');
  await page.getByRole('button',{name:'Isometric',exact:true}).click();
  await page.waitForTimeout(1800);
  await page.screenshot({path:path.join(output,'stigmata-loaded-desktop.png'),fullPage:true});
  await page.locator('canvas').screenshot({path:path.join(output,'stigmata-loaded-canvas.png')});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1200);
  await page.screenshot({path:path.join(output,'stigmata-loaded-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  log('PASS catalog hardware dependency gate, side-specific cages, paired identical fork bags, cascading removal, rear axle/UDH/rack workflow');

  await page.getByRole('searchbox',{name:'Search gear'}).fill('nonexistent-product-xyz');
  assert(await page.getByText('No gear matches.',{exact:false}).isVisible());
  await page.getByRole('searchbox',{name:'Search gear'}).fill('');
  await page.getByRole('button',{name:'Payload',exact:true}).click();
  await page.getByRole('slider',{name:'Gear payload estimate'}).fill('3500');
  assert.match(await page.locator('.summary-card').innerText(),/3.50 kg/);
  await page.getByRole('button',{name:'Share rig',exact:true}).click();
  await page.getByRole('button',{name:'Rig link copied',exact:true}).waitFor();
  const share=await page.evaluate(()=>navigator.clipboard.readText());
  assert(share.includes('p=3500')&&share.includes('stigmata'));
  await page.getByRole('button',{name:'Export manifest',exact:true}).click();
  assert(await page.getByRole('dialog').isVisible());
  await page.getByRole('button',{name:'Markdown Table',exact:true}).click();
  assert.match(await page.getByRole('dialog').locator('pre').innerText(),/Stigmata/);
  await page.keyboard.press('Escape');
  assert(!(await page.getByRole('dialog').isVisible()));
  log('PASS search/empty-state, payload, share URL and export keyboard close');
  assert.deepEqual(errors,[]);
  log('PASS no browser JavaScript errors');
 }finally{
  await fs.writeFile(path.join(output,'runtime-results.json'),JSON.stringify({report,errors},null,2));
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
