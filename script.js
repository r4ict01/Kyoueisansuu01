const STORAGE_KEY = 'math-reflection-entries-v1';
const GOAL_DRAFT_KEY = 'math-reflection-goal-draft-v1';

const form = document.getElementById('reflection-form');
const goalInput = document.getElementById('goal');
const saveGoalButton = document.getElementById('saveGoalButton');
const goalSaveStatus = document.getElementById('goalSaveStatus');
const recordSaveStatus = document.getElementById('recordSaveStatus');
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

function loadGoalDraft() {
  try {
    goalInput.value = localStorage.getItem(GOAL_DRAFT_KEY) || '';
  } catch (error) {
    goalSaveStatus.textContent = '保存した内容を読み込めませんでした。';
  }
}

function evaluationScore(value) {
  const map = { S: 4, A: 3, B: 2, C: 1 };
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
  document.querySelector('input[name="focus"][value="できた"]').checked = true;
  document.querySelector('input[name="adjust"][value="できた"]').checked = true;
  document.querySelector('input[name="notLeft"][value="できた"]').checked = true;
  document.querySelector('input[name="nextWays"][value="自分で"]').checked = true;
  document.querySelector('input[name="nextWays"][value="先生と"]').checked = true;
  selfEvaluationSelect.value = 'A';
  buildPreviewText();
}

function buildEntryObject() {
  return {
    date: entryDateInput.value || getTodayString(),
    goal: goalInput.value.trim(),
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

let currentFilter = ['all'];

function renderHistory() {
  const entries = loadEntries().sort((a, b) => new Date(a.date) - new Date(b.date));
  const filteredEntries = currentFilter.includes('all')
    ? entries
    : entries.filter((entry) => currentFilter.includes(entry.selfEvaluation || '未選択'));

  if (!filteredEntries.length) {
    const item = document.createElement('li');
    const date = document.createElement('div');
    date.className = 'history-date';
    date.textContent = 'まだ記録がありません';
    const summary = document.createElement('p');
    summary.className = 'history-summary';
    summary.textContent = 'この評価の記録はまだありません。';
    item.append(date, summary);
    historyList.replaceChildren(item);
    return;
  }

  const items = filteredEntries.map((entry) => {
    const item = document.createElement('li');
    const date = document.createElement('div');
    date.className = 'history-date';
    date.textContent = entry.date || '日付未設定';

    if (entry.goal) {
      const goal = document.createElement('p');
      goal.className = 'history-goal';
      const label = document.createElement('strong');
      label.textContent = 'めざすすがた：';
      goal.append(label, document.createTextNode(entry.goal));
      item.append(goal);
    }

    const summary = document.createElement('p');
    summary.className = 'history-summary';
    summary.textContent = entry.summary || '（まとめなし）';

    const evaluation = document.createElement('span');
    evaluation.className = 'history-evaluation';
    evaluation.textContent = `自己評価：${entry.selfEvaluation || '未選択'}`;

    item.prepend(date);
    item.append(summary, evaluation);
    return item;
  });
  historyList.replaceChildren(...items);
}

function bindFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.filter;

      if (value === 'all') {
        currentFilter = ['all'];
      } else if (currentFilter.includes(value)) {
        currentFilter = currentFilter.filter((item) => item !== value);
        if (!currentFilter.length) currentFilter = ['all'];
      } else {
        currentFilter = currentFilter.filter((item) => item !== 'all');
        currentFilter.push(value);
      }

      document.querySelectorAll('.filter-btn').forEach((item) => {
        const isActive = currentFilter.includes(item.dataset.filter);
        item.classList.toggle('active', isActive);
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

  const maxScore = 4;
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

  const yLabels = ['S', 'A', 'B', 'C'];
  yLabels.forEach((label, index) => {
    const y = gridTop + (innerHeight / (yLabels.length - 1)) * index;
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

  try {
    const entries = loadEntries();
    const newEntry = buildEntryObject();
    entries.push(newEntry);
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveEntries(entries);
    recordSaveStatus.textContent = 'がくしゅうの　きろくをほぞんしました。';
    refreshApp();
  } catch (error) {
    recordSaveStatus.textContent = 'ほぞんできませんでした。もう一度おためしください。';
  }
});

form.addEventListener('input', buildPreviewText);

saveGoalButton.addEventListener('click', () => {
  try {
    localStorage.setItem(GOAL_DRAFT_KEY, goalInput.value);
    goalSaveStatus.textContent = 'めざすすがたをほぞんしました。';
  } catch (error) {
    goalSaveStatus.textContent = 'ほぞんできませんでした。もう一度おためしください。';
  }
});

entryDateInput.value = getTodayString();
loadGoalDraft();
bindFilterButtons();
refreshApp();
