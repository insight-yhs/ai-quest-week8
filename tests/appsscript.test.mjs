// Code.gs를 가짜 SpreadsheetApp 위에서 실행해 저장·조회 규칙을 확인한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function makeEnv() {
  const sheets = {};
  const mkSheet = () => {
    const data = [];
    return {
      data,
      appendRow: r => data.push([...r]),
      setFrozenRows: () => {},
      getDataRange: () => ({ getValues: () => data.map(r => [...r]) }),
      getRange: (row, col, nr, nc) => ({ setValues: v => { data[row - 1] = [...v[0]]; } }),
    };
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => sheets[n], insertSheet: n => (sheets[n] = mkSheet()) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ body: s, setMimeType() { return this; } }) },
    Date, JSON, Number, String, Array, Math,
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8'), ctx);
  const post = body => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).body);
  const get = cls => JSON.parse(ctx.doGet({ parameter: { cls } }).body);
  return { post, get, sheets };
}

test('upsert keeps first score and excludes practice from total', () => {
  const { post, get } = makeEnv();
  assert.equal(post({ cls: 'A', nick: '별', pid: 'p1', stage: 0, score: 0 }).ok, true);
  post({ cls: 'A', nick: '별', pid: 'p1', stage: 1, score: 1300 });
  post({ cls: 'A', nick: '별', pid: 'p1', stage: 1, score: 1500 });
  post({ cls: 'A', nick: '별', pid: 'p1', stage: 2, score: 600 });
  post({ cls: 'B', nick: '달', pid: 'p2', stage: 1, score: 900 });
  const a = get('A');
  assert.equal(a.count, 1);
  assert.equal(a.rows[0].total, 1900);
  assert.deepEqual(a.rows[0].stages, { 0: 0, 1: 1300, 2: 600 });
  assert.deepEqual(a.done, [1, 1, 0, 0]);
  assert.equal(get('B').rows[0].nick, '달');
});

test('rejects bad input', () => {
  const { post, get } = makeEnv();
  assert.equal(post({ cls: 'Z', nick: 'x', pid: 'p', stage: 1, score: 10 }).ok, false);
  assert.equal(post({ cls: 'A', nick: 'x', pid: 'p', stage: 9, score: 10 }).ok, false);
  assert.equal(post({ cls: 'A', nick: 'x', pid: 'p', stage: 1, score: 99999 }).ok, false);
  assert.equal(post({ cls: 'A', nick: '   ', pid: 'p', stage: 1, score: 10 }).ok, false);
  assert.equal(get('A').count, 0);
});
