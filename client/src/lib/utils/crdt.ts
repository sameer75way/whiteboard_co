

import type { LamportTimestamp, CanvasElement } from "../../types/element.types";

const CLIENT_ID_KEY = "whiteboard_crdt_clientId";
const SEQ_KEY = "whiteboard_crdt_seq";

export const getClientId = (): string => {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
};

const readSeq = (): number => {
  return parseInt(localStorage.getItem(SEQ_KEY) ?? "0", 10);
};

const writeSeq = (seq: number): void => {
  localStorage.setItem(SEQ_KEY, String(seq));
};

export const nextLamport = (): LamportTimestamp => {
  const seq = readSeq() + 1;
  writeSeq(seq);
  return { clientId: getClientId(), seq };
};

export const advanceLocalClock = (remoteSq: number): void => {
  const local = readSeq();
  writeSeq(Math.max(local, remoteSq) + 1);
};

const compare = (
  a: LamportTimestamp,
  b: LamportTimestamp
): 1 | -1 | 0 => {
  if (a.seq > b.seq) return 1;
  if (a.seq < b.seq) return -1;
  if (a.clientId > b.clientId) return 1;
  if (a.clientId < b.clientId) return -1;
  return 0;
};

export const applyLww = (
  local: CanvasElement | undefined,
  incoming: CanvasElement
): CanvasElement => {
  if (!local) return incoming;
  if (!local.lamportTs || !incoming.lamportTs) return incoming;

  return compare(incoming.lamportTs, local.lamportTs) >= 0
    ? incoming
    : local;
};
