import type { State } from '@/libs/state';
import {
  inCooldown,
  isOutOfRange,
  isUnchanged,
  isWaitingForStability,
  shouldMonitor,
} from '@/libs/utils';

vi.mock('@/config', async () => {
  process.env.IP_RANGE = '192.168.0.0/16';
  process.env.MAX_ATTEMPTS = '3';
  process.env.COOLDOWN_PERIOD = '900000';
  process.env.STABILITY_PERIOD = '60000';
  const actual = await vi.importActual('@/config');
  return actual;
});

const baseState: State = {
  currentIp: '192.168.0.10',
  attemptCount: 0,
  lastUpdated: new Date().toISOString(),
  lastError: new Date().toISOString(),
  isError: false,
  pendingIp: null,
  pendingSince: 0,
};

describe('isUnchanged', () => {
  it('returns true when IP matches and no error', () => {
    expect(isUnchanged('192.168.0.10', baseState)).toBe(true);
  });

  it('returns false when IP differs', () => {
    expect(isUnchanged('192.168.0.20', baseState)).toBe(false);
  });

  it('returns false when there is an error', () => {
    expect(isUnchanged('192.168.0.10', { ...baseState, isError: true })).toBe(
      false
    );
  });
});

describe('isOutOfRange', () => {
  it('returns false for IP inside the range', () => {
    expect(isOutOfRange('192.168.1.27')).toBe(false);
  });

  it('returns true for IP outside the range', () => {
    expect(isOutOfRange('10.0.0.1')).toBe(true);
  });

  it('returns false for range boundary (.0.0)', () => {
    expect(isOutOfRange('192.168.0.0')).toBe(false);
  });

  it('returns false for range boundary (.255.255)', () => {
    expect(isOutOfRange('192.168.255.255')).toBe(false);
  });
});

describe('inCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns false when there is no error', () => {
    expect(inCooldown(baseState)).toBe(false);
  });

  it('returns false when attempt count is below max', () => {
    const state: State = { ...baseState, isError: true, attemptCount: 1 };
    expect(inCooldown(state)).toBe(false);
  });

  it('returns false when cooldown period has passed', () => {
    const past = new Date(Date.now() - 1_000_000).toISOString();
    const state: State = {
      ...baseState,
      isError: true,
      attemptCount: 3,
      lastError: past,
    };
    expect(inCooldown(state)).toBe(false);
  });

  it('returns true when in cooldown', () => {
    const state: State = {
      ...baseState,
      isError: true,
      attemptCount: 3,
      lastError: new Date().toISOString(),
    };
    expect(inCooldown(state)).toBe(true);
  });
});

describe('isWaitingForStability', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns false when IP matches stored IP', () => {
    expect(isWaitingForStability('192.168.0.10', baseState)).toBe(false);
  });

  it('returns false when there is no pending IP', () => {
    expect(isWaitingForStability('192.168.0.20', baseState)).toBe(false);
  });

  it('returns false when stability period has passed', () => {
    const state: State = {
      ...baseState,
      pendingIp: '192.168.0.20',
      pendingSince: Date.now() - 120_000,
    };
    expect(isWaitingForStability('192.168.0.20', state)).toBe(false);
  });

  it('returns true when still within stability period', () => {
    const state: State = {
      ...baseState,
      pendingIp: '192.168.0.20',
      pendingSince: Date.now() - 10_000,
    };
    expect(isWaitingForStability('192.168.0.20', state)).toBe(true);
  });
});

describe('shouldMonitor', () => {
  it('returns false when IP matches stored IP', () => {
    expect(shouldMonitor('192.168.0.10', baseState)).toBe(false);
  });

  it('returns false when IP matches pending IP', () => {
    const state: State = { ...baseState, pendingIp: '192.168.0.20' };
    expect(shouldMonitor('192.168.0.20', state)).toBe(false);
  });

  it('returns true when IP is new and different from pending', () => {
    expect(shouldMonitor('192.168.0.20', baseState)).toBe(true);
  });
});
