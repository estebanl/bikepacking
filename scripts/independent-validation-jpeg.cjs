const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const out=process.env.EVIDENCE_DIR||'/workspace/bikepacking-evidence/realism-final';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 try{
  for(const model of ['blur','stigmata'])for(const loaded of [false,true]){
   const p=new URLSearchParams({b:`santa-cruz-${model}-2027`,s:'M'});
   if(loaded)p.set('bags','rearAxleHardware:tailfin-34167-v1,rearUdhHardware:tailfin-664853-v1,rearRack:tailfin-913333-v2,forkMountRight:tailfin-42733-v1,cageRight:tailfin-32010-v1,forkRight_0:tailfin-56316-v2');
   await page.goto(`${process.env.BASE_URL||'http://localhost:3002'}?${p}`,{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Bike',exact:true}).click();
   await page.getByRole('button',{name:'Isometric',exact:true}).click();
   await page.waitForTimeout(2500);
   for(const [width,height,label]of [[1440,1000,'desktop'],[390,844,'mobile']]){
    await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1500);
    const stem=`${model}${loaded?'-loaded':''}-${label}-review`;
    await page.screenshot({path:path.join(out,stem+'.jpg'),type:'jpeg',quality:75,fullPage:true});
    console.log(stem+'.jpg');
   }
   await page.setViewportSize({width:1440,height:1000});
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
