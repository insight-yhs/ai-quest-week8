/**
 * AI 퀘스트(8주차) 점수 서버
 *
 * 설치 방법
 * 1. 새 구글 시트를 만든다(이름 예: AI퀘스트_8주차_점수).
 * 2. [확장 프로그램] → [Apps Script]를 열고 이 파일 내용을 모두 붙여 넣은 뒤 저장한다.
 *    (script.google.com에서 따로 만든 프로젝트여도 된다. 그때는 위쪽 함수 선택에서 setup을 골라
 *     한 번 [실행]하면 'AI퀘스트_8주차_점수' 시트를 드라이브에 만들고 실행 로그에 주소를 남긴다.)
 * 3. [배포] → [새 배포] → 유형: 웹 앱, 실행 사용자: 나, 액세스 권한: 모든 사용자 → [배포]
 *    (처음에는 권한 승인 창이 뜬다.)
 * 4. 나온 웹 앱 URL(https://script.google.com/macros/s/.../exec)을 게임 담당자에게 전달한다.
 *
 * 코드를 고친 뒤에는 [배포] → [배포 관리] → 연필 → 버전: 새 버전 → [배포]를 해야 반영된다.
 * 시트 `scores`의 행을 지우면 그 학생의 점수가 순위판에서 사라진다.
 */

const SHEET = 'scores';
const HEADER = ['pid', 'cls', 'nick', 's0', 's1', 's2', 's3', 's4', 'total', 'at'];
const CLASSES = ['A', 'B', 'T'];
const NICK_MAX = 10;

// 시트에 붙은 스크립트면 그 시트를, 따로 만든 스크립트면 처음 한 번 만든 시트를 쓴다.
function book_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create('AI퀘스트_8주차_점수');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function sheet_() {
  const ss = book_();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
  }
  return sh;
}

// 편집기에서 한 번 실행: 권한 승인 + 점수 시트 준비. 시트 주소는 실행 로그에 나온다.
function setup() {
  Logger.log(book_().getUrl());
  sheet_();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(body) {
  const cls = String(body.cls || '');
  const stage = Number(body.stage);
  const score = Number(body.score);
  const pid = String(body.pid || '').slice(0, 64);
  const nick = Array.from(String(body.nick || '').trim().replace(/\s+/g, ' ')).slice(0, NICK_MAX).join('').trim();
  if (CLASSES.indexOf(cls) < 0) throw new Error('cls');
  if (!(Number.isInteger(stage) && stage >= 0 && stage <= 4)) throw new Error('stage');
  if (!(Number.isInteger(score) && score >= 0 && score <= 2000)) throw new Error('score');
  if (!pid || !nick) throw new Error('pid/nick');
  return { cls: cls, stage: stage, score: score, pid: pid, nick: nick };
}

// 같은 스테이지는 첫 점수만 남긴다(게임의 mergeScore와 같은 규칙).
function doPost(e) {
  let d;
  try {
    d = clean_(JSON.parse(e.postData.contents));
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === d.pid) { rowIndex = i; break; }
    }
    const row = rowIndex > 0 ? values[rowIndex] : [d.pid, d.cls, d.nick, '', '', '', '', '', 0, 0];
    const col = 3 + d.stage;
    if (row[col] === '' || row[col] === null) row[col] = d.score;
    row[1] = d.cls;
    row[2] = d.nick;
    // 연습(s0)은 총점에 넣지 않는다.
    row[8] = [4, 5, 6, 7].reduce(function (sum, c) { return sum + (Number(row[c]) || 0); }, 0);
    row[9] = Date.now();
    if (rowIndex > 0) sh.getRange(rowIndex + 1, 1, 1, HEADER.length).setValues([row]);
    else sh.appendRow(row);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const cls = String((e && e.parameter && e.parameter.cls) || 'A');
  const values = sheet_().getDataRange().getValues().slice(1).filter(function (r) { return r[1] === cls; });
  const rows = values.map(function (r) {
    const stages = {};
    for (let s = 0; s <= 4; s++) if (r[3 + s] !== '') stages[s] = Number(r[3 + s]);
    return { nick: r[2], total: Number(r[8]) || 0, stages: stages, at: Number(r[9]) || 0 };
  });
  const done = [1, 2, 3, 4].map(function (s) {
    return rows.filter(function (r) { return s in r.stages; }).length;
  });
  return json_({ rows: rows, count: rows.length, done: done });
}
