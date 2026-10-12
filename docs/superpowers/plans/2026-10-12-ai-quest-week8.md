# AI 퀘스트 8주차 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 8주차 수업용 스테이지형 웹 게임(학생용 + 순위판)과 Apps Script 점수 서버, 진행 슬라이드를 만든다.

**Architecture:** 정적 ES 모듈 사이트(GitHub Pages). 채점·판정은 `js/logic.js` 순수 함수로 분리해 node로 테스트하고, 화면은 `js/game.js`/`js/board.js`가 담당한다. 점수는 Apps Script 웹 앱이 구글 시트에 upsert하고 JSON으로 순위를 돌려준다.

**Tech Stack:** HTML/CSS/vanilla JS(ES2020 모듈), Node 25 `node --test`, Google Apps Script, python-pptx(슬라이드)

**Spec:** `docs/superpowers/specs/2026-10-12-ai-quest-week8-design.md`

## Global Constraints

- 빌드 도구·외부 런타임 의존성 없음. 외부 스크립트 로드 없음(QR은 슬라이드에서만).
- 정답 100점 + 속도 보너스 `round(50 × max(0, 1 − 걸린초/20))`. 순서 맞추기 제자리 1장당 60점.
- 열쇠 코드: 1 `MIND` · 2 `TIME` · 3 `WORD` · 4 `FACT`, 대소문자·공백 무시.
- 닉네임 최대 10자, 학번 수집 없음. 반: `A`, `B`, `T`(연습).
- 첫 점수만 반영(재도전 없음). 동점은 먼저 도달(`at` 작은 쪽) 우선.
- localStorage 접근은 모두 try/catch.
- 문구는 쉬운 한국어, 해설은 한두 문장.

---

### Task 1: 채점·판정 로직 (`js/logic.js`)

**Files:** Create `js/logic.js`, `tests/logic.test.mjs`, `package.json`(`{"type":"module","scripts":{"test":"node --test tests/"}}`)

**Interfaces — Produces:**
- `normalizeCode(s: string): string` — 공백 제거 + 대문자
- `checkCode(input: string, expected: string): boolean`
- `speedBonus(seconds: number): number` — 0~50 정수
- `scoreAnswer(correct: boolean, seconds: number): number`
- `scoreOrder(answerIds: string[], correctIds: string[]): {hits: boolean[], score: number}`
- `sanitizeNick(s: string): string|null`
- `mergeScore(row: Row|null, {cls, nick, pid, stage, score, at}): Row` — `Row = {pid, cls, nick, stages: {[stage]: number}, total: number, at: number}`; 이미 있는 stage 점수는 유지, `at`은 마지막 반영 시각
- `rankPlayers(rows: Row[], limit=10): Row[]` — total 내림차순, 동점 at 오름차순

- [ ] **Step 1: 실패하는 테스트 작성**

```js
import test from 'node:test'; import assert from 'node:assert/strict';
import * as L from '../js/logic.js';
test('code', () => { assert.equal(L.normalizeCode(' mi nd '), 'MIND'); assert.ok(L.checkCode('time', 'TIME')); assert.ok(!L.checkCode('tim', 'TIME')); });
test('bonus', () => { assert.equal(L.speedBonus(0), 50); assert.equal(L.speedBonus(10), 25); assert.equal(L.speedBonus(25), 0); assert.equal(L.speedBonus(-3), 50); });
test('answer', () => { assert.equal(L.scoreAnswer(true, 0), 150); assert.equal(L.scoreAnswer(false, 0), 0); });
test('order', () => { const r = L.scoreOrder(['a','c','b','d','e'], ['a','b','c','d','e']); assert.deepEqual(r.hits, [true,false,false,true,true]); assert.equal(r.score, 180); });
test('nick', () => { assert.equal(L.sanitizeNick('  홍  길동 '), '홍 길동'); assert.equal(L.sanitizeNick('가나다라마바사아자차카'), '가나다라마바사아자차'); assert.equal(L.sanitizeNick('   '), null); });
test('merge keeps first score', () => {
  let r = L.mergeScore(null, {cls:'A', nick:'n', pid:'p', stage:1, score:500, at:10});
  r = L.mergeScore(r, {cls:'A', nick:'n', pid:'p', stage:1, score:900, at:20});
  r = L.mergeScore(r, {cls:'A', nick:'n', pid:'p', stage:2, score:300, at:30});
  assert.deepEqual(r.stages, {1:500, 2:300}); assert.equal(r.total, 800); assert.equal(r.at, 30);
});
test('rank', () => {
  const rows = [{pid:'a',total:100,at:5},{pid:'b',total:300,at:9},{pid:'c',total:300,at:2}];
  assert.deepEqual(L.rankPlayers(rows).map(r => r.pid), ['c','b','a']);
  assert.equal(L.rankPlayers(rows, 1).length, 1);
});
```

- [ ] **Step 2:** `npm test` → FAIL (모듈 없음)
- [ ] **Step 3:** `js/logic.js` 구현 (위 인터페이스 그대로)
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** commit `feat: 채점·판정 로직과 테스트`

### Task 2: 문제 데이터 (`js/content.js`)

**Files:** Create `js/content.js`; Modify `tests/logic.test.mjs`(데이터 무결성 테스트 추가)

**Interfaces — Produces:**
```js
export const STAGES = [ { id: 0|1|2|3|4, title, subtitle, code: string|null, questions: Question[] } ]
// Question = {type:'choice', prompt, options:string[], answer:number, explain, passage?:string, probs?:number[], style?:'binary'|'sentences'|'list'}
//          | {type:'order', prompt, items:{id,label,year}[], explain}   // items는 정답 순서로 저장, 화면에서 섞음
```
스펙 4절 문항을 그대로 옮긴다(연습 1, 1스테이지 10, 2스테이지 순서 1 + 선택 3, 3스테이지 7, 4스테이지 5).

- [ ] **Step 1:** 무결성 테스트 추가: 모든 choice의 `answer`가 options 범위 안, `probs` 있으면 길이 같고 최댓값 인덱스 = answer, 스테이지 1~4는 code가 있고 0은 null, 코드 중복 없음.
- [ ] **Step 2:** `npm test` → FAIL
- [ ] **Step 3:** `js/content.js` 작성
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** commit `feat: 8주차 문제 데이터`

### Task 3: 학생용 게임 화면 (`index.html`, `css/style.css`, `js/game.js`, `js/config.js`)

**Interfaces — Consumes:** Task 1 함수 전부, Task 2 `STAGES`. **Produces:** `config.js`의 `export const API_URL = ''`(빈 값이면 전송 생략).

화면: 참가(반 버튼 3개 + 닉네임) → 지도(스테이지 카드: 잠김/코드 입력/완료 점수) → 문제(진행 막대, 문제, 선택지; 답 고르면 정답·해설·획득 점수, probs 막대 공개, [다음]) → 스테이지 결과 → 지도 → 4스테이지 후 최종 결과(총점, 스테이지별 점수).
순서 문제: 카드를 차례로 눌러 1~5번 칸에 놓고 [확인], 칸 다시 누르면 빼기.
상태 `aiq8`(localStorage): `{pid, cls, nick, unlocked:number[], scores:{}, pending:[]}`. 점수 전송은 `fetch(API_URL, {method:'POST', body: JSON.stringify(...)})`(Content-Type 미지정 = text/plain), 실패하면 pending에 남겨 다음 완료 때 재전송.

- [ ] **Step 1:** 파일 작성
- [ ] **Step 2:** `python3 -m http.server`로 띄워 Chrome에서 연습→1~4 끝까지 플레이, 390px 폭 확인, 새로고침 후 상태 유지 확인
- [ ] **Step 3:** commit `feat: 학생용 게임 화면`

### Task 4: 점수 서버와 순위판 (`apps-script/Code.gs`, `board.html`, `js/board.js`)

**Interfaces — Consumes:** `rankPlayers`(board.js), mergeScore 규칙(Code.gs에 같은 규칙 재구현).
- `doPost(e)`: JSON 파싱 → 입력 검증(cls ∈ A/B/T, stage 0~4, score 0~2000 정수, nick 정리) → LockService → 시트 `scores`(열: pid, cls, nick, s0..s4, total, at) upsert → `{ok:true}`
- `doGet(e)`: `?cls=A` → 해당 반 행 → `{rows:[{nick,total,stages,at}], count, done:[s1완료수..s4]}`
- board.js: `?class=A`, 5초마다 `fetch(API_URL+'?cls=A')`, 상위 10명 + 참여 인원 + 스테이지 완료 인원, 실패 시 "연결 대기 중"

- [ ] **Step 1:** 파일 작성. Code.gs 상단에 배포 방법 주석.
- [ ] **Step 2:** API_URL 없이 board.html이 "연결 대기 중"을 보이는지 확인. 가짜 응답(로컬 `mock.json`, `?mock=1`)으로 표 렌더링 확인.
- [ ] **Step 3:** commit `feat: 점수 서버와 순위판`

### Task 5: 배포

- [ ] `gh repo create insight-yhs/ai-quest-week8 --public` (insight-yhs 계정으로 전환 후), push, Pages 활성화(main / root), 주소 응답 확인, 계정 원래대로 전환.

### Task 6: 8주차 슬라이드

**Files:** OneDrive `컴퓨터의이해와활용_강의노트/.codex-build/week8-ai-quest/build_week8.py` → `output/컴퓨터의이해와활용_8주차_AI퀘스트_2026.pptx`

- 7주차 헬퍼 재사용. 표지 → 오늘의 게임 규칙 → 접속 QR → [강의 1 → 열쇠 코드 MIND] → [강의 2 → TIME] → [강의 3 → WORD] → [강의 4 → FACT] → 순위 발표 → 핵심 정리 → 9주차 예고.
- QR: `pip install --user qrcode` 후 PNG 생성(빌드 폴더).
- 넘침 점검 + 자체 렌더러 확인.
