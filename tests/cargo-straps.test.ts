import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { validateMount, sanitizeMountedBags, hasMountCapability } from '../src/lib/sockets.ts';
import { calculateRigMetrics } from '../src/lib/balance.ts';
import { serializeRigToUrlQuery, deserializeRigFromUrlQuery } from '../src/lib/export.ts';
const item=(id:string)=>{const found=TAILFIN_CATALOG.find(p=>p.id===`tailfin-${id}`);assert.ok(found,id);return found;};
const bike=BIKES.find(b=>b.brand==='Santa Cruz')!, size=Object.values(bike.sizes)[0];
const hardware={forkMountLeft:item('42733-v1'),cageLeft:item('32010-v1')};
const right={forkMountRight:item('42733-v1'),cageRight:item('32010-v1'),cargoStrapUpperRight:item('126220-v1'),cargoStrapLowerRight:item('126220-v1'),forkRight_0:item('56316-v1')};
test('upper and lower straps are distinct same-side roles, never a single capability provider',()=>{
 const one={...hardware,cargoStrapUpperLeft:item('126220-v1')};
 assert.equal(hasMountCapability(one,'forkLeft_0','cargo-strap-upper'),true);
 assert.equal(hasMountCapability(one,'forkLeft_0','cargo-strap-lower'),false);
 assert.equal(hasMountCapability(one,'forkRight_0','cargo-strap-upper'),false);
 assert.equal(validateMount(item('56316-v1'),'forkLeft_0',size,one).allowed,false);
 assert.equal(validateMount(item('126220-v1'),'cargoStrapUpperLeft',size,{}).allowed,false);
 assert.equal(validateMount(item('126220-v1'),'cargoStrapUpperLeft',size,hardware).allowed,true);
});
test('all upper/lower length permutations enforce documented Cage Pack pairing',()=>{
 const expected=[[1],[2],[2,3]];
 for(let pack=1;pack<=3;pack++) for(let upper=1;upper<=3;upper++) for(let lower=1;lower<=3;lower++) {
  const config={...hardware,cargoStrapUpperLeft:item(`126220-v${upper}`),cargoStrapLowerLeft:item(`126220-v${lower}`)};
  assert.equal(validateMount(item(`56316-v${pack}`),'forkLeft_0',size,config).allowed,expected[pack-1].includes(upper)&&expected[pack-1].includes(lower),`pack${pack}:upper${upper}/lower${lower}`);
 }
});
test('strap replacement or removal cascades only the incompatible pack on its side',()=>{
 const loaded={...hardware,...right,cargoStrapUpperLeft:item('126220-v2'),cargoStrapLowerLeft:item('126220-v2'),forkLeft_0:item('56316-v2')};
 assert.equal(sanitizeMountedBags(loaded,size).removed.length,0);
 const replaced=sanitizeMountedBags({...loaded,cargoStrapUpperLeft:item('126220-v1')},size);
 assert.equal(replaced.mountedBags.forkLeft_0,undefined);assert.equal(replaced.mountedBags.forkRight_0?.id,right.forkRight_0.id);
 const removed={...loaded};delete (removed as Partial<typeof removed>).cargoStrapLowerLeft;
 const clean=sanitizeMountedBags(removed,size);
 assert.equal(clean.mountedBags.forkLeft_0,undefined);assert.ok(clean.mountedBags.forkRight_0);assert.ok(clean.mountedBags.cargoStrapUpperLeft);
});
test('pack plus two individual Cargo Straps adds exact published masses without invented compression strap mass',()=>{
 for(const [pack,strap,expected] of [[1,1,175],[2,2,224],[3,2,253],[3,3,267]]) {
  const bare=calculateRigMetrics(bike,size,hardware,0);
  const full=calculateRigMetrics(bike,size,{...hardware,cargoStrapUpperLeft:item(`126220-v${strap}`),cargoStrapLowerLeft:item(`126220-v${strap}`),forkLeft_0:item(`56316-v${pack}`)},0);
  assert.equal(full.totalRigWeightGrams-bare.totalRigWeightGrams,expected);
 }
});
test('legacy URL without straps removes pack with reasons; new full rig roundtrips without invented parts',()=>{
 const old=deserializeRigFromUrlQuery(`?bags=forkMountLeft:tailfin-42733-v1,cageLeft:tailfin-32010-v1,forkLeft_0:tailfin-56316-v1`,TAILFIN_CATALOG);
 const clean=sanitizeMountedBags(old.mountedBags,size);assert.equal(clean.mountedBags.forkLeft_0,undefined);
 assert.ok(clean.removed.some(r=>r.bagId==='tailfin-56316-v1'&&r.reasons.some(reason=>/upper Cargo Strap|lower Cargo Strap/.test(reason))));
 assert.equal(Object.keys(clean.mountedBags).length,2);
 const loaded={...hardware,cargoStrapUpperLeft:item('126220-v1'),cargoStrapLowerLeft:item('126220-v1'),forkLeft_0:item('56316-v1')};
 const query=serializeRigToUrlQuery({bikeId:bike.id,sizeKey:Object.keys(bike.sizes)[0],mountedBags:loaded,payloadGrams:0,dropper:false,bottles:false});
 const newClean=sanitizeMountedBags(deserializeRigFromUrlQuery(query,TAILFIN_CATALOG).mountedBags,size);
 assert.equal(newClean.removed.length,0);assert.deepEqual(Object.keys(newClean.mountedBags).sort(),Object.keys(loaded).sort());
});
