import { API_URL } from './config.js';
import { rankPlayers } from './logic.js';

const POLL_MS = 5000;
const CLASSES = [['A', 'A반'], ['B', 'B반'], ['T', '연습']];
const STAGE_NAMES = ['AI일까?', '타임머신', '다음 단어', '거짓말'];
const params = new URLSearchParams(location.search);
const cls = CLASSES.some(c => c[0] === params.get('class')) ? params.get('class') : 'A';
const mock = params.has('mock');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);

$('cls').textContent = '· ' + CLASSES.find(c => c[0] === cls)[1];
$('tabs').innerHTML = CLASSES.map(([v, t]) =>
  `<a href="?class=${v}${mock ? '&mock' : ''}" ${v === cls ? 'aria-current="page"' : ''}>${t}</a>`).join('');

function mockData() {
  const names = ['별빛', '코딩왕', '진주쌤', '알파', '다람쥐', '해바라기', '파도', '구름빵', '토끼', '민트초코', '호랑이', '새벽'];
  const rows = names.map((nick, i) => ({ nick, total: 3800 - i * 230 + (i % 3) * 40, stages: { 1: 1, 2: 1, ...(i < 9 ? { 3: 1 } : {}), ...(i < 5 ? { 4: 1 } : {}) }, at: i }));
  return { rows, count: rows.length, done: [12, 12, 9, 5] };
}

function render(data) {
  const top = rankPlayers(data.rows, 10);
  const medal = i => ['🥇', '🥈', '🥉'][i] ?? i + 1;
  $('rank').innerHTML = top.length
    ? top.map((r, i) => `<div class="item ${i < 3 ? 'podium' : ''}"><div class="pos">${medal(i)}</div><div class="nick">${esc(r.nick)}</div><div class="pts">${r.total.toLocaleString()}점</div></div>`).join('')
    : '<div class="empty">아직 점수가 없어요. 첫 스테이지를 기다리는 중!</div>';
  $('count').textContent = data.count + '명';
  $('done').innerHTML = data.done.map((n, i) => {
    const pct = data.count ? Math.round((n / data.count) * 100) : 0;
    return `<div class="dl"><span>${STAGE_NAMES[i]}</span><div class="track"><span style="width:${pct}%"></span></div><b>${n}</b></div>`;
  }).join('');
}

async function tick() {
  if (mock) {
    render(mockData());
    $('status').textContent = '예시 데이터로 보는 중';
    return;
  }
  if (!API_URL) {
    $('status').textContent = '점수 서버 연결 대기 중 (config.js에 주소 필요)';
    render({ rows: [], count: 0, done: [0, 0, 0, 0] });
    return;
  }
  try {
    const res = await fetch(`${API_URL}?cls=${cls}&t=${Date.now()}`);
    render(await res.json());
    $('status').textContent = '마지막 갱신 ' + new Date().toLocaleTimeString('ko-KR');
  } catch {
    $('status').textContent = '연결 대기 중… 5초 뒤 다시 시도합니다.';
  }
}

tick();
setInterval(tick, POLL_MS);
