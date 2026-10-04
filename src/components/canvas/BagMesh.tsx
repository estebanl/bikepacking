"use client";

import { AxleHardwareModel, UdhHardwareModel } from "./equipment/AxleHardwareModel";
import { getAxleHardwarePoses } from "@/lib/axleHardwareGeometry";
import { RearArchHardwareModel } from "./equipment/RearArchHardwareModel";
import { RemovableRackTopConnectorModel, TopTubeFlipBuckleModel } from "./equipment/ServiceHardwareModels";
import { RearConnectorModel } from "./equipment/RearConnectorModel";
import { getRearConnectorGeometry } from "@/lib/rearConnectorGeometry";
import { RearPannierHardwareModel } from "./equipment/RearPannierHardwareModel";
import { FrameAttachmentModel } from "./equipment/FrameAttachmentModel";
import { getFrameAttachmentStations, getRearSeatStrapStation } from "@/lib/frameAttachmentGeometry";
import { getFrameAttachmentSpec } from "@/lib/frameAttachments";
import * as THREE from "three";
import { ForkPackHardwareModel } from "./equipment/ForkPackHardwareModel";
import { isForkPackBag, isMiniPannier, isForkPackPart, isWholeForkPackKit, forkPackSide, getForkPackHardwarePose, getRearPannierPose } from "@/lib/forkPackGeometry";
import { getRearArchPose, isRearArchReplacement, archHasPannierMounts, rackHasPannierMounts } from "@/lib/rearArchReplacement";
import { BagItem, SocketAnchor } from "@/types";
import { useRigStore } from "@/store/useRigStore";
import { getEquipmentPlacement, equipmentKind, rotateEquipmentPoint, type Point3 } from "@/lib/equipmentGeometry";
import { EquipmentModel, type BarSupportEndpoints } from "./equipment/EquipmentModel";

import { getCargoStrapEnvelope, getCargoStrapRearExtension, getBarCageEnvelope, isBarCageBundle } from "@/lib/cargoStraps";
import { findSocket } from "@/lib/sockets";
import { getBottleMountPose } from "@/lib/bottleMounts";
import { getBikeGeometry } from "@/lib/bikeGeometry";

interface BagMeshProps {
  socketId: string;
  bag: BagItem;
  anchor: SocketAnchor;
}

export function BagMesh({ socketId, bag, anchor }: BagMeshProps) {
  const bike = useRigStore(s => s.currentBike);
  const mounted = useRigStore(s => s.mountedBags);
  const size = useRigStore(s => s.currentSizeConfig);
  const warnings = useRigStore((s) => s.clearanceWarnings);
  const compressed = useRigStore((s) => s.dropperPostCompressed);
  const affected = warnings.filter((w) => w.affectedBagIds.includes(bag.id));
  const severe = affected.some((w) => w.severity === "error");
  const placement = getEquipmentPlacement(bag, anchor, compressed);
  const { length: l, height: h, depth: d } = placement.dimensions;
  let seatPackAttachment: {rail:Point3;post:Point3}|undefined;
  if(equipmentKind(bag)==='seat_pack') {
    const geometry=getBikeGeometry(bike,size,compressed);
    const inverse=new THREE.Quaternion().setFromEuler(new THREE.Euler(...placement.rotation)).invert();
    const local=(point:THREE.Vector3)=>point.sub(new THREE.Vector3(...placement.position)).applyQuaternion(inverse).toArray() as Point3;
    seatPackAttachment={
      rail:local(new THREE.Vector3(...geometry.saddleBase).add(new THREE.Vector3(-.03,-.021,0))),
      post:local(new THREE.Vector3(...geometry.saddleBase).lerp(new THREE.Vector3(...geometry.seatCluster),.25)),
    };
  }
  let rearDeck: {length:number;depth:number} | undefined;
  if (bag.id === "tailfin-1029289-v1" && mounted.rearRack) {
    const rackAnchor=findSocket(size,"rearRack",mounted);
    if(rackAnchor) rearDeck=getEquipmentPlacement(mounted.rearRack,rackAnchor).dimensions;
  }
  const rearHostAnchor=mounted.rearRack ? findSocket(size,"rearRack",mounted) : undefined;
  const rearArchPose=mounted.rearRack && rearHostAnchor ? getRearArchPose(mounted.rearRack,rearHostAnchor) : undefined;
  const rearArchDimensions=rearArchPose?.dimensions;
  const installedArch=mounted.rearArchReplacement ?? mounted.rearRack;
  const fastRelease=/^tailfin-(895075|913333|894178)-v/.test(mounted.rearRack?.id ?? "");
  const rackParts={
    hideArch: !!mounted.rearArchReplacement,
    carbon: /Carbon/.test(installedArch?.name ?? bag.name),
    fastRelease,
    showDropouts: [!mounted.rearDropoutLeft,!mounted.rearDropoutRight] as [boolean,boolean],
    showBushings: !mounted.rearDropoutBushings,
    showBumpers: !mounted.rearArchBumpers,
    pannierMounts: isRearArchReplacement(bag) ? archHasPannierMounts(bag) : rackHasPannierMounts(mounted),
  };
  const axlePoses=getAxleHardwarePoses(bike,size);
  const axleHost=socketId==='rearAxleHardware' && /^tailfin-(34167|564)-v/.test(bag.id);
  const axlePart=['rearAxleNds','rearAxleDs','rearAxleSpacers'].includes(socketId);
  const udhHost=socketId==='rearUdhHardware' && /^tailfin-664853-v/.test(bag.id);
  const udhPart=socketId==='rearUdhHanger';
  const archHardwarePart=['rearDropoutLeft','rearDropoutRight','rearDropoutBushings','rearArchBumpers'].includes(socketId);
  const dedicatedHardware=axleHost || axlePart || udhHost || udhPart || archHardwarePart;
  const forkSide=forkPackSide(socketId);
  const forkHostId=`fork${forkSide}_0`;
  const forkHostAnchor=findSocket(size,forkHostId,mounted);
  const forkPose=forkHostAnchor ? getForkPackHardwarePose(mounted[forkHostId],forkHostAnchor,forkSide) : undefined;
  const forkMountPart=mounted[`forkPackHardware${forkSide}`];
  const forkHookPart=mounted[`forkPackHook${forkSide}`];
  const wholeKit=isWholeForkPackKit(forkMountPart);
  const includedForkHardware=/^fork(Left|Right)_0$/.test(socketId) && isForkPackBag(bag);
  const rearConversion=/^rearPannier(Upper|Lower)(Left|Right)$/.test(socketId);
  const pannierInsertPart=/^rearPannierInserts(Left|Right)$/.test(socketId);
  const servicePart=socketId==='rackTopConnector' || socketId==='topTubeFlipBuckle' || pannierInsertPart;
  const serviceHostId=socketId==='rackTopConnector' ? 'rackTop' : socketId==='topTubeFlipBuckle' ? 'topTubeFront' : `pannier${forkSide}`;
  const serviceHost=servicePart ? mounted[serviceHostId] : undefined;
  const serviceAnchor=serviceHost ? findSocket(size,serviceHostId,mounted) : undefined;
  const servicePose=serviceHost && serviceAnchor ? getEquipmentPlacement(serviceHost,serviceAnchor) : undefined;
  const rackDeckDimensions=mounted.rearRack && rearHostAnchor ? getEquipmentPlacement(mounted.rearRack,rearHostAnchor).dimensions : undefined;
  const connectorDeck=rackDeckDimensions ? [rackDeckDimensions.length,rackDeckDimensions.height,rackDeckDimensions.depth] as Point3 : undefined;
  const flipHost=socketId==='topTubeFront' && /^tailfin-1051880-v(3|5)$/.test(bag.id);
  const removableTopHost=socketId==='rackTop' && bag.id==='tailfin-930095-v1';
  const rearBag=/^pannier(Left|Right)$/.test(socketId);
  const rearPose=mounted.rearRack && rearHostAnchor ? getRearPannierPose(mounted[`pannier${forkSide}`],mounted.rearRack,rearHostAnchor,forkSide) : undefined;
  const forkPackHardware=!rearConversion && isForkPackPart(bag) && forkPose ? {
    dimensions:forkPose.dimensions,
    showMount:bag.id !== "tailfin-676061-v1",
    showHook:bag.id !== "tailfin-661731-v1",
  } : undefined;
  const framePart=getFrameAttachmentSpec(socketId);
  const frameHost=/^tailfin-(1006881|1006882|1051880|732053|798331|129268)-v/.test(bag.id);
  const frameHostItem=framePart ? mounted[framePart.hostSocket] : bag;
  const frameHostAnchor=framePart ? findSocket(size,framePart.hostSocket,mounted) : anchor;
  const frameStations=frameHostItem && frameHostAnchor && (framePart || frameHost) ? getFrameAttachmentStations(bike,size,frameHostItem,frameHostAnchor) : [];
  const framePartStations=framePart?.role === 'seatpostStrap' && frameHostItem && frameHostAnchor ? [getRearSeatStrapStation(bike,size,frameHostItem,frameHostAnchor)] : frameStations.filter(station=>framePart?.role === 'keepers' || (framePart?.position === 'fore' ? station.id === 'front' : station.id === 'rear'));
  const kind=equipmentKind(bag);
  const isRack=kind === "rack" || kind === "aeropack";
  const tubeRadius=(socketId === "bottleMountDown" || socketId === "bottleMountSeat") ? getBottleMountPose(bike,size,socketId).radius : undefined;
  const g=getBikeGeometry(bike,size);
  const rearConnector=mounted.rearRack && rearHostAnchor ? getRearConnectorGeometry(bike,size,mounted.rearRack,rearHostAnchor) : undefined;
  const connectorPart=["rearSeatConnector","rearSeatStrap","rearTopStay"].includes(socketId);
  const barCageHost = bag.id === "tailfin-825745-v1" || isBarCageBundle(bag);
  const replacementClamp = bag.id === "tailfin-855553-v1";
  const hasCageEnvelope = barCageHost || replacementClamp || bag.id === "tailfin-855555-v1";
  const barCageParts = replacementClamp
    ? {hideClamps: [socketId === "barCageClampLeft" ? 1 : 0]}
    : {hideCradle: !!mounted.barCageReplacement, hideClamps: [mounted.barCageClampLeft ? 0 : -1, mounted.barCageClampRight ? 1 : -1]};
  let barSupport: BarSupportEndpoints | undefined;
  if (bag.id === "tailfin-710832-v1" || (barCageHost || replacementClamp)) {
    const inverse=new THREE.Quaternion().setFromEuler(new THREE.Euler(...placement.rotation)).invert();
    const toLocal=(p: Point3): Point3 => new THREE.Vector3(...p).sub(new THREE.Vector3(...placement.position)).applyQuaternion(inverse).toArray() as Point3;
    const barBag=mounted.handlebar;
    let support: Point3=[size.sockets.handlebar.position[0]+.03,size.sockets.handlebar.position[1]-.075,0];
    if (barBag) {
      const mountedPlacement=getEquipmentPlacement(barBag,size.sockets.handlebar,compressed);
      const rearOffset=rotateEquipmentPoint([-mountedPlacement.dimensions.length/2+.005,0,0],mountedPlacement.rotation);
      support=rearOffset.map((v,i)=>v+mountedPlacement.position[i]) as Point3;
    }
    if ((barCageHost || replacementClamp)) {
      const [bagL,bagH]=getBarCageEnvelope(mounted);
      const offset=rotateEquipmentPoint([-bagL*.5-.008,bagH*.35,0],placement.rotation);
      support=offset.map((v,i)=>v+placement.position[i]) as Point3;
    }
    const lateral=(barCageHost || replacementClamp) ? .08 : .055;
    barSupport={
      clamps:[toLocal([g.stemClamp[0],g.stemClamp[1]+.001,-.045]),toLocal([g.stemClamp[0],g.stemClamp[1]+.001,.045])],
      ends:[toLocal([support[0],support[1],support[2]-lateral]),toLocal([support[0],support[1],support[2]+lateral])],
      orientation:inverse.toArray() as [number,number,number,number],
    };
  }
  return <>
    {servicePart && servicePose && <group position={servicePose.position} rotation={servicePose.rotation} name={`bag_${bag.id}_${socketId}`}>
      {pannierInsertPart ? <RearPannierHardwareModel dimensions={[servicePose.dimensions.length,servicePose.dimensions.height,servicePose.dimensions.depth]} showUpper={false} showLower={false} showInserts/> : socketId==='rackTopConnector' ?
        <RemovableRackTopConnectorModel dimensions={[servicePose.dimensions.length,servicePose.dimensions.height,servicePose.dimensions.depth]} deckDimensions={connectorDeck}/> :
        <TopTubeFlipBuckleModel dimensions={[servicePose.dimensions.length,servicePose.dimensions.height,servicePose.dimensions.depth]}/>}
    </group>}
    {(axleHost || axlePart) && <group {...axlePoses.axle} name={`bag_${bag.id}_${socketId}`}>
      <AxleHardwareModel showShaft={axleHost}
        showNds={axleHost ? !mounted.rearAxleNds : socketId==='rearAxleNds'}
        showDs={axleHost ? !mounted.rearAxleDs : socketId==='rearAxleDs'}
        showSpacers={axleHost ? !mounted.rearAxleNds && !mounted.rearAxleSpacers : socketId==='rearAxleNds' || socketId==='rearAxleSpacers'}/>
    </group>}
    {(udhHost || udhPart) && <group {...axlePoses.udh} name={`bag_${bag.id}_${socketId}`}>
      <UdhHardwareModel showHanger={udhPart || !mounted.rearUdhHanger} showAdapter={udhHost}/>
    </group>}
    {archHardwarePart && rearArchPose && <group position={rearArchPose.position} rotation={rearArchPose.rotation} name={`bag_${bag.id}_${socketId}`}>
      <RearArchHardwareModel dimensions={rearArchPose.dimensions} carbon={rackParts.carbon} fastRelease={fastRelease}
        showDropouts={[socketId==='rearDropoutLeft',socketId==='rearDropoutRight']}
        showBushings={socketId==='rearDropoutBushings'} showBumpers={socketId==='rearArchBumpers'}/>
    </group>}
    {frameHost && frameStations.map(station=>{
      const suffix=station.id === 'front' ? 'Fore' : 'Aft';
      return <FrameAttachmentModel key={station.id} station={station} showMount={!mounted[`${socketId}VMount${suffix}`]} showStrap={!mounted[`${socketId}Strap${suffix}`]} showBuckle={!mounted[`${socketId}Strap${suffix}`]}/>;
    })}
    {framePart && framePartStations.map(station=><FrameAttachmentModel key={station.id} station={station} showMount={framePart.role==='vMount'} showStrap={framePart.role==='strap'||framePart.role==='seatpostStrap'} showBuckle={framePart.role==='strap'||framePart.role==='seatpostStrap'} showKeepers={framePart.role==='keepers'}/>)}
    {rearConnector && isRack && <RearConnectorModel {...rearConnector} carbon={/Carbon/.test(bag.name)} showStay={!mounted.rearTopStay} showConnector={!mounted.rearSeatConnector} showStrap={!mounted.rearSeatStrap}/>}
    {rearConnector && connectorPart && <RearConnectorModel {...rearConnector} carbon={socketId==='rearTopStay'} showStay={socketId==='rearTopStay'} showConnector={socketId==='rearSeatConnector'} showStrap={socketId==='rearSeatStrap'} longStrap={socketId==='rearSeatStrap'}/>}
    {!connectorPart && !framePart && !dedicatedHardware && !servicePart &&
    <group
      position={placement.position}
      rotation={placement.rotation}
      name={`bag_${bag.id}_${socketId}`}
    >
      <group>
        {flipHost && !mounted.topTubeFlipBuckle && <TopTubeFlipBuckleModel dimensions={[l,h,d]}/>}
        {removableTopHost && !mounted.rackTopConnector && <RemovableRackTopConnectorModel dimensions={[l,h,d]} deckDimensions={connectorDeck}/>}
        {includedForkHardware && <ForkPackHardwareModel dimensions={[l,h,d]} showMount={!forkMountPart} showHook={!wholeKit && !forkHookPart}/>}
        {rearBag && !isForkPackBag(bag) && <RearPannierHardwareModel dimensions={[l,h,d]} showUpper={!mounted[`rearPannierUpper${forkSide}`]} showLower={!mounted[`rearPannierLower${forkSide}`]} showInserts={!mounted[`rearPannierInserts${forkSide}`]}/> }
        {rearConversion && rearPose ? <RearPannierHardwareModel dimensions={rearPose.dimensions} showUpper={socketId.includes("Upper")} showLower={socketId.includes("Lower")} showInserts={socketId.includes("Upper") && isForkPackBag(mounted[`pannier${forkSide}`]) && !mounted[`rearPannierInserts${forkSide}`]}/> : <EquipmentModel bag={bag} seatPackAttachment={seatPackAttachment} hideTubeAttachments={frameHost} convertedForkPannier={rearBag || (/^fork(Left|Right)_0$/.test(socketId) && isMiniPannier(bag))} forkPackHardware={forkPackHardware} bottleCageBackSign={socketId === "bottleSeat" ? -1 : 1} rearArchDimensions={rearArchDimensions} rackParts={rackParts} barSupport={barSupport} tubeRadius={tubeRadius} rearDeck={rearDeck} barCageParts={barCageParts} barCageEnvelope={hasCageEnvelope ? getBarCageEnvelope(mounted) : undefined} strapEnvelope={bag.id.startsWith("tailfin-126220-") ? getCargoStrapEnvelope(mounted,socketId) : undefined} strapRearExtension={bag.id.startsWith("tailfin-126220-") ? getCargoStrapRearExtension(mounted,socketId) : undefined} />}
        {/* Warnings stay legible without changing opaque textile into glowing plastic. */}
        {affected.length > 0 && (
          <mesh position={[-l * 0.27, h * 0.21, d * 0.52]}>
            <boxGeometry args={[0.016, 0.018, 0.002]} />
            <meshStandardMaterial
              color={severe ? "#b94333" : "#c18b35"}
              roughness={0.75}
            />
          </mesh>
        )}
      </group>
    </group>}
  </>;
}
