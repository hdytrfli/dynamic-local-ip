import { env } from '@/config';
import { isAddressInRange } from '@/libs/ip';
import type { State } from '@/libs/state';

/**
 * Returns true when the detected IP matches the stored value and there are no active errors.
 */
export function isUnchanged(ip: string, state: State): boolean {
  return ip === state.currentIp && !state.isError;
}

/**
 * Returns true when the IP falls outside the configured CIDR range. Skips the check when no range is configured.
 */
export function isOutOfRange(ip: string): boolean {
  if (!env.IP_RANGE) return false;
  return !isAddressInRange(ip, env.IP_RANGE);
}

/**
 * Returns true when the app is in a cooldown period after repeated update failures.
 */
export function inCooldown(state: State): boolean {
  if (!state.isError) return false;
  if (state.attemptCount < env.MAX_ATTEMPTS) return false;

  const elapsed = Date.now() - new Date(state.lastError).getTime();
  return elapsed < env.COOLDOWN_PERIOD;
}

/**
 * Returns true when a new IP has been detected and is still within the stability monitoring window.
 */
export function isWaitingForStability(ip: string, state: State): boolean {
  if (ip === state.currentIp) return false;
  if (state.pendingIp !== ip) return false;

  const elapsed = Date.now() - state.pendingSince;
  return elapsed < env.STABILITY_PERIOD;
}

/**
 * Returns true when the detected IP is different from both the stored IP and the pending IP, meaning stability monitoring
 * should begin.
 */
export function shouldMonitor(ip: string, state: State): boolean {
  if (ip === state.currentIp) return false;
  return state.pendingIp !== ip;
}
