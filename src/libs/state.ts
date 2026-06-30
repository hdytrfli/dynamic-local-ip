import { Store } from '@/services/storage';

export interface State {
  currentIp: string;
  attemptCount: number;
  lastUpdated: string;
  lastError: string;
  isError: boolean;
  pendingIp: string | null;
  pendingSince: number;
}

const now = () => new Date().toISOString();

export const store = new Store<State>({
  currentIp: '',
  attemptCount: 0,
  lastUpdated: now(),
  lastError: now(),
  isError: false,
  pendingIp: null,
  pendingSince: 0,
});
