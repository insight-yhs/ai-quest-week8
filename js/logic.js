// 채점·판정 규칙. 화면 코드와 분리된 순수 함수라 node --test로 검증한다.

export const POINTS = 100;
export const BONUS_MAX = 50;
export const BONUS_SECONDS = 20;
export const ORDER_POINTS = 60;
export const NICK_MAX = 10;

export function normalizeCode(s) {
  return String(s ?? '').replace(/\s+/g, '').toUpperCase();
}

export function checkCode(input, expected) {
  return normalizeCode(input) === normalizeCode(expected);
}

export function speedBonus(seconds) {
  const ratio = Math.max(0, 1 - Math.max(0, seconds) / BONUS_SECONDS);
  return Math.round(BONUS_MAX * ratio);
}

export function scoreAnswer(correct, seconds) {
  return correct ? POINTS + speedBonus(seconds) : 0;
}

export function scoreOrder(answerIds, correctIds) {
  const hits = correctIds.map((id, i) => answerIds[i] === id);
  return { hits, score: hits.filter(Boolean).length * ORDER_POINTS };
}

export function sanitizeNick(s) {
  const nick = Array.from(String(s ?? '').trim().replace(/\s+/g, ' ')).slice(0, NICK_MAX).join('').trim();
  return nick || null;
}

// 같은 스테이지는 첫 점수만 남긴다(재도전 없음).
export function mergeScore(row, { cls, nick, pid, stage, score, at }) {
  const stages = { ...(row?.stages ?? {}) };
  if (!(stage in stages)) stages[stage] = score;
  const total = Object.values(stages).reduce((a, b) => a + b, 0);
  return { pid, cls, nick, stages, total, at };
}

export function rankPlayers(rows, limit = 10) {
  return [...rows].sort((a, b) => b.total - a.total || a.at - b.at).slice(0, limit);
}
