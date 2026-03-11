
export interface LamportTimestamp {
  clientId: string;
  seq: number;
}
export const compareLamport = (
  a: LamportTimestamp,
  b: LamportTimestamp
): 1 | -1 | 0 => {
  if (a.seq > b.seq) return 1;
  if (a.seq < b.seq) return -1;
  if (a.clientId > b.clientId) return 1;
  if (a.clientId < b.clientId) return -1;
  return 0;
};

export const isNewer = (
  incoming: LamportTimestamp,
  stored: LamportTimestamp
): boolean => compareLamport(incoming, stored) === 1;

export const advanceClock = (
  local: number,
  remote: number
): number => Math.max(local, remote) + 1;
