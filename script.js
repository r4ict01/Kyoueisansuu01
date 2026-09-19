const form = document.getElementById('reflection-form');
const summaryInput = document.getElementById('summary');
const selfEvaluationSelect = document.getElementById('selfEvaluation');
const preview = document.getElementById('preview');
const copyButton = document.getElementById('copyText');
const fillSampleButton = document.getElementById('fillSample');

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function getRadioValue(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : '未入力';
}

function buildPreviewText() {
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

  preview.textContent = result;
}

function fillSample() {
  summaryInput.value = '今日は、分数のたし算を学習しました。たし算の意味を考えながら、問題を順番に解くことができました。';
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

function copyText() {
  const text = preview.textContent;
  navigator.clipboard.writeText(text)
    .then(() => {
      copyButton.textContent = 'コピーしました';
      setTimeout(() => {
        copyButton.textContent = '文章をコピー';
      }, 1500);
    })
    .catch(() => {
      copyButton.textContent = 'コピーできませんでした';
      setTimeout(() => {
        copyButton.textContent = '文章をコピー';
      }, 1500);
    });
}

form.addEventListener('input', buildPreviewText);
fillSampleButton.addEventListener('click', fillSample);
copyButton.addEventListener('click', copyText);

buildPreviewText();
