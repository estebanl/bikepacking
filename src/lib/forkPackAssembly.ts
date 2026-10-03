import type { BagItem } from '../types/index.ts';

export function requiredProductCapabilities(bag: BagItem, socketId: string): string[] {
  if (/^tailfin-972100-v[12]$/.test(bag.id) && /^fork(Left|Right)_0$/.test(socketId)) {
    return ['fork-mount', 'mini-pannier-conversion'];
  }
  return bag.requires ?? [];
}

export function forkPackConflictReasons(bag: BagItem, socketId: string, mounted: Record<string, BagItem>): string[] {
  const wholeKit = (id: string) => /^tailfin-(661740|675876)-v1$/.test(id);
  const hardwareSide = /^forkPackHardware(Left|Right)$/.exec(socketId)?.[1];
  const hookSide = /^forkPackHook(Left|Right)$/.exec(socketId)?.[1];
  const conflict =
    (hardwareSide && wholeKit(bag.id) && mounted[`forkPackHook${hardwareSide}`]?.id === 'tailfin-676061-v1') ||
    (hookSide && bag.id === 'tailfin-676061-v1' && wholeKit(mounted[`forkPackHardware${hookSide}`]?.id ?? ''));
  return conflict ? ['The whole mounting/conversion kit already includes the hook on this side. Remove the separate hook or choose individual replacement parts.'] : [];
}
