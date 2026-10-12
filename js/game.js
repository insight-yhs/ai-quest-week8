import { STAGES } from './content.js';
import { API_URL } from './config.js';
import { checkCode, sanitizeNick, scoreAnswer, scoreOrder, speedBonus } from './logic.js';

const KEY = 'aiq8';
const CLASSES = [['A', 'A반'], ['B', 'B반'], ['T', '연습']];
const app = document.getElementById('app');
const who = document.getElementById('who');

let S = load();
let view = null; // 화면 전환용 임시 상태(저장하지 않음)

// ---------- 저장 ----------
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}
function save() {
  try { if (S) localStorage.setItem(KEY, JSON.stringify(S)); else localStorage.removeItem(KEY); } catch { /* 저장 불가: 메모리로 진행 */ }
}

// ---------- 도우미 ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stageOf = id => STAGES.find(s => s.id === id);
const mainStages = () => STAGES.filter(s => s.id > 0);
const total = () => mainStages().reduce((a, s) => a + (S.scores[s.id] ?? 0), 0);
const allDone = () => mainStages().every(s => s.id in S.scores);
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffledNotSame(arr) {
  if (arr.length < 2) return [...arr];
  let a;
  do { a = shuffle(arr); } while (a.every((x, i) => x === arr[i]));
  return a;
}

function renderWho() {
  if (!S) { who.innerHTML = ''; return; }
  const cls = CLASSES.find(c => c[0] === S.cls)?.[1] ?? '';
  who.innerHTML = `<span>${esc(cls)} · ${esc(S.nick)}</span><button type="button" id="reset">사용자 변경</button>`;
  document.getElementById('reset').onclick = () => render('reset');
}

// ---------- 점수 전송 ----------
async function flush() {
  if (!API_URL || !S?.pending?.length) return;
  const rest = [];
  for (const item of S.pending) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ cls: S.cls, nick: S.nick, pid: S.pid, stage: item.stage, score: item.score }),
      });
      if (!res.ok) throw new Error(res.status);
      // 스크립트 오류도 200(HTML)으로 오므로 JSON이 아니면 실패로 보고 다시 보낸다.
      const data = await res.json();
      if (!data.ok) console.warn('점수 거절', data.error);
    } catch {
      rest.push(item);
    }
  }
  S.pending = rest;
  save();
}

// ---------- 화면 ----------
function render(name, data) {
  view = { name, ...data };
  renderWho();
  ({ join, map, question, stageEnd, final, reset })[name]();
  window.scrollTo(0, 0);
}

function join() {
  let cls = null;
  app.innerHTML = `
    <section class="hero">
      <div class="kicker" style="color:var(--yellow)">컴퓨터의 이해와 활용 · 8주차</div>
      <h1>AI 퀘스트</h1>
      <p>인공지능의 정체를 밝히는 네 개의 스테이지에 도전하세요.</p>
    </section>
    <form class="card" id="f">
      <label>우리 반</label>
      <div class="row seg" role="group">${CLASSES.map(([v, t]) => `<button type="button" class="btn" data-v="${v}" aria-pressed="false">${t}</button>`).join('')}</div>
      <label for="nick">닉네임 (10자 이내)</label>
      <input type="text" id="nick" maxlength="10" autocomplete="off" placeholder="순위판에 보일 이름">
      <p class="note">학번이나 실명 대신 별명을 써도 됩니다.</p>
      <p class="error" id="err"></p>
      <button class="btn yellow full" type="submit">시작하기</button>
    </form>`;
  app.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
    cls = b.dataset.v;
    app.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });
  document.getElementById('f').onsubmit = e => {
    e.preventDefault();
    const nick = sanitizeNick(document.getElementById('nick').value);
    const err = document.getElementById('err');
    if (!cls) { err.textContent = '반을 골라 주세요.'; return; }
    if (!nick) { err.textContent = '닉네임을 입력해 주세요.'; return; }
    S = { pid: newId(), cls, nick, unlocked: [0], scores: {}, pending: [], run: null };
    save();
    render('map');
  };
}

function map() {
  const card = s => {
    const done = s.id in S.scores;
    const open = S.unlocked.includes(s.id);
    const num = s.id === 0 ? '연' : s.id;
    let right = '';
    if (done) right = `<span class="score">${s.id === 0 ? '연습 완료' : S.scores[s.id] + '점'}</span>`;
    else if (open) right = `<button class="btn" data-play="${s.id}">시작</button>`;
    const form = !done && !open ? `
      <form data-code="${s.id}">
        <input type="text" maxlength="8" placeholder="열쇠 코드" aria-label="${esc(s.title)} 열쇠 코드" autocomplete="off">
        <button class="btn" type="submit">열기</button>
      </form><p class="error" data-err="${s.id}"></p>` : '';
    return `<div class="stage ${done ? 'done' : open ? 'open' : ''}">
      <div class="num">${done ? '✓' : num}</div>
      <div class="body"><div class="title">${esc(s.title)}</div><div class="sub">${esc(s.subtitle)}</div>${form}</div>
      ${right}</div>`;
  };
  app.innerHTML = `
    <section class="hero">
      <h1>스테이지 지도</h1>
      <p>교수님 화면에 나오는 <b>열쇠 코드</b>를 입력하면 다음 스테이지가 열려요.</p>
    </section>
    ${allDone() ? '<button class="btn yellow full" id="fin" style="margin-bottom:14px">최종 결과 보기</button>' : ''}
    <div class="stages">${STAGES.map(card).join('')}</div>`;
  app.querySelectorAll('[data-play]').forEach(b => b.onclick = () => startStage(Number(b.dataset.play)));
  app.querySelectorAll('[data-code]').forEach(f => f.onsubmit = e => {
    e.preventDefault();
    const id = Number(f.dataset.code);
    if (checkCode(f.querySelector('input').value, stageOf(id).code)) {
      S.unlocked.push(id);
      save();
      render('map');
    } else {
      app.querySelector(`[data-err="${id}"]`).textContent = '코드가 달라요. 화면을 다시 확인해 보세요.';
    }
  });
  document.getElementById('fin')?.addEventListener('click', () => render('final'));
}

function startStage(id) {
  if (!S.run || S.run.stage !== id) S.run = { stage: id, qi: 0, score: 0, correct: 0 };
  save();
  render('question');
}

function question() {
  const st = stageOf(S.run.stage);
  const q = st.questions[S.run.qi];
  const n = st.questions.length;
  const head = `
    <div class="qhead"><span>${esc(st.title)}</span><span>${S.run.qi + 1} / ${n}</span></div>
    <div class="progress"><span style="width:${(S.run.qi / n) * 100}%"></span></div>`;
  const top = `${q.icon ? `<div class="icon" aria-hidden="true">${q.icon}</div>` : ''}
    ${q.passage ? `<div class="passage">${esc(q.passage)}</div>` : ''}
    <h2>${esc(q.prompt)}</h2>`;
  const t0 = performance.now();
  const seconds = () => (performance.now() - t0) / 1000;

  if (q.type === 'order') return orderQuestion(st, q, head, top);

  const perm = q.style === 'binary' ? q.options.map((_, i) => i) : shuffle(q.options.map((_, i) => i));
  app.innerHTML = `${head}<div class="card">${top}
    <div class="options ${q.style === 'binary' ? 'binary' : ''}">
      ${perm.map(i => `<button class="opt" data-i="${i}"><span class="bar" style="width:0"></span><span class="txt"><span>${esc(q.options[i])}</span><span class="pct"></span></span></button>`).join('')}
    </div><div id="fb"></div></div>`;
  app.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
    const pick = Number(btn.dataset.i);
    const sec = seconds();
    const ok = pick === q.answer;
    const pts = scoreAnswer(ok, sec);
    app.querySelectorAll('.opt').forEach(b => {
      const i = Number(b.dataset.i);
      b.disabled = true;
      if (i === q.answer) b.classList.add('correct');
      else if (i === pick) b.classList.add('wrong');
      if (q.probs) {
        b.querySelector('.bar').style.width = q.probs[i] + '%';
        b.querySelector('.pct').textContent = q.probs[i] + '%';
      }
    });
    record(ok, pts);
    const verdict = ok
      ? `정답! +${pts}점 <span class="muted">(빠르기 보너스 +${speedBonus(sec)})</span>`
      : `아쉬워요. 정답은 “${esc(q.options[q.answer])}”`;
    showFeedback(ok, verdict, q.explain, q.probs ? 'AI가 매긴 확률은 설명을 위한 예시 숫자입니다.' : '');
  });
}

function orderQuestion(st, q, head, top) {
  const pool = shuffledNotSame(q.items.map(it => it.id));
  const picks = [];
  const label = id => q.items.find(it => it.id === id).label;
  app.innerHTML = `${head}<div class="card">${top}
    <div class="slots" id="slots"></div>
    <p class="muted" style="margin-top:14px">아래 카드를 눌러 위 칸에 차례로 넣으세요. 칸을 누르면 다시 빠집니다.</p>
    <div class="pool" id="pool"></div>
    <div class="actions"><button class="btn full" id="check" disabled>확인</button></div>
    <div id="fb"></div></div>`;
  const slots = document.getElementById('slots');
  const poolEl = document.getElementById('pool');
  const check = document.getElementById('check');
  const draw = (result) => {
    slots.innerHTML = q.items.map((_, i) => {
      const id = picks[i];
      const cls = result ? (result.hits[i] ? 'correct' : 'wrong') : id ? 'filled' : '';
      const yr = result && id ? `<span class="yr">${q.items.find(it => it.id === id).year}</span>` : '';
      return `<button class="slot ${cls}" data-slot="${i}" ${result ? 'disabled' : ''}><span class="n">${i + 1}</span><span>${id ? esc(label(id)) : ''}</span>${yr}</button>`;
    }).join('');
    poolEl.innerHTML = result ? '' : pool.filter(id => !picks.includes(id))
      .map(id => `<button class="opt" data-id="${id}"><span class="txt"><span>${esc(label(id))}</span></span></button>`).join('');
    check.disabled = picks.length !== q.items.length;
    if (result) return;
    slots.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => {
      const i = Number(b.dataset.slot);
      if (picks[i]) { picks.splice(i, 1); draw(); }
    });
    poolEl.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { picks.push(b.dataset.id); draw(); });
  };
  draw();
  check.onclick = () => {
    const result = scoreOrder(picks, q.items.map(it => it.id));
    check.parentElement.remove();
    draw(result);
    const hits = result.hits.filter(Boolean).length;
    const ok = hits === q.items.length;
    record(ok, result.score);
    showFeedback(ok, `${q.items.length}장 중 ${hits}장 제자리! +${result.score}점`, q.explain);
  };
}

function record(ok, pts) {
  S.run.qi += 1;
  S.run.score += pts;
  if (ok) S.run.correct += 1;
  save();
}

function showFeedback(ok, verdict, explain, note = '') {
  const last = S.run.qi >= stageOf(S.run.stage).questions.length;
  document.getElementById('fb').innerHTML = `
    <div class="feedback ${ok ? 'ok' : 'no'}">
      <div class="verdict">${verdict}</div>
      <p>${esc(explain)}</p>
      ${note ? `<p class="note">${esc(note)}</p>` : ''}
    </div>
    <div class="actions"><button class="btn yellow full" id="next">${last ? '결과 보기' : '다음 문제'}</button></div>`;
  const next = document.getElementById('next');
  next.focus();
  next.onclick = () => (last ? finishStage() : render('question'));
}

function finishStage() {
  const { stage, score, correct } = S.run;
  S.scores[stage] = score;
  S.pending.push({ stage, score: stage === 0 ? 0 : score });
  S.run = null;
  save();
  flush().then(() => { if (view?.name === 'stageEnd') render('stageEnd', view); });
  render('stageEnd', { stage, score, correct });
}

function stageEnd() {
  const st = stageOf(view.stage);
  const n = st.questions.length;
  const waiting = API_URL && S.pending.length;
  app.innerHTML = `
    <section class="hero"><div class="kicker" style="color:var(--yellow)">스테이지 완료</div><h1>${esc(st.title)}</h1></section>
    <div class="card">
      <div class="big">${view.score}점</div>
      <p>${n}문제 중 ${view.correct}문제를 맞혔어요.</p>
      ${st.id === 0 ? '<p class="muted">연습 점수는 순위에 들어가지 않아요. 이제 교수님 설명을 듣고 열쇠 코드를 기다리세요.</p>' : ''}
      ${waiting ? '<p class="note">점수를 보내는 중이에요. 인터넷이 연결되면 다음 스테이지를 마칠 때 다시 보냅니다.</p>' : ''}
      <div class="actions"><button class="btn full" id="back">${allDone() ? '최종 결과 보기' : '스테이지 지도로'}</button></div>
    </div>`;
  document.getElementById('back').onclick = () => render(allDone() ? 'final' : 'map');
}

function final() {
  app.innerHTML = `
    <section class="hero"><div class="kicker" style="color:var(--yellow)">퀘스트 완료</div><h1>${esc(S.nick)}님의 AI 퀘스트</h1></section>
    <div class="card">
      <div class="muted">총점</div>
      <div class="big">${total()}점</div>
      <ul class="list">${mainStages().map(s => `<li><span>${esc(s.title)}</span><b>${S.scores[s.id] ?? 0}점</b></li>`).join('')}</ul>
      <p style="margin-top:16px">교수님 화면의 순위판에서 우리 반 순위를 확인하세요!</p>
      <div class="actions"><button class="btn ghost full" id="back">스테이지 지도로</button></div>
    </div>`;
  document.getElementById('back').onclick = () => render('map');
}

function reset() {
  app.innerHTML = `
    <div class="card" style="margin-top:20px">
      <h2>처음부터 다시 시작할까요?</h2>
      <p>이 컴퓨터에 저장된 <b>${esc(S.nick)}</b>님의 진행 기록을 지웁니다. 다른 사람이 이 컴퓨터를 쓸 때 누르세요. 이미 보낸 점수는 순위판에 그대로 남아요.</p>
      <div class="row"><button class="btn ghost" id="no">취소</button><button class="btn" id="yes">지우고 새로 시작</button></div>
    </div>`;
  document.getElementById('no').onclick = () => render('map');
  document.getElementById('yes').onclick = () => { S = null; save(); render('join'); };
}

// ---------- 시작 ----------
if (!S) render('join');
else if (S.run) render('question');
else render('map');
flush();
