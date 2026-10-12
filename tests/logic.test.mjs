import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../js/logic.js';

test('code', () => {
  assert.equal(L.normalizeCode(' mi nd '), 'MIND');
  assert.ok(L.checkCode('time', 'TIME'));
  assert.ok(!L.checkCode('tim', 'TIME'));
});
test('bonus', () => {
  assert.equal(L.speedBonus(0), 50);
  assert.equal(L.speedBonus(10), 25);
  assert.equal(L.speedBonus(25), 0);
  assert.equal(L.speedBonus(-3), 50);
});
test('answer', () => {
  assert.equal(L.scoreAnswer(true, 0), 150);
  assert.equal(L.scoreAnswer(false, 0), 0);
});
test('order', () => {
  const r = L.scoreOrder(['a', 'c', 'b', 'd', 'e'], ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(r.hits, [true, false, false, true, true]);
  assert.equal(r.score, 180);
});
test('nick', () => {
  assert.equal(L.sanitizeNick('  홍  길동 '), '홍 길동');
  assert.equal(L.sanitizeNick('가나다라마바사아자차카'), '가나다라마바사아자차');
  assert.equal(L.sanitizeNick('   '), null);
});
test('merge keeps first score', () => {
  let r = L.mergeScore(null, { cls: 'A', nick: 'n', pid: 'p', stage: 1, score: 500, at: 10 });
  r = L.mergeScore(r, { cls: 'A', nick: 'n', pid: 'p', stage: 1, score: 900, at: 20 });
  r = L.mergeScore(r, { cls: 'A', nick: 'n', pid: 'p', stage: 2, score: 300, at: 30 });
  assert.deepEqual(r.stages, { 1: 500, 2: 300 });
  assert.equal(r.total, 800);
  assert.equal(r.at, 30);
});
test('rank', () => {
  const rows = [{ pid: 'a', total: 100, at: 5 }, { pid: 'b', total: 300, at: 9 }, { pid: 'c', total: 300, at: 2 }];
  assert.deepEqual(L.rankPlayers(rows).map(r => r.pid), ['c', 'b', 'a']);
  assert.equal(L.rankPlayers(rows, 1).length, 1);
});
