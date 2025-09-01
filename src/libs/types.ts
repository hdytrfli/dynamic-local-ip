export interface Data {
  current_ip: string | null;
  attempt_count: number;
  last_updated: string | null;
  last_error: string | null;
  is_error: boolean;
}
