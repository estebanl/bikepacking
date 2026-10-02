import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import type { BagItem, BikeSizeConfig, SocketAnchor } from '../src/types/index.ts';
import { getSocketAnchors, validateMount, sanitizeMountedBags } from '../src/lib/sockets.ts';
import { equipmentDimensions, getEquipmentDimensions } from '../src/lib/equipmentGeometry.ts';
import { calculateRigMetrics } from '../src/lib/balance.ts';
import { deserializeRigFromUrlQuery, serializeRigToUrlQuery, generateMarkdownManifest } from '../src/lib/export.ts';
import { evaluateClearances } from '../src/lib/clearance.ts';
const bikes = BIKES.filter(b => b.brand === 'Santa Cruz');
const cases = bikes.flatMap(bike => Object.entries(bike.sizes).map(([key,size]) => ({bike,key,size})));
const side = (id: string) => /Left/.test(id) ? 'Left' : /Right/.test(id) ? 'Right' : null;
const scoped = new Set(['fork-mount','cargo-cage','cargo-cage-load-chip-host']);
// Independent contract oracle: no production capability/validation helper is used here.
function compatible(item: BagItem, anchor: SocketAnchor) {
  return anchor.allowedBagCategories.includes(item.category) && item.compatibleSockets.some(id => id === anchor.id || ((id==='forkLeft'||id==='forkRight') && anchor.id.startsWith(id))) && !(item.handlebarType && anchor.handlebarType && item.handlebarType !== anchor.handlebarType);
}
function dependencies(item: BagItem, anchor: SocketAnchor, mounted: Record<string,BagItem>) {
  return [...(item.requires??[]),...(anchor.requires??[])].every(required => Object.entries(mounted).some(([id, provider]) => id!==anchor.id && (provider.id===required || provider.provides?.includes(required)) && (!scoped.has(required) || (side(id)!==null && side(id)===side(anchor.id)))));
}
function assertClean(size: BikeSizeConfig, mounted: Record<string,BagItem>) {
  const anchors=getSocketAnchors(size,mounted);
  for(const [id,item] of Object.entries(mounted)) {
    const anchor=anchors.find(a=>a.id===id);
    assert.ok(anchor,`stale socket ${id}`);
    assert.ok(compatible(item,anchor),`incompatible ${item.id} at ${id}`);
    assert.ok(dependencies(item,anchor,mounted),`missing scoped dependency ${item.id} at ${id}`);
    assert.equal(item.previewStatus,'mountable',`nonpreview item survived ${item.id}`);
  }
}
function provision(item: BagItem, anchor: SocketAnchor, size: BikeSizeConfig, mounted: Record<string,BagItem> = {}, visiting = new Set<string>()): Record<string,BagItem> | null {
  if(visiting.has(anchor.id) || !compatible(item,anchor)) return null;
  const nextVisit=new Set(visiting).add(anchor.id); let next={...mounted};
  for(const required of [...(item.requires??[]),...(anchor.requires??[])]) {
    if(dependencies({...item,requires:[required]}, {...anchor,requires:[]},next)) continue;
    let found: Record<string,BagItem>|null=null;
    for(const provider of TAILFIN_CATALOG.filter(p=>p.id===required || p.provides?.includes(required))) {
      for(const target of getSocketAnchors(size)) {
        if(nextVisit.has(target.id) || (scoped.has(required) && (!side(anchor.id)||side(target.id)!==side(anchor.id)))) continue;
        const candidate=provision(provider,target,size,next,nextVisit);
        if(candidate) {found=candidate;break;}
      }
      if(found) break;
    }
    if(!found) return null;
    next=found;
  }
  if(!validateMount(item,anchor.id,size,next).allowed) return null;
  return {...next,[anchor.id]:item};
}

test('all 191 catalogue variants preserve finite specifications and explicit unknowns',()=>{
  assert.equal(bikes.length,2);assert.equal(cases.length,10);assert.equal(TAILFIN_CATALOG.length,191);
  assert.equal(new Set(TAILFIN_CATALOG.map(p=>p.id)).size,191);
  for(const item of TAILFIN_CATALOG) {
    for(const value of [item.dryWeightGrams,item.volumeLiters,item.priceUsd,...Object.values(item.dimensionsMm)]) assert.ok(value===null || (Number.isFinite(value)&&value>=0),`${item.id} invalid numeric spec`);
    assert.ok(equipmentDimensions(item).every(v=>Number.isFinite(v)&&v>0),`${item.id} invalid render size`);
    if(item.dryWeightGrams===null) assert.equal(item.weightStatus,'unknown',item.id);
    if(Object.values(item.dimensionsMm).some(v=>v===null)) { assert.notEqual(item.dimensionsStatus,'verified',item.id);assert.equal(getEquipmentDimensions(item,{allowEstimate:false}),null,item.id); }
    if(item.previewStatus!=='mountable') assert.deepEqual(item.compatibleSockets,[],item.id);
    assert.notEqual(item.fitStatus,'verified',`${item.id} must not claim model fit`);
  }
  assert.equal(TAILFIN_CATALOG.find(p=>p.sourceProductId==='tailfin-959100')?.dryWeightGrams,null,'Hydro body-only mass must not become complete assembly mass');
});

test('every variant against every Santa Cruz size and socket rejects unsupported interfaces and missing dependencies',()=>{
  let checks=0;
  for(const {size,key,bike} of cases) {
    const anchors=getSocketAnchors(size);assert.equal(new Set(anchors.map(a=>a.id)).size,anchors.length);
    for(const item of TAILFIN_CATALOG) for(const anchor of anchors) {
      checks++;
      const result=validateMount(item,anchor.id,size,{});
      const expected=compatible(item,anchor)&&dependencies(item,anchor,{});
      assert.equal(result.allowed,expected,`${bike.id}/${key}/${item.id}/${anchor.id}`);
      if(result.allowed&&/fork|cage|cargoFoot/i.test(anchor.id)) { assert.equal(anchor.verification,'unverified');assert.notEqual(item.fitStatus,'verified'); }
    }
  }
  console.log(`Exhaustive empty-state mount matrix: ${checks} combinations`);
});

test('all provisionable catalogue placements conserve mass and survive share roundtrip; switches sanitize stale gear',()=>{
  let configurations=0;
  for(const {bike,key,size} of cases) for(const item of TAILFIN_CATALOG) for(const anchor of getSocketAnchors(size)) {
    if(!compatible(item,anchor)) continue;
    const mounted=provision(item,anchor,size);if(!mounted) continue;
    configurations++;assertClean(size,mounted);
    const metrics=calculateRigMetrics(bike,size,mounted,1373);
    for(const value of Object.values(metrics).filter(v=>typeof v==='number')) assert.ok(Number.isFinite(value));
    assert.equal(metrics.totalRigWeightGrams,bike.baseWeightGrams+1373+Object.values(mounted).reduce((sum,b)=>sum+(b.dryWeightGrams??0),0));
    assert.equal(metrics.frontAxleWeightGrams+metrics.rearAxleWeightGrams,metrics.totalRigWeightGrams);
    for(const unknown of Object.values(mounted).filter(b=>b.dryWeightGrams===null)) assert.ok(metrics.unknownWeightItemIds?.includes(unknown.id));
    if(Object.values(mounted).some(b=>b.dryWeightGrams===null)) assert.match(generateMarkdownManifest({bike,sizeKey:key,mountedBags:mounted,metrics}),/Unknown|unknown/);
    const query=serializeRigToUrlQuery({bikeId:bike.id,sizeKey:key,mountedBags:mounted,payloadGrams:1373,dropper:false,bottles:true});
    const parsed=deserializeRigFromUrlQuery(query,TAILFIN_CATALOG);
    const clean=sanitizeMountedBags(parsed.mountedBags,size);assert.equal(clean.removed.length,0);assertClean(size,clean.mountedBags);
    // Every other frame/model size is a destination, not just a same-model copy.
    for(const destination of cases) assertClean(destination.size,sanitizeMountedBags(parsed.mountedBags,destination.size).mountedBags);
    const warnings=evaluateClearances({bike,sizeConfig:size,mountedBags:mounted,dropperPostCompressed:false,waterBottlesMounted:false});
    assert.ok(warnings.some(w=>w.type==='fit_unverified'),`${item.id} missing uncertainty`);
  }
  assert.ok(configurations>100);console.log(`Provisioned ${configurations} configurations; checked all 10 switch destinations each`);
});

test('opposite-side hardware never satisfies side-scoped dependencies across all frame sizes',()=>{
  let checks=0;
  for(const {size} of cases) for(const item of TAILFIN_CATALOG) for(const anchor of getSocketAnchors(size)) {
    if(!compatible(item,anchor)||!side(anchor.id)) continue;
    const required=[...(item.requires??[]),...(anchor.requires??[])].filter(r=>scoped.has(r));
    if(!required.length) continue;
    const valid=provision(item,anchor,size);if(!valid) continue;
    const opposite:Record<string,BagItem>={};
    for(const [id,bag] of Object.entries(valid)) if(id!==anchor.id) opposite[id.replace(/Left|Right/g,s=>s==='Left'?'Right':'Left')]=bag;
    assert.equal(validateMount(item,anchor.id,size,opposite).allowed,false,`${item.id}/${anchor.id}`);checks++;
  }
  assert.ok(checks>0);console.log(`Opposite-side dependency attacks rejected: ${checks}`);
});

test('paired assignments count each physical copy once and dependency removal stays on its own side',()=>{
  const cargo=TAILFIN_CATALOG.find(p=>p.sourceProductId==='tailfin-56316');assert.ok(cargo);
  for(const {bike,size} of cases) {
    const anchors=getSocketAnchors(size), left=anchors.find(a=>a.id==='forkLeft_0')!, right=anchors.find(a=>a.id==='forkRight_0')!;
    const mounted=provision(cargo,right,size,provision(cargo,left,size)!);assert.ok(mounted);assertClean(size,mounted);
    assert.equal(Object.values(mounted).filter(p=>p.id===cargo.id).length,2);
    const metrics=calculateRigMetrics(bike,size,mounted,0);
    assert.equal(metrics.totalBagsDryWeightGrams,Object.values(mounted).reduce((sum,b)=>sum+(b.dryWeightGrams??0),0));
    const missingLeft={...mounted};delete missingLeft.forkMountLeft;
    const clean=sanitizeMountedBags(missingLeft,size);
    assert.equal(clean.mountedBags.forkLeft_0,undefined);
    assert.equal(clean.mountedBags.cageLeft,undefined);
    assert.equal(clean.mountedBags.forkRight_0?.id,cargo.id);
    assertClean(size,clean.mountedBags);
  }
});

test('hostile shared imports never retain prototype keys, unavailable sockets, wrong-side dependencies or nonfinite payload',()=>{
  for(const item of TAILFIN_CATALOG) {
    const imported=deserializeRigFromUrlQuery(`?p=Infinity&bags=__proto__:${item.id},constructor:${item.id},unknownSocket:${item.id},forkRight_0:${item.id},forkLeft_0:${item.id}`,TAILFIN_CATALOG);
    assert.equal(imported.payloadGrams,0);
    assert.equal(Object.prototype.hasOwnProperty.call(imported.mountedBags,'__proto__'),false);
    assert.equal(Object.prototype.hasOwnProperty.call(imported.mountedBags,'constructor'),false);
    for(const {size} of cases) {
      const clean=sanitizeMountedBags(imported.mountedBags,size);
      assert.equal(Object.prototype.hasOwnProperty.call(clean.mountedBags,'unknownSocket'),false);
      assertClean(size,clean.mountedBags);
    }
  }
});
