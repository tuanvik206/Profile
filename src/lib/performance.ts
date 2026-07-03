/**
 * Device Performance Tier Detection
 * Tier 3 (strong)  → >= 6 cores, >= 8GB RAM: full effects
 * Tier 2 (medium)  → 3-5 cores, 4GB RAM:     reduced effects
 * Tier 1 (weak)    → <= 2 cores, < 4GB RAM or prefers-reduced-motion: minimal
 */

export type PerformanceTier = 1 | 2 | 3;

function getPerformanceTier(): PerformanceTier {
  // SSR safety
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 2;

  // Check user preference first — always respect this
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return 1;

  // CPU cores
  const cores = navigator.hardwareConcurrency ?? 2;

  // Device memory (Chrome/Edge, not available in Safari/Firefox → undefined)
  const mem = (navigator as any).deviceMemory as number | undefined;

  // Battery API hint: if device is battery-powered and saving, downgrade
  let savingPower = false;
  try {
    // navigator.getBattery is async but we check a cached hint from previous calls
    if ((navigator as any)._perfSavingPower) savingPower = true;
  } catch (_) { /**/ }

  // Connection quality (slow connection → downgrade)
  const conn = (navigator as any).connection;
  const slowConn = conn && (conn.saveData === true || (conn.effectiveType && ['slow-2g', '2g'].includes(conn.effectiveType)));

  if (slowConn || savingPower) return 1;

  // Score-based decision
  let score = 0;
  score += cores >= 8 ? 3 : cores >= 4 ? 2 : cores >= 2 ? 1 : 0;
  if (mem !== undefined) {
    score += mem >= 8 ? 3 : mem >= 4 ? 2 : mem >= 2 ? 1 : 0;
  } else {
    // Unknown memory: be conservative
    score += 1;
  }

  if (score >= 5) return 3;
  if (score >= 3) return 2;
  return 1;
}

// Singleton — computed once at module load
let _tier: PerformanceTier | null = null;
export function getDeviceTier(): PerformanceTier {
  if (_tier === null) _tier = getPerformanceTier();
  return _tier;
}

// Convenience helpers
export const isWeakDevice  = () => getDeviceTier() === 1;
export const isMediumDevice = () => getDeviceTier() === 2;
export const isStrongDevice = () => getDeviceTier() === 3;

// Particle counts per tier
export const PARTICLE_CONFIG = {
  1: { count: 0,   fpsLimit: 30, links: false, hover: false },
  2: { count: 40,  fpsLimit: 45, links: true,  hover: false },
  3: { count: 100, fpsLimit: 60, links: true,  hover: true  },
} as const;
