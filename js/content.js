// 문제·해설·열쇠 코드. 교수자가 내용을 고칠 때는 이 파일만 바꾸면 된다.
// choice: answer는 options의 순서(0부터). probs가 있으면 답한 뒤 확률 막대를 보여 준다.
// order: items는 정답 순서로 적는다. 화면에서는 섞어서 보여 준다.

const AI_YES = 'AI 맞아요';
const AI_NO = 'AI 아니에요';
const binary = (icon, prompt, isAI, explain) => ({
  type: 'choice', style: 'binary', icon, prompt,
  options: [AI_YES, AI_NO], answer: isAI ? 0 : 1, explain,
});

export const STAGES = [
  {
    id: 0,
    title: '연습',
    subtitle: '게임 방법 익히기',
    code: null,
    questions: [
      {
        type: 'choice', icon: '🎮', prompt: '오늘 수업에서 함께 알아볼 주제는 무엇일까요?',
        options: ['인공지능', '구글 사이트', '스프레드시트', '프레젠테이션'], answer: 0,
        explain: '오늘은 인공지능(AI)이 무엇인지, 어떻게 발전해 왔는지 게임으로 알아봅니다. 빨리 답할수록 보너스 점수가 붙어요.',
      },
    ],
  },
  {
    id: 1,
    title: 'AI일까, 아닐까?',
    subtitle: '정해진 규칙대로만? 데이터에서 배워서?',
    code: 'MIND',
    questions: [
      binary('🧮', '계산기', false, '정해진 계산 규칙대로만 계산해요. 스스로 배우지 않아요.'),
      binary('▶️', '유튜브 영상 추천', true, '내가 본 영상 기록에서 취향을 배워 다음 영상을 골라 줘요.'),
      binary('🔓', '얼굴 인식 잠금 해제', true, '수많은 얼굴 사진으로 배운 특징을 이용해 나를 알아봐요.'),
      binary('🛗', '엘리베이터 층 버튼', false, '누른 층으로 간다는 규칙뿐이에요.'),
      binary('🌐', '번역 앱', true, '아주 많은 문장과 그 번역을 보고 번역하는 법을 배웠어요.'),
      binary('⏰', '정해진 시간에 울리는 알람', false, '시간이 되면 울린다는 규칙이에요.'),
      binary('🗣️', '“오늘 날씨 알려 줘” 음성 비서', true, '목소리를 글자로 바꾸고, 말의 뜻을 알아듣는 법을 배웠어요.'),
      binary('📧', '스팸 메일 자동 분류', true, '스팸 메일 예시를 많이 보고 비슷한 메일을 찾아내요.'),
      binary('🚪', '사람이 오면 열리는 자동문', false, '센서가 사람을 느끼면 연다는 규칙이에요. 센서가 있다고 AI는 아니에요.'),
      binary('🐶', '사진 앱의 “강아지 사진만 모아 보기”', true, '사진 속 강아지의 모양을 배워서 알아봐요.'),
    ],
  },
  {
    id: 2,
    title: 'AI 타임머신',
    subtitle: 'AI는 어떻게 여기까지 왔을까?',
    code: 'TIME',
    questions: [
      {
        type: 'order', icon: '⏳', prompt: '오래된 일부터 차례대로 눌러 연표를 완성하세요.',
        items: [
          { id: 'turing', year: 1950, label: '튜링이 “기계가 생각할 수 있을까?”라고 묻다' },
          { id: 'dartmouth', year: 1956, label: '‘인공지능’이라는 이름이 생기다' },
          { id: 'deepblue', year: 1997, label: '체스 컴퓨터 딥블루가 세계 챔피언을 이기다' },
          { id: 'alphago', year: 2016, label: '알파고가 바둑에서 이세돌 9단을 이기다' },
          { id: 'chatgpt', year: 2022, label: 'ChatGPT가 공개되어 누구나 AI와 대화하다' },
        ],
        explain: '1950 → 1956 → 1997 → 2016 → 2022. 70년 넘게 이어진 이야기예요.',
      },
      {
        type: 'choice', icon: '📛', prompt: '‘인공지능(AI)’이라는 이름이 처음 생긴 때는?',
        options: ['1956년', '1997년', '2016년', '2022년'], answer: 0,
        explain: '1956년 미국 다트머스 대학 모임에서 처음 ‘인공지능’이라는 이름을 썼어요.',
      },
      {
        type: 'choice', icon: '❄️', prompt: 'AI가 기대만큼 잘되지 않아 관심과 연구비가 크게 줄었던 시기를 무엇이라고 부를까요?',
        options: ['AI 겨울', 'AI 여름', 'AI 방학', 'AI 정전'], answer: 0,
        explain: '기대가 식어 연구가 얼어붙었다는 뜻으로 ‘AI 겨울’이라고 불러요. AI 역사에는 이런 시기가 여러 번 있었어요.',
      },
      {
        type: 'choice', icon: '🏆', prompt: '2016년 알파고가 이세돌 9단을 이긴 게임은?',
        options: ['바둑', '체스', '장기', '오목'], answer: 0,
        explain: '경우의 수가 아주 많은 바둑에서 AI가 최고 수준의 사람을 이겨 세계가 놀랐어요.',
      },
    ],
  },
  {
    id: 3,
    title: '다음 단어를 맞혀라',
    subtitle: '생성형 AI는 어떻게 글을 쓸까?',
    code: 'WORD',
    questions: [
      {
        type: 'choice', icon: '✨', prompt: '‘생성형 AI’에 대한 설명으로 알맞은 것은?',
        options: ['새로운 글·그림·음악 등을 만들어 내는 AI', '정해진 규칙대로만 계산하는 프로그램', '인터넷 검색 결과를 그대로 보여 주는 프로그램', '사람이 직접 조종하는 로봇'], answer: 0,
        explain: '생성형 AI는 배운 것을 바탕으로 새로운 글, 그림, 음악 같은 것을 만들어 내요. ChatGPT가 대표적이에요.',
      },
      {
        type: 'choice', icon: '🪆', prompt: '가장 큰 것부터 차례로 쓴 포함 관계로 알맞은 것은?',
        options: ['인공지능 ⊃ 머신러닝 ⊃ 딥러닝', '딥러닝 ⊃ 머신러닝 ⊃ 인공지능', '머신러닝 ⊃ 인공지능 ⊃ 딥러닝', '셋은 서로 관계가 없다'], answer: 0,
        explain: '인공지능 안에 데이터로 배우는 머신러닝이 있고, 그 안에 딥러닝이 있어요. 자세한 내용은 9주차에 배워요.',
      },
      {
        type: 'choice', style: 'nextword', icon: '☔', prompt: '“비가 와서 우산을 ___”',
        options: ['챙겼다', '샀다', '펼쳤다', '먹었다'], probs: [55, 25, 15, 1], answer: 0,
        explain: 'AI는 앞 문장을 보고 다음에 올 단어의 확률을 계산해서 골라요.',
      },
      {
        type: 'choice', style: 'nextword', icon: '🪥', prompt: '“아침에 일어나서 이를 ___”',
        options: ['닦았다', '봤다', '셌다', '심었다'], probs: [80, 8, 5, 1], answer: 0,
        explain: '많은 글에서 ‘이를’ 다음에 ‘닦았다’가 가장 자주 나왔기 때문에 확률이 높아요.',
      },
      {
        type: 'choice', style: 'nextword', icon: '📚', prompt: '“도서관에서는 ___ 이야기해야 한다”',
        options: ['조용히', '크게', '빨리', '함께'], probs: [70, 3, 10, 12], answer: 0,
        explain: '문장 앞부분(도서관)이 다음 단어의 확률을 바꿔요. AI가 ‘맥락’을 본다는 뜻이에요.',
      },
      {
        type: 'choice', style: 'nextword', icon: '🎂', prompt: '“생일 축하 노래를 부르고 케이크의 ___을 껐다”',
        options: ['촛불', '불', '전등', '노래'], probs: [85, 10, 3, 1], answer: 0,
        explain: '이렇게 한 단어씩 이어 붙여 긴 글을 만드는 것이 생성형 AI가 글을 쓰는 방법이에요.',
      },
      {
        type: 'choice', icon: '🎲', prompt: 'AI가 매번 확률 1위 단어만 고른다면 글은 어떻게 될까요?',
        options: ['늘 비슷하고 무난한 글이 된다', '매번 완전히 새로운 글이 된다', '글자가 깨진다', '항상 사실만 말하게 된다'], answer: 0,
        explain: '그래서 AI는 가끔 2·3위 단어도 골라 다양한 글을 써요. 같은 질문에 답이 조금씩 다른 이유예요.',
      },
    ],
  },
  {
    id: 4,
    title: 'AI 거짓말 탐지기',
    subtitle: 'AI도 틀린다! 틀린 문장을 찾아라',
    code: 'FACT',
    questions: [
      {
        type: 'choice', style: 'sentences', icon: '👑', prompt: 'AI 답변에서 틀린 문장을 고르세요.',
        passage: '질문: 세종대왕에 대해 알려 줘',
        options: ['세종대왕은 1443년 훈민정음을 만들고 1446년 세상에 알렸습니다.', '세종대왕은 조선의 4대 왕입니다.', '세종대왕은 거북선을 직접 설계했습니다.'], answer: 2,
        explain: '거북선은 임진왜란 때 이순신 장군과 관련 있어요. AI는 그럴듯한 문장 사이에 틀린 내용을 섞기도 해요.',
      },
      {
        type: 'choice', style: 'sentences', icon: '💧', prompt: 'AI 답변에서 틀린 문장을 고르세요.',
        passage: '질문: 물에 대해 알려 줘',
        options: ['물은 1기압에서 100℃에 끓습니다.', '물은 0℃에서 얼기 시작합니다.', '물 분자는 산소 원자 2개와 수소 원자 1개로 이루어져 있습니다.'], answer: 2,
        explain: '물(H₂O)은 수소 2개와 산소 1개예요. 자신 있는 말투라고 정답은 아니에요.',
      },
      {
        type: 'choice', style: 'sentences', icon: '🌙', prompt: 'AI 답변에서 틀린 문장을 고르세요.',
        passage: '질문: 달에 대해 알려 줘',
        options: ['달은 약 한 달에 한 번 지구 둘레를 돕니다.', '달에는 공기가 거의 없습니다.', '달은 스스로 빛을 냅니다.'], answer: 2,
        explain: '달은 햇빛을 반사해서 빛나 보여요. 아는 내용이라도 한 번 더 확인하는 습관이 필요해요.',
      },
      {
        type: 'choice', icon: '🔎', prompt: 'AI가 “김○○(2021), 「스마트폰과 잠」, 한국수면학회지 15권”을 출처로 알려 주었어요. 어떻게 할까요?',
        options: ['AI가 알려 줬으니 그대로 과제에 쓴다', '실제로 있는 논문인지 검색해서 확인한다', '출처가 있으니 내용도 모두 사실이다', '제목이 그럴듯하니 믿는다'], answer: 1,
        explain: 'AI는 있지도 않은 논문이나 책을 지어내기도 해요. 2주차에 배운 것처럼 출처는 직접 찾아 확인해요.',
      },
      {
        type: 'choice', icon: '🌀', prompt: 'AI가 그럴듯하지만 사실이 아닌 내용을 말하는 현상을 무엇이라고 할까요?',
        options: ['할루시네이션(환각)', '업데이트', '딥러닝', '알고리즘'], answer: 0,
        explain: '할루시네이션(환각)이라고 해요. AI의 답은 ‘초안’으로 보고, 중요한 내용은 꼭 확인해요.',
      },
    ],
  },
];
