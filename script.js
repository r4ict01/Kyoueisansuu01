const STORAGE_KEY = 'math-reflection-entries-v1';

const form = document.getElementById('reflection-form');
const summaryInput = document.getElementById('summary');
const selfEvaluationSelect = document.getElementById('selfEvaluation');
const entryDateInput = document.getElementById('entryDate');
const historyList = document.getElementById('historyList');
const chartCanvas = document.getElementById('evaluationChart');

const chartContext = chartCanvas.getContext('2d');

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function getRadioValue(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : '未入力';
}

function loadEntries() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function evaluationScore(value) {
  const map = { S: 5, A: 4, B: 3, C: 2, 'ｃ': 1 };
  return map[value] ?? 0;
}

function formatDateLabel(dateString) {
  if (!dateString) return '日付未設定';
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(date);
}

function buildPreviewText() {
  const dateText = entryDateInput.value ? `${entryDateInput.value} ` : '日付未入力';
  const summary = summaryInput.value.trim() || '（課題に対するまとめを入力してください。）';
  const studyWays = getCheckedValues('studyWays');
  const nextWays = getCheckedValues('nextWays');
  const evaluation = selfEvaluationSelect.value || '未選択';

  const todayText = studyWays.length
    ? `${studyWays.join('、')}で学びました。`
    : '学び方はまだ入力されていません。';

  const nextText = nextWays.length
    ? `${nextWays.map((way) => `${way}学ぶ`).join('、')}。`
    : '次に取り組む学び方はまだ決めていません。';

  const result = [
    `日付：${dateText}`,
    '課題に対するまとめ',
    summary,
    '',
    '学び方の振り返り',
    `今日は${todayText}`,
    `② ${getRadioValue('focus')}`,
    `③ ${getRadioValue('adjust')}`,
    `④ ${getRadioValue('notLeft')}`,
    '',
    `だから次は、${nextText}`,
    `自己評価：${evaluation}`
  ].join('\n');

  if (historyList) {
    historyList.setAttribute('data-preview', result);
  }
}

function fillSample() {
  entryDateInput.value = getTodayString();
  summaryInput.value = '今日は、分数のたし算を学習しました。ひっ算のやり方を確認しながら、問題を一つずつ考えて解くことができました。';
  document.querySelector('input[name="studyWays"][value="自分で"]').checked = true;
  document.querySelector('input[name="studyWays"][value="仲間と"]').checked = true;
  document.querySelector('input[name="focus"][value="〇"]').checked = true;
  document.querySelector('input[name="adjust"][value="〇"]').checked = true;
  document.querySelector('input[name="notLeft"][value="〇"]').checked = true;
  document.querySelector('input[name="nextWays"][value="自分で"]').checked = true;
  document.querySelector('input[name="nextWays"][value="先生と"]').checked = true;
  selfEvaluationSelect.value = 'A';
  buildPreviewText();
}

function buildEntryObject() {
  return {
    date: entryDateInput.value || getTodayString(),
    summary: summaryInput.value.trim(),
    studyWays: getCheckedValues('studyWays'),
    focus: getRadioValue('focus'),
    adjust: getRadioValue('adjust'),
    notLeft: getRadioValue('notLeft'),
    nextWays: getCheckedValues('nextWays'),
    selfEvaluation: selfEvaluationSelect.value,
    createdAt: new Date().toISOString()
  };
}

let currentFilter = 'all';

function renderHistory() {
  const entries = loadEntries().sort((a, b) => new Date(a.date) - new Date(b.date));
  const filteredEntries = currentFilter === 'all'
    ? entries
    : entries.filter((entry) => entry.selfEvaluation === currentFilter);

  if (!filteredEntries.length) {
    historyList.innerHTML = '<li><div class="history-date">まだ記録がありません</div><p class="history-summary">この評価の記録はまだありません。</p></li>';
    return;
  }

  historyList.innerHTML = filteredEntries
    .map((entry) => {
      const summaryText = entry.summary || '（まとめなし）';
      const evaluation = entry.selfEvaluation || '未選択';
      return `
        <li>
          <div class="history-date">${entry.date}</div>
          <p class="history-summary">${summaryText}</p>
          <span class="history-evaluation">自己評価：${evaluation}</span>
        </li>
      `;
    })
    .join('');
}

function bindFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach((item) => {
        item.classList.toggle('active', item === button);
      });
      renderHistory();
    });
  });
}

function drawEvaluationChart() {
  const entries = loadEntries().sort((a, b) => new Date(a.date) - new Date(b.date));
  const ctx = chartContext;

  const width = chartCanvas.width;
  const height = chartCanvas.height;
  const padding = { top: 20, right: 24, bottom: 28, left: 32 };
  const gridTop = padding.top;
  const gridBottom = height - padding.bottom;
  const gridLeft = padding.left;
  const gridRight = width - padding.right;
  const innerWidth = gridRight - gridLeft;
  const innerHeight = gridBottom - gridTop;

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i <= 4; i += 1) {
    const y = gridTop + (innerHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(gridLeft, y);
    ctx.lineTo(gridRight, y);
    ctx.strokeStyle = '#dfe9ff';
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(gridLeft, gridTop);
  ctx.lineTo(gridLeft, gridBottom);
  ctx.lineTo(gridRight, gridBottom);
  ctx.strokeStyle = '#b7c7ec';
  ctx.stroke();

  const scoreValues = entries.map((entry) => evaluationScore(entry.selfEvaluation));
  const maxScore = 5;
  const minScore = 1;

  if (!entries.length) {
    ctx.fillStyle = '#5f6f8a';
    ctx.font = '16px sans-serif';
    ctx.fillText('記録がありません', 120, height / 2);
    return;
  }

  const points = entries.map((entry, index) => {
    const x = gridLeft + (index / Math.max(entries.length - 1, 1)) * innerWidth;
    const score = evaluationScore(entry.selfEvaluation);
    const y = gridTop + ((maxScore - score) / (maxScore - minScore)) * innerHeight;
    return { x, y, label: formatDateLabel(entry.date), value: score, rawDate: entry.date };
  });

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.strokeStyle = '#3b7ae5';
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#3b7ae5';
    ctx.fill();
    ctx.closePath();
  });

  const labels = points.slice(-Math.min(points.length, 5));
  labels.forEach((point) => {
    ctx.fillStyle = '#59657d';
    ctx.font = '11px sans-serif';
    ctx.fillText(point.label, point.x - 12, gridBottom + 20);
  });

  const yLabels = ['5', '4', '3', '2', '1'];
  yLabels.forEach((label, index) => {
    const y = gridTop + (innerHeight / 4) * index;
    ctx.fillStyle = '#59657d';
    ctx.font = '11px sans-serif';
    ctx.fillText(label, 8, y + 4);
  });
}

function refreshApp() {
  buildPreviewText();
  renderHistory();
  drawEvaluationChart();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const entries = loadEntries();
  const newEntry = buildEntryObject();
  entries.push(newEntry);
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveEntries(entries);
  refreshApp();
});

form.addEventListener('input', buildPreviewText);

entryDateInput.value = getTodayString();
bindFilterButtons();
refreshApp();
