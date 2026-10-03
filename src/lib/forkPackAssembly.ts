import type { BagItem } from '../types/index.ts';

export function requiredProductCapabilities(bag: BagItem, socketId: string): string[] {
  if (/^tailfin-655674-v[12]$/.test(bag.id) && /^pannier(Left|Right)$/.test(socketId)) {
    return ['pannier-mounts', 'rear-pannier-upper', 'rear-mini-lower'];
  }
  if (/^tailfin-972100-v[12]$/.test(bag.id) && /^fork(Left|Right)_0$/.test(socketId)) {
    return ['fork-mount', 'mini-pannier-conversion'];
  }
  return bag.requires ?? [];
}

export function forkPackConflictReasons(bag: BagItem, socketId: string, mounted: Record<string, BagItem>): string[] {
  const lowerSide = /^rearPannierLower(Left|Right)$/.exec(socketId)?.[1];
  const rearSide = /^pannier(Left|Right)$/.exec(socketId)?.[1];
  const miniHost = (id: string) => /^tailfin-(655674|972100)-v[12]$/.test(id);
  if ((lowerSide && bag.id === 'tailfin-652020-v1' && mounted[`pannier${lowerSide}`] && !miniHost(mounted[`pannier${lowerSide}`].id)) ||
      (rearSide && mounted[`rearPannierLower${rearSide}`]?.id === 'tailfin-652020-v1' && !miniHost(bag.id))) {
    return ['Mini Pannier lower parts require a same-side 5L or 10L Mini Pannier or converted Fork Pack.'];
  }
  const wholeKit = (id: string) => /^tailfin-(661740|675876)-v1$/.test(id);
  const hardwareSide = /^forkPackHardware(Left|Right)$/.exec(socketId)?.[1];
  const hookSide = /^forkPackHook(Left|Right)$/.exec(socketId)?.[1];
  const conflict =
    (hardwareSide && wholeKit(bag.id) && mounted[`forkPackHook${hardwareSide}`]?.id === 'tailfin-676061-v1') ||
    (hookSide && bag.id === 'tailfin-676061-v1' && wholeKit(mounted[`forkPackHardware${hookSide}`]?.id ?? ''));
  return conflict ? ['The whole mounting/conversion kit already includes the hook on this side. Remove the separate hook or choose individual replacement parts.'] : [];
}
