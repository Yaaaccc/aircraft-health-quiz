const HF_KEYS = ["A", "B", "C", "D", "E", "F"];
const HF_RAW_QUESTIONS = window.HF_QUESTIONS || [];
const HF_SHORT_ANSWERS = window.HF_SHORT_ANSWERS || [];
const HF_QUESTIONS = HF_RAW_QUESTIONS.map((question) => ({
  ...question,
  chapter: question.chapter,
  category: question.chapter,
  options: question.options.map((text, index) => ({
    key: HF_KEYS[index],
    text
  })),
  answer: question.answer.map((index) => HF_KEYS[index])
}));
const HF_QUESTION_BY_ID = new Map(HF_QUESTIONS.map((question) => [question.id, question]));
const HF_SHORT_BY_ID = new Map(HF_SHORT_ANSWERS.map((question) => [question.id, question]));
const HF_CHAPTERS = [...new Set(HF_QUESTIONS.map((question) => question.chapter))];
const HF_SHORT_CHAPTERS = [...new Set(HF_SHORT_ANSWERS.map((question) => question.chapter))];
const HFQ_KEYS = ["A", "B", "C", "D", "E", "F"];
const HFQ_QUIZZES = (window.HF_QUIZZES || []).map((quiz) => ({
  ...quiz,
  questions: quiz.questions.map((question) => ({
    ...question,
    options: question.options.map((text, index) => ({
      key: HFQ_KEYS[index],
      text
    })),
    answer: question.answer.map((index) => HFQ_KEYS[index])
  }))
}));
const HFQ_QUESTIONS = HFQ_QUIZZES.flatMap((quiz) => quiz.questions);
const HFQ_QUESTION_BY_ID = new Map(HFQ_QUESTIONS.map((question) => [question.id, question]));
const HFQ_QUIZ_BY_ID = new Map(HFQ_QUIZZES.map((quiz) => [quiz.id, quiz]));
const HF_STORAGE_KEY = "aeroprep-human-factors-state-v1";
const HFQ_STORAGE_KEY = "aeroprep-hf-teacher-quizzes-state-v1";
const HF_TYPE_LABEL = { single: "单选题", multiple: "多选题", judge: "判断题" };
const HF_PAGE_LABEL = {
  home: "今日概览",
  practice: "刷题练习",
  bank: "全部题库",
  short: "简答练习",
  quizzes: "老师测验",
  "quiz-practice": "测验练习",
  "quiz-result": "测验结果",
  wrong: "错题本",
  result: "练习结果"
};

const hfApp = document.getElementById("hf-app");
const hfToastEl = document.getElementById("hf-toast");
const hfBankState = { query: "", type: "all", chapter: "all" };
let hfSession = null;
let hfShortSession = null;
let hfToastTimer = null;
let hfAutoAdvanceTimer = null;
let hfQuizSession = null;
let hfQuizAutoAdvanceTimer = null;

function hfIcon(name, className = "") {
  return `<svg${className ? ` class="${className}"` : ""} aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function hfEscape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function hfDateKey() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function hfDefaultState() {
  return {
    progress: {},
    wrong: [],
    shortProgress: {},
    shortDrafts: {},
    stats: {
      totalAnswered: 0,
      totalCorrect: 0,
      todayDate: hfDateKey(),
      todayCount: 0
    }
  };
}

function hfLoadState() {
  const base = hfDefaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(HF_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return base;
    const merged = {
      ...base,
      ...saved,
      progress: saved.progress && typeof saved.progress === "object" ? saved.progress : {},
      wrong: Array.isArray(saved.wrong)
        ? saved.wrong.filter((id) => HF_QUESTION_BY_ID.has(id))
        : [],
      shortProgress: saved.shortProgress && typeof saved.shortProgress === "object"
        ? Object.fromEntries(
          Object.entries(saved.shortProgress).filter(([id]) => HF_SHORT_BY_ID.has(id))
        )
        : {},
      shortDrafts: saved.shortDrafts && typeof saved.shortDrafts === "object"
        ? Object.fromEntries(
          Object.entries(saved.shortDrafts).filter(([id]) => HF_SHORT_BY_ID.has(id))
        )
        : {},
      stats: { ...base.stats, ...(saved.stats || {}) }
    };
    if (merged.stats.todayDate !== hfDateKey()) {
      merged.stats.todayDate = hfDateKey();
      merged.stats.todayCount = 0;
    }
    return merged;
  } catch {
    return base;
  }
}

let hfState = hfLoadState();

function hfSaveState() {
  try {
    localStorage.setItem(HF_STORAGE_KEY, JSON.stringify(hfState));
  } catch {
    hfToast("浏览器未能保存本课程进度");
  }
}

function hfqDefaultState() {
  return {
    progress: {},
    wrong: [],
    stats: {
      totalAnswered: 0,
      totalCorrect: 0,
      sessions: 0
    }
  };
}

function hfqLoadState() {
  const base = hfqDefaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(HFQ_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return base;
    return {
      ...base,
      ...saved,
      progress: saved.progress && typeof saved.progress === "object"
        ? Object.fromEntries(
          Object.entries(saved.progress).filter(([id, value]) => (
            HFQ_QUESTION_BY_ID.has(id) && value && typeof value === "object"
          ))
        )
        : {},
      wrong: Array.isArray(saved.wrong)
        ? saved.wrong.filter((id) => HFQ_QUESTION_BY_ID.has(id))
        : [],
      stats: { ...base.stats, ...(saved.stats || {}) }
    };
  } catch {
    return base;
  }
}

let hfqState = hfqLoadState();

function hfqSaveState() {
  try {
    localStorage.setItem(HFQ_STORAGE_KEY, JSON.stringify(hfqState));
  } catch {
    hfToast("浏览器未能保存老师测验进度");
  }
}

function hfSolvedCount() {
  return Object.keys(hfState.progress).length;
}

function hfOverallPercent() {
  return HF_QUESTIONS.length
    ? Math.round((hfSolvedCount() / HF_QUESTIONS.length) * 100)
    : 0;
}

function hfAccuracy() {
  if (!hfState.stats.totalAnswered) return 0;
  return Math.round((hfState.stats.totalCorrect / hfState.stats.totalAnswered) * 100);
}

function hfqSolvedCount() {
  return Object.keys(hfqState.progress).length;
}

function hfqOverallPercent() {
  return HFQ_QUESTIONS.length
    ? Math.round((hfqSolvedCount() / HFQ_QUESTIONS.length) * 100)
    : 0;
}

function hfqAccuracy() {
  if (!hfqState.stats.totalAnswered) return 0;
  return Math.round((hfqState.stats.totalCorrect / hfqState.stats.totalAnswered) * 100);
}

function hfShuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function hfToast(message) {
  clearTimeout(hfToastTimer);
  hfToastEl.textContent = message;
  hfToastEl.classList.add("is-visible");
  hfToastTimer = setTimeout(() => hfToastEl.classList.remove("is-visible"), 2400);
}

function hfChapterQuestions(chapter) {
  return HF_QUESTIONS.filter((question) => question.chapter === chapter);
}

function hfChapterSolved(chapter) {
  return hfChapterQuestions(chapter).filter((question) => hfState.progress[question.id]).length;
}

function hfRecordAnswer(question, selected, correct) {
  const previous = hfState.progress[question.id] || { attempts: 0, correct: 0 };
  hfState.progress[question.id] = {
    attempts: previous.attempts + 1,
    correct: previous.correct + (correct ? 1 : 0),
    lastSelected: selected,
    lastCorrect: correct,
    updatedAt: new Date().toISOString()
  };
  hfState.stats.totalAnswered += 1;
  if (correct) hfState.stats.totalCorrect += 1;
  hfState.wrong = correct
    ? hfState.wrong.filter((id) => id !== question.id)
    : [question.id, ...hfState.wrong.filter((id) => id !== question.id)];

  if (hfState.stats.todayDate !== hfDateKey()) {
    hfState.stats.todayDate = hfDateKey();
    hfState.stats.todayCount = 0;
  }
  hfState.stats.todayCount += 1;
  hfSaveState();
  hfUpdateChrome();
}

function hfqRecordAnswer(question, selected, correct) {
  const previous = hfqState.progress[question.id] || { attempts: 0, correct: 0 };
  hfqState.progress[question.id] = {
    attempts: previous.attempts + 1,
    correct: previous.correct + (correct ? 1 : 0),
    lastSelected: selected,
    lastCorrect: correct,
    updatedAt: new Date().toISOString()
  };
  hfqState.stats.totalAnswered += 1;
  if (correct) hfqState.stats.totalCorrect += 1;
  hfqState.wrong = correct
    ? hfqState.wrong.filter((id) => id !== question.id)
    : [question.id, ...hfqState.wrong.filter((id) => id !== question.id)];
  hfqSaveState();
  hfUpdateChrome();
}

function hfUpdateChrome() {
  const solved = hfSolvedCount();
  const percent = hfOverallPercent();
  document.getElementById("hf-sidebar-solved").textContent = solved;
  document.getElementById("hf-sidebar-total").textContent = HF_QUESTIONS.length;
  document.getElementById("hf-sidebar-percent").textContent = `${percent}%`;
  document.getElementById("hf-sidebar-progress-fill").style.width = `${percent}%`;
  document.getElementById("hf-nav-wrong-count").textContent = hfState.wrong.length;
  document.getElementById("hf-total-answered").textContent = hfState.stats.totalAnswered;
  const mastered = Object.values(hfState.shortProgress)
    .filter((item) => item.status === "mastered").length;
  document.getElementById("hf-nav-short-count").textContent = `${mastered}/${HF_SHORT_ANSWERS.length}`;
  const quizCount = document.getElementById("hf-nav-quizzes-count");
  if (quizCount) quizCount.textContent = `${hfqSolvedCount()}/${HFQ_QUESTIONS.length}`;
}

function hfCloseSidebar() {
  document.body.classList.remove("nav-open");
}

function hfRoute() {
  return (window.location.hash.replace(/^#\/?/, "") || "home").split("?")[0];
}

function hfNavigate(route) {
  const hash = `#/${route}`;
  if (window.location.hash === hash) hfHandleRoute();
  else window.location.hash = hash;
}

function hfSetNav(route) {
  let activeRoute = route;
  if (route === "result") activeRoute = "practice";
  if (route === "quiz-practice" || route === "quiz-result") activeRoute = "quizzes";
  document.querySelectorAll("[data-hf-nav]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.hfNav === activeRoute);
  });
  document.getElementById("hf-page-label").textContent = HF_PAGE_LABEL[route] || "学习空间";
}

function hfHandleRoute() {
  hfCloseSidebar();
  const route = hfRoute();
  if (route !== "practice") hfClearAutoAdvance();
  if (route !== "quiz-practice") hfQuizClearAutoAdvance();
  if (route === "result" && !hfSession) {
    window.location.hash = "#/home";
    return;
  }
  if (route === "practice" && !hfSession) {
    hfSession = {
      ids: HF_QUESTIONS.map((question) => question.id),
      index: 0,
      answers: {},
      drafts: {},
      title: "全题库 · 顺序练习",
      mode: "顺序练习",
      startedAt: Date.now()
    };
  }
  if (route === "quiz-result" && !hfQuizSession) {
    window.location.hash = "#/quizzes";
    return;
  }
  if (route === "quiz-practice" && !hfQuizSession) {
    hfQuizSession = {
      ids: HFQ_QUESTIONS.map((question) => question.id),
      index: 0,
      answers: {},
      drafts: {},
      title: "老师测验 · 全部 71 题",
      mode: "全部测验",
      startedAt: Date.now()
    };
  }
  if (route === "short" && !hfShortSession) {
    const firstUnmastered = HF_SHORT_ANSWERS.findIndex(
      (question) => hfState.shortProgress[question.id]?.status !== "mastered"
    );
    hfShortSession = {
      ids: HF_SHORT_ANSWERS.map((question) => question.id),
      index: firstUnmastered >= 0 ? firstUnmastered : 0,
      revealed: new Set(),
      startedAt: Date.now()
    };
  }

  hfSetNav(route);
  hfUpdateChrome();

  if (route === "home") hfRenderHome();
  else if (route === "practice") hfRenderPractice();
  else if (route === "bank") hfRenderBank();
  else if (route === "short") hfRenderShort();
  else if (route === "quizzes") hfqRenderQuizzes();
  else if (route === "quiz-practice") hfqRenderPractice();
  else if (route === "quiz-result") hfqRenderResult();
  else if (route === "wrong") hfRenderWrong();
  else if (route === "result") hfRenderResult();
  else hfRenderHome();

  window.scrollTo({ top: 0, behavior: "auto" });
}

function hfRenderHome() {
  const total = HF_QUESTIONS.length;
  const solved = hfSolvedCount();
  const percent = hfOverallPercent();
  const accuracy = hfAccuracy();
  const todayCount = hfState.stats.todayCount;
  const dailyGoal = 20;
  const dailyPercent = Math.min(100, Math.round((todayCount / dailyGoal) * 100));
  const quizSolved = hfqSolvedCount();
  const quizPercent = hfqOverallPercent();
  const quizWrongCount = hfqState.wrong.length;

  const chapterCards = HF_CHAPTERS.map((chapter, index) => {
    const questions = hfChapterQuestions(chapter);
    const solvedInChapter = hfChapterSolved(chapter);
    return `
      <button class="hf-chapter-card" type="button" data-action="start-chapter" data-chapter="${hfEscape(chapter)}">
        <span class="hf-chapter-num">${String(index + 1).padStart(2, "0")}</span>
        <span class="hf-chapter-copy">
          <strong>${hfEscape(chapter)}</strong>
          <span>${questions.length} 道题 · 已完成 ${solvedInChapter}</span>
        </span>
        ${hfIcon("arrow")}
      </button>
    `;
  }).join("");

  const wrongQuestions = hfState.wrong
    .slice(0, 2)
    .map((id) => HF_QUESTION_BY_ID.get(id))
    .filter(Boolean);
  const wrongMarkup = wrongQuestions.length
    ? wrongQuestions.map((question) => `
        <button class="wrong-preview-item" type="button" data-action="open-question" data-id="${question.id}">
          <span class="wrong-preview-num">${String(HF_QUESTIONS.indexOf(question) + 1).padStart(2, "0")}</span>
          <span class="wrong-preview-copy">
            <strong>${hfEscape(question.question)}</strong>
            <span>${hfEscape(question.chapter)} · ${HF_TYPE_LABEL[question.type]}</span>
          </span>
        </button>
      `).join("")
    : `<p class="empty-mini">还没有错题。先把十二个章节各推进几道。</p>`;

  hfApp.innerHTML = `
    <div class="home-view view-enter hf-home">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">HUMAN FACTORS & AVIATION REGULATIONS</p>
          <h1>把差错链条，<span>逐环拆开。</span></h1>
          <p class="hero-subtitle">从人为因素模型、维修差错到 CCAR 法规，用客观题即时校准概念，用简答题训练完整表述。本课程拥有独立题库、进度和错题记录。</p>
          <div class="hero-actions">
            <button class="button button-primary" type="button" data-action="start-all">${hfIcon("play")} 开始刷题</button>
            <button class="button button-ghost-light" type="button" data-action="start-random">${hfIcon("spark")} 随机 20 题</button>
          </div>
          <div class="hero-meta">
            <span class="hero-meta-item">${hfIcon("layers")}<strong>${total}</strong> 道客观题</span>
            <span class="hero-meta-item">${hfIcon("grid")}<strong>${HF_CHAPTERS.length}</strong> 个章节</span>
            <span class="hero-meta-item">${hfIcon("edit")}<strong>${HF_SHORT_ANSWERS.length}</strong> 道简答</span>
            <span class="hero-meta-item">${hfIcon("check")}独立进度</span>
          </div>
        </div>
        <div class="hero-visual" aria-label="人为因素课程进度">
          <div class="orbit" style="--progress:${percent}">
            <div class="orbit-center">
              <strong>${percent}<small>%</small></strong>
              <span>本课程进度</span>
            </div>
            <span class="orbit-chip orbit-chip-one">${hfIcon("target")} ${solved} / ${total} 已练习</span>
            <span class="orbit-chip orbit-chip-two">${hfIcon("database")} 独立本地进度</span>
          </div>
        </div>
      </section>

      <div class="stat-strip">
        <article class="stat-card">
          <span class="stat-icon tone-teal">${hfIcon("target")}</span>
          <span class="stat-copy"><span>今日完成</span><strong>${todayCount}<small>题</small></strong></span>
        </article>
        <article class="stat-card">
          <span class="stat-icon tone-blue">${hfIcon("chart")}</span>
          <span class="stat-copy"><span>累计正确率</span><strong>${accuracy}<small>%</small></strong></span>
        </article>
        <article class="stat-card">
          <span class="stat-icon tone-amber">${hfIcon("book")}</span>
          <span class="stat-copy"><span>课程章节</span><strong>${HF_CHAPTERS.length}<small>章</small></strong></span>
        </article>
      </div>

      <section class="hfq-home-module">
        <div class="hfq-home-module-mark">${hfIcon("target")}</div>
        <div class="hfq-home-module-copy">
          <span class="mini-label">TEACHER'S TESTS · SEPARATE MODULE</span>
          <h2>老师测验</h2>
          <p>三份课堂测验共 ${HFQ_QUESTIONS.length} 道题，独立进度、独立错题，不混入课程题库。</p>
        </div>
        <div class="hfq-home-module-stats">
          <span><strong>${quizSolved}<small> / ${HFQ_QUESTIONS.length}</small></strong>已完成</span>
          <span><strong>${quizPercent}<small>%</small></strong>模块进度</span>
          <span><strong>${quizWrongCount}</strong>道待复盘</span>
        </div>
        <button class="button button-dark" type="button" data-action="go-quizzes">${hfIcon("arrow")} 进入老师测验</button>
      </section>

      <section class="section">
        <div class="section-heading">
          <div><h2>选择练习模式</h2><p>客观题作答后立即判题，1 秒后自动进入下一题，简答题先作答再展开答案。</p></div>
          <a class="text-link" href="#/bank">查看全部题库 ${hfIcon("arrow")}</a>
        </div>
        <div class="mode-grid">
          <button class="mode-card" type="button" data-action="start-all">
            <span class="mode-arrow">${hfIcon("arrow")}</span><span class="mode-icon">${hfIcon("play")}</span>
            <strong>顺序刷题</strong><p>${total} 道题 · 按十二章节推进</p>
          </button>
          <button class="mode-card" type="button" data-action="start-random">
            <span class="mode-arrow">${hfIcon("arrow")}</span><span class="mode-icon">${hfIcon("spark")}</span>
            <strong>随机抽题</strong><p>20 道混合题 · 快速查漏补缺</p>
          </button>
          <button class="mode-card" type="button" data-action="start-wrong">
            <span class="mode-arrow">${hfIcon("arrow")}</span><span class="mode-icon">${hfIcon("alert")}</span>
            <strong>错题重练</strong><p>${hfState.wrong.length ? `${hfState.wrong.length} 道待复盘` : "暂无错题 · 先热身"}</p>
          </button>
          <button class="mode-card" type="button" data-action="start-short">
            <span class="mode-arrow">${hfIcon("arrow")}</span><span class="mode-icon">${hfIcon("edit")}</span>
            <strong>简答练习</strong><p>${HF_SHORT_ANSWERS.length} 道主观题 · 自评进度</p>
          </button>
        </div>
      </section>

      <div class="workspace-grid">
        <section class="section" style="margin-top:25px">
          <div class="section-heading"><div><h2>按章节练习</h2><p>每章独立统计，适合按课程进度复习。</p></div></div>
          <div class="hf-chapter-grid">${chapterCards}</div>
        </section>
        <aside class="study-side section" style="margin-top:25px">
          <article class="daily-card">
            <p class="daily-label">${hfIcon("flame")} TODAY'S FOCUS</p>
            <h3>今天，再补一环。</h3>
            <p>优先复盘错题，再按章节推进未完成题目；法规数字题建议单独抄写记忆。</p>
            <div class="daily-goal">
              <strong>${todayCount}<small>/ ${dailyGoal} 题</small></strong>
              <span>${dailyPercent}% 完成</span>
            </div>
            <div class="progress-track"><span style="width:${dailyPercent}%"></span></div>
          </article>
          <article class="side-card">
            <div class="side-card-head"><h3>最近错题</h3><span>${hfState.wrong.length} 道待复盘</span></div>
            <div class="wrong-preview">${wrongMarkup}</div>
          </article>
          <article class="hf-rule-card">
            <span class="mini-label">SOURCE & BOUNDARY</span>
            <h3>依据课程学习笔记整理</h3>
            <p>法规题用于课程复习。若笔记与现行 CCAR、任课教师口径不一致，以最新规章和课堂要求为准。</p>
            <a class="text-link" href="output/pdf/人为因素与航空法规_题库.pdf" target="_blank" rel="noopener">打开本课程 PDF 题库 ${hfIcon("arrow")}</a>
          </article>
        </aside>
      </div>
    </div>
  `;
}

function hfqQuestionsForQuiz(quizId) {
  const quiz = HFQ_QUIZ_BY_ID.get(quizId);
  return quiz ? quiz.questions : [];
}

function hfqTypeCounts(questions) {
  return questions.reduce((counts, question) => {
    counts[question.type] = (counts[question.type] || 0) + 1;
    return counts;
  }, { single: 0, multiple: 0, judge: 0 });
}

function hfqQuizStats(quiz) {
  let completed = 0;
  let attempts = 0;
  let correct = 0;
  let wrong = 0;
  quiz.questions.forEach((question) => {
    const progress = hfqState.progress[question.id];
    if (!progress) return;
    completed += 1;
    attempts += progress.attempts || 0;
    correct += progress.correct || 0;
    if (!progress.lastCorrect) wrong += 1;
  });
  return {
    total: quiz.questions.length,
    completed,
    attempts,
    correct,
    wrong,
    percent: quiz.questions.length
      ? Math.round((completed / quiz.questions.length) * 100)
      : 0,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : 0
  };
}

function hfqWrongForQuiz(quizId) {
  return hfqState.wrong
    .map((id) => HFQ_QUESTION_BY_ID.get(id))
    .filter((question) => question && question.quizId === quizId);
}

function hfqRenderQuizzes() {
  const solved = hfqSolvedCount();
  const percent = hfqOverallPercent();
  const accuracy = hfqAccuracy();
  const totalWrong = hfqState.wrong.length;
  const quizCards = HFQ_QUIZZES.map((quiz) => {
    const stats = hfqQuizStats(quiz);
    const counts = hfqTypeCounts(quiz.questions);
    const wrongCount = hfqWrongForQuiz(quiz.id).length;
    const typeSummary = [
      counts.single ? `单选 ${counts.single}` : "",
      counts.multiple ? `多选 ${counts.multiple}` : "",
      counts.judge ? `判断 ${counts.judge}` : ""
    ].filter(Boolean).join(" · ");
    return `
      <article class="hfq-quiz-card">
        <div class="hfq-quiz-card-head">
          <span class="hfq-test-index">TEST ${String(quiz.number).padStart(2, "0")}</span>
          <span class="hfq-score-pill">满分 ${quiz.totalScore}</span>
        </div>
        <h2>${hfEscape(quiz.title)}</h2>
        <p class="hfq-quiz-summary">${typeSummary} · ${quiz.questions.length} 道题</p>
        <div class="progress-track hfq-progress-track"><span style="width:${stats.percent}%"></span></div>
        <div class="hfq-quiz-metrics">
          <span><strong>${stats.completed}</strong><small> / ${stats.total} 已完成</small></span>
          <span><strong>${stats.accuracy}%</strong><small> 累计正确率</small></span>
          <span class="${wrongCount ? "is-warning" : ""}"><strong>${wrongCount}</strong><small> 道待复习</small></span>
        </div>
        <div class="hfq-quiz-actions">
          <button class="button button-dark button-small" type="button" data-action="start-quiz-paper" data-id="${quiz.id}">${hfIcon("play")} 开始本卷</button>
          <button class="button button-outline button-small" type="button" data-action="start-quiz-paper-wrong" data-id="${quiz.id}" ${wrongCount ? "" : "disabled"}>练本卷错题</button>
        </div>
      </article>
    `;
  }).join("");

  hfApp.innerHTML = `
    <div class="quizzes-view view-enter">
      <section class="hfq-module-hero">
        <div class="hfq-module-hero-copy">
          <p class="eyebrow">TEACHER'S TESTS · SEPARATE MODULE</p>
          <h1>老师测验，<span>单独成册。</span></h1>
          <p>三份课堂测验已原样收录。这里使用独立进度、独立错题本和独立练习会话，不会改变课程题库的完成度。</p>
          <div class="hero-actions">
            <button class="button button-primary" type="button" data-action="start-all-quizzes">${hfIcon("play")} 顺序练全部 ${HFQ_QUESTIONS.length} 题</button>
            <button class="button button-ghost-light" type="button" data-action="start-quiz-random">${hfIcon("spark")} 随机 20 题</button>
          </div>
          <div class="hero-meta">
            <span class="hero-meta-item">${hfIcon("book")}<strong>${HFQ_QUIZZES.length}</strong> 份测验</span>
            <span class="hero-meta-item">${hfIcon("layers")}<strong>${HFQ_QUESTIONS.length}</strong> 道题</span>
            <span class="hero-meta-item">${hfIcon("check")}独立进度</span>
          </div>
        </div>
        <div class="hfq-module-orbit" style="--progress:${percent}">
          <div class="hfq-module-orbit-center">
            <strong>${percent}<small>%</small></strong>
            <span>测验模块进度</span>
          </div>
          <span class="hfq-orbit-chip">${hfIcon("target")} ${solved} / ${HFQ_QUESTIONS.length} 已练习</span>
          <span class="hfq-orbit-chip hfq-orbit-chip-bottom">${hfIcon("alert")} ${totalWrong} 道待复盘</span>
        </div>
      </section>

      <div class="stat-strip hfq-stat-strip">
        <article class="stat-card">
          <span class="stat-icon tone-amber">${hfIcon("database")}</span>
          <span class="stat-copy"><span>测验题量</span><strong>${HFQ_QUESTIONS.length}<small>题</small></strong></span>
        </article>
        <article class="stat-card">
          <span class="stat-icon tone-teal">${hfIcon("chart")}</span>
          <span class="stat-copy"><span>累计正确率</span><strong>${accuracy}<small>%</small></strong></span>
        </article>
        <article class="stat-card">
          <span class="stat-icon tone-blue">${hfIcon("alert")}</span>
          <span class="stat-copy"><span>待复习</span><strong>${totalWrong}<small>题</small></strong></span>
        </article>
      </div>

      <section class="section">
        <div class="section-heading">
          <div><h2>按测验练习</h2><p>每份测验按原始顺序和原始分值计分，作答后立即判题。</p></div>
          <span class="meta-pill">3 份 · 每份满分 100</span>
        </div>
        <div class="hfq-quiz-grid">${quizCards}</div>
      </section>

      <section class="hfq-all-practice">
        <div class="hfq-all-practice-copy">
          <span class="hfq-all-practice-icon">${hfIcon("layers")}</span>
          <div>
            <h2>全部测验混合练习</h2>
            <p>三份试卷共 ${HFQ_QUESTIONS.length} 道题，按原始顺序连续作答；结果页按 ${HFQ_QUIZZES.reduce((sum, quiz) => sum + quiz.totalScore, 0)} 分原始总分折算。</p>
          </div>
        </div>
        <div class="hfq-all-practice-actions">
          <button class="button button-dark" type="button" data-action="start-all-quizzes">${hfIcon("play")} 顺序练全部</button>
          <button class="button button-outline" type="button" data-action="start-quiz-wrong" ${totalWrong ? "" : "disabled"}>${hfIcon("alert")} 练测验错题 ${totalWrong ? `(${totalWrong})` : ""}</button>
        </div>
      </section>

      <div class="hf-source-banner">
        ${hfIcon("alert")}
        <div><strong>题库来源与边界：</strong>题目与答案来自任课老师发布的三份测验 Excel。原表未提供官方答案解析，练习页只显示原答案并提示以课堂讲解为准；本模块不与课程题库、简答题或健康监测进度混算。</div>
      </div>
    </div>
  `;
}

function hfqSessionStats() {
  if (!hfQuizSession) {
    return {
      answered: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      scoreEarned: 0,
      scoreTotal: 0,
      scorePercent: 0
    };
  }
  const answers = Object.values(hfQuizSession.answers);
  const correct = answers.filter((answer) => answer.correct).length;
  const scoreTotal = hfQuizSession.ids.reduce((sum, id) => {
    const question = HFQ_QUESTION_BY_ID.get(id);
    return sum + (question ? question.score : 0);
  }, 0);
  const scoreEarned = answers.reduce((sum, answer) => sum + (answer.correct ? answer.score : 0), 0);
  return {
    answered: answers.length,
    correct,
    wrong: answers.length - correct,
    accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0,
    scoreEarned,
    scoreTotal,
    scorePercent: scoreTotal ? Math.round((scoreEarned / scoreTotal) * 100) : 0
  };
}

function hfqRenderPractice() {
  if (!hfQuizSession || !hfQuizSession.ids.length) {
    hfNavigate("quizzes");
    return;
  }
  const question = HFQ_QUESTION_BY_ID.get(hfQuizSession.ids[hfQuizSession.index]);
  if (!question) {
    hfNavigate("quizzes");
    return;
  }

  const answer = hfQuizSession.answers[question.id];
  const draft = hfQuizSession.drafts[question.id] || [];
  const stats = hfqSessionStats();
  const isLast = hfQuizSession.index === hfQuizSession.ids.length - 1;
  const progress = Math.round(((hfQuizSession.index + 1) / hfQuizSession.ids.length) * 100);
  const typeClass = question.type === "multiple" ? "multiple" : question.type === "judge" ? "judge" : "";
  const quiz = HFQ_QUIZ_BY_ID.get(question.quizId);

  const optionsMarkup = question.options.map((option) => {
    const isAnswered = Boolean(answer);
    const isCorrectOption = question.answer.includes(option.key);
    const isSelected = isAnswered ? answer.selected.includes(option.key) : draft.includes(option.key);
    let stateClass = "";
    let resultIcon = "";
    if (isAnswered) {
      if (isCorrectOption) {
        stateClass = " is-correct";
        resultIcon = hfIcon("check");
      } else if (isSelected) {
        stateClass = " is-wrong";
        resultIcon = hfIcon("x");
      }
    } else if (isSelected) {
      stateClass = " is-selected";
      resultIcon = hfIcon("check");
    }
    return `
      <button class="option${stateClass}" type="button" data-action="choose-quiz-option" data-key="${option.key}" ${isAnswered ? "disabled" : ""}>
        <span class="option-key">${option.key}</span>
        <span class="option-text">${hfEscape(option.text)}</span>
        <span class="option-mark">${resultIcon}</span>
      </button>
    `;
  }).join("");

  const feedbackMarkup = answer ? `
    <section class="feedback${answer.correct ? "" : " is-wrong"}" tabindex="-1" aria-live="polite">
      <div class="feedback-head">
        <span class="feedback-icon">${answer.correct ? hfIcon("check") : hfIcon("x")}</span>
        <span class="feedback-title">
          <strong>${answer.correct ? "回答正确" : "再想一步"}</strong>
          <span>${answer.correct ? `本题得 ${question.score} 分，继续下一题。` : "正确答案已在选项中标出。"}</span>
        </span>
      </div>
      <div class="answer-line">
        <span>正确答案</span>
        ${question.answer.map((key) => `<span class="answer-key">${key}</span>`).join("")}
        <span>· ${question.answer.map((key) => {
          const option = question.options.find((item) => item.key === key);
          return option ? hfEscape(option.text) : key;
        }).join("；")}</span>
      </div>
      <p class="explanation-text">${question.explanation
        ? hfEscape(question.explanation)
        : "原表未提供官方答案解析，请以课堂讲解和老师口径为准。"}</p>
      <p class="auto-advance-note">${isLast ? "1 秒后进入本轮测验结果" : "1 秒后自动进入下一题"}</p>
      <div class="feedback-foot">
        <span class="feedback-source">来源：${hfEscape(question.source)} · 第 ${question.number} 题</span>
        <span class="feedback-tags"><span>原始分值 ${question.score} 分</span><span>${HF_TYPE_LABEL[question.type]}</span></span>
      </div>
    </section>
  ` : "";

  const mapMarkup = hfQuizSession.ids.map((id, index) => {
    const itemAnswer = hfQuizSession.answers[id];
    const classes = [
      "map-button",
      itemAnswer ? (itemAnswer.correct ? "is-correct" : "is-wrong") : "",
      index === hfQuizSession.index ? "is-current" : ""
    ].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-action="jump-quiz-question" data-index="${index}" aria-label="第 ${index + 1} 题">${index + 1}</button>`;
  }).join("");

  hfApp.innerHTML = `
    <div class="practice-view view-enter">
      <div class="practice-head">
        <div class="practice-title-row">
          <button class="back-button" type="button" data-action="exit-quiz" aria-label="返回老师测验">${hfIcon("left")}</button>
          <div><h1>${hfEscape(hfQuizSession.title)}</h1><p>共 ${hfQuizSession.ids.length} 题 · 原始分值计分 · 独立进度自动保存</p></div>
        </div>
        <span class="mode-badge">${hfEscape(hfQuizSession.mode)}</span>
      </div>
      <div class="practice-layout">
        <section class="quiz-card">
          <div class="quiz-topline">
            <div class="quiz-meta">
              <span class="type-tag ${typeClass}">${HF_TYPE_LABEL[question.type]}</span>
              <span class="category-tag" style="--cat-color:#a9792e;--cat-soft:#fff2dc">${hfEscape(quiz ? quiz.title : "老师测验")}</span>
              <span class="difficulty-tag">原始 ${question.score} 分</span>
            </div>
            <span class="quiz-index"><strong>${String(hfQuizSession.index + 1).padStart(2, "0")}</strong> / ${String(hfQuizSession.ids.length).padStart(2, "0")}</span>
          </div>
          <div class="quiz-progress"><span style="width:${progress}%"></span></div>
          <div class="question-heading">
            <span class="question-number">${hfQuizSession.index + 1}</span>
            <h2>${hfEscape(question.question)}</h2>
          </div>
          <p class="option-hint">${question.type === "multiple" ? "多选题：选择全部正确项后提交，提交后 1 秒自动进入下一题。" : "点击一个选项后立即查看答案，1 秒后自动进入下一题。"}</p>
          <div class="option-list">${optionsMarkup}</div>
          ${question.type === "multiple" && !answer ? `
            <div class="multi-actions">
              <p>${draft.length ? `已选择 ${draft.length} 项` : "尚未选择选项"}</p>
              <button class="button button-dark button-small" type="button" data-action="submit-quiz-multi" ${draft.length ? "" : "disabled"}>提交答案 ${hfIcon("check")}</button>
            </div>
          ` : ""}
          ${feedbackMarkup}
          <div class="quiz-footer">
            <div class="quiz-footer-left"><span class="keyboard-hint">${question.type === "multiple" ? "可选择多项后提交" : "点击选项即判题 · 1 秒后自动下一题"}</span></div>
            <div class="quiz-footer-right">
              <button class="button button-outline button-small" type="button" data-action="previous-quiz-question" ${hfQuizSession.index === 0 ? "disabled" : ""}>${hfIcon("left")} 上一题</button>
              <button class="button button-dark button-small" type="button" data-action="next-quiz-question">${isLast ? "完成测验" : "下一题"} ${hfIcon("right")}</button>
            </div>
          </div>
        </section>
        <aside class="practice-aside">
          <section class="session-card">
            <div class="session-card-head"><h3>本轮测验</h3><span>${stats.answered} / ${hfQuizSession.ids.length}</span></div>
            <div class="session-stats">
              <div class="session-stat"><strong>${stats.answered}</strong><span>已答</span></div>
              <div class="session-stat"><strong>${stats.correct}</strong><span>正确</span></div>
              <div class="session-stat"><strong>${stats.scoreEarned}<small>/${stats.scoreTotal}</small></strong><span>原始得分</span></div>
            </div>
            <div class="map-label"><strong>题目导航</strong><span>点击跳转</span></div>
            <div class="question-map hfq-question-map">${mapMarkup}</div>
            <div class="map-legend">
              <span class="legend-item"><span class="legend-dot"></span>未答</span>
              <span class="legend-item"><span class="legend-dot correct"></span>正确</span>
              <span class="legend-item"><span class="legend-dot wrong"></span>错误</span>
            </div>
          </section>
          <button class="session-exit" type="button" data-action="exit-quiz">${hfIcon("left")} 退出并返回老师测验</button>
          <section class="legend-card"><p><strong>独立测验模块</strong><br>这里的题目、进度和错题只保存在老师测验，不计入课程题库与健康监测进度。</p></section>
        </aside>
      </div>
    </div>
  `;
}

function hfqChooseOption(key) {
  if (!hfQuizSession) return;
  const question = HFQ_QUESTION_BY_ID.get(hfQuizSession.ids[hfQuizSession.index]);
  if (!question || hfQuizSession.answers[question.id]) return;
  if (question.type === "multiple") {
    const draft = hfQuizSession.drafts[question.id] || [];
    hfQuizSession.drafts[question.id] = draft.includes(key)
      ? draft.filter((item) => item !== key)
      : [...draft, key];
    hfqRenderPractice();
    return;
  }
  hfqSubmitAnswer([key]);
}

function hfQuizClearAutoAdvance() {
  if (hfQuizAutoAdvanceTimer !== null) {
    clearTimeout(hfQuizAutoAdvanceTimer);
    hfQuizAutoAdvanceTimer = null;
  }
}

function hfqScheduleAutoAdvance(questionId, questionIndex) {
  hfQuizClearAutoAdvance();
  hfQuizAutoAdvanceTimer = setTimeout(() => {
    hfQuizAutoAdvanceTimer = null;
    if (!hfQuizSession || hfQuizSession.index !== questionIndex) return;
    if (hfQuizSession.ids[hfQuizSession.index] !== questionId) return;
    hfqMoveQuestion(1);
  }, 1000);
}

function hfqSubmitCurrentMultiple() {
  if (!hfQuizSession) return;
  const question = HFQ_QUESTION_BY_ID.get(hfQuizSession.ids[hfQuizSession.index]);
  if (!question || question.type !== "multiple") return;
  const draft = hfQuizSession.drafts[question.id] || [];
  if (!draft.length) {
    hfToast("请先选择至少一个选项");
    return;
  }
  hfqSubmitAnswer(draft);
}

function hfqSubmitAnswer(selected) {
  if (!hfQuizSession) return;
  const question = HFQ_QUESTION_BY_ID.get(hfQuizSession.ids[hfQuizSession.index]);
  if (!question || hfQuizSession.answers[question.id]) return;
  const normalized = [...new Set(selected)].sort();
  const expected = [...question.answer].sort();
  const correct = normalized.length === expected.length
    && normalized.every((key, index) => key === expected[index]);
  hfQuizSession.answers[question.id] = {
    selected: normalized,
    correct,
    score: correct ? question.score : 0
  };
  hfqRecordAnswer(question, normalized, correct);
  hfqRenderPractice();
  hfqScheduleAutoAdvance(question.id, hfQuizSession.index);
  requestAnimationFrame(() => {
    const feedback = hfApp.querySelector(".feedback");
    if (!feedback) return;
    feedback.focus({ preventScroll: true });
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function hfqMoveQuestion(direction) {
  if (!hfQuizSession) return;
  hfQuizClearAutoAdvance();
  if (direction > 0 && hfQuizSession.index === hfQuizSession.ids.length - 1) {
    hfNavigate("quiz-result");
    return;
  }
  hfQuizSession.index = Math.max(
    0,
    Math.min(hfQuizSession.ids.length - 1, hfQuizSession.index + direction)
  );
  hfqRenderPractice();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hfqJumpQuestion(index) {
  if (!hfQuizSession) return;
  hfQuizClearAutoAdvance();
  const nextIndex = Number(index);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= hfQuizSession.ids.length) return;
  hfQuizSession.index = nextIndex;
  hfqRenderPractice();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hfqStartQuiz(ids, title, mode) {
  hfQuizClearAutoAdvance();
  const uniqueIds = [...new Set(ids)].filter((id) => HFQ_QUESTION_BY_ID.has(id));
  if (!uniqueIds.length) {
    hfToast("老师测验中还没有可练习的题目");
    return;
  }
  hfQuizSession = {
    ids: uniqueIds,
    index: 0,
    answers: {},
    drafts: {},
    title,
    mode,
    startedAt: Date.now()
  };
  if (hfRoute() === "quiz-practice") hfqRenderPractice();
  else hfNavigate("quiz-practice");
}

function hfqStartQuizPaper(quizId, mode = "顺序练习") {
  const quiz = HFQ_QUIZ_BY_ID.get(quizId);
  if (!quiz) {
    hfToast("没有找到这份测验");
    return;
  }
  hfqStartQuiz(
    quiz.questions.map((question) => question.id),
    `${quiz.title} · ${mode}`,
    mode
  );
}

function hfqRenderResult() {
  if (!hfQuizSession) {
    hfNavigate("quizzes");
    return;
  }
  const stats = hfqSessionStats();
  const total = hfQuizSession.ids.length;
  const resultTitle = stats.answered === 0
    ? "这一轮还没有作答。"
    : stats.scorePercent >= 90
      ? "这份测验，答得很稳。"
      : stats.scorePercent >= 70
        ? "基本稳住了，再复盘错题。"
        : "错题值得再走一遍。";
  const wrongIds = Object.entries(hfQuizSession.answers)
    .filter(([, answer]) => !answer.correct)
    .map(([id]) => id);
  hfApp.innerHTML = `
    <div class="result-view view-enter">
      <section class="result-card">
        <div class="result-mark">${hfIcon(stats.scorePercent >= 70 ? "check" : "chart")}</div>
        <p class="result-eyebrow">TEACHER'S TEST · SESSION COMPLETE</p>
        <h1>${resultTitle}</h1>
        <p class="result-subtitle">得分按原始分值计算；本次测验的错题只归档在“老师测验”模块。</p>
        <div class="result-score"><strong>${stats.scorePercent}<small>%</small></strong><span>本轮得分率 · ${stats.scoreEarned} / ${stats.scoreTotal}</span></div>
        <div class="result-grid">
          <div class="result-stat"><span>已作答</span><strong>${stats.answered}<small> / ${total}</small></strong></div>
          <div class="result-stat"><span>答对</span><strong>${stats.correct}</strong></div>
          <div class="result-stat"><span>答错</span><strong>${stats.wrong}</strong></div>
        </div>
        <div class="result-actions">
          <button class="button button-dark" type="button" data-action="restart-quiz-session">${hfIcon("play")} 再练一轮</button>
          ${wrongIds.length ? `<button class="button button-outline" type="button" data-action="retry-quiz-session-wrong">${hfIcon("alert")} 重练本轮错题</button>` : ""}
          <button class="button button-outline" type="button" data-action="go-quizzes">${hfIcon("layers")} 返回老师测验</button>
        </div>
      </section>
    </div>
  `;
}

function hfSessionStats() {
  if (!hfSession) return { answered: 0, correct: 0, wrong: 0, accuracy: 0 };
  const answers = Object.values(hfSession.answers);
  const correct = answers.filter((answer) => answer.correct).length;
  return {
    answered: answers.length,
    correct,
    wrong: answers.length - correct,
    accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0
  };
}

function hfRenderPractice() {
  if (!hfSession || !hfSession.ids.length) {
    hfNavigate("home");
    return;
  }
  const question = HF_QUESTION_BY_ID.get(hfSession.ids[hfSession.index]);
  if (!question) {
    hfNavigate("home");
    return;
  }

  const answer = hfSession.answers[question.id];
  const draft = hfSession.drafts[question.id] || [];
  const stats = hfSessionStats();
  const isLast = hfSession.index === hfSession.ids.length - 1;
  const progress = Math.round(((hfSession.index + 1) / hfSession.ids.length) * 100);
  const typeClass = question.type === "multiple" ? "multiple" : question.type === "judge" ? "judge" : "";
  const chapterNumber = HF_CHAPTERS.indexOf(question.chapter) + 1;

  const optionsMarkup = question.options.map((option) => {
    const isAnswered = Boolean(answer);
    const isCorrectOption = question.answer.includes(option.key);
    const isSelected = isAnswered ? answer.selected.includes(option.key) : draft.includes(option.key);
    let stateClass = "";
    let resultIcon = "";
    if (isAnswered) {
      if (isCorrectOption) {
        stateClass = " is-correct";
        resultIcon = hfIcon("check");
      } else if (isSelected) {
        stateClass = " is-wrong";
        resultIcon = hfIcon("x");
      }
    } else if (isSelected) {
      stateClass = " is-selected";
      resultIcon = hfIcon("check");
    }
    return `
      <button class="option${stateClass}" type="button" data-action="choose-option" data-key="${option.key}" ${isAnswered ? "disabled" : ""}>
        <span class="option-key">${option.key}</span>
        <span class="option-text">${hfEscape(option.text)}</span>
        <span class="option-mark">${resultIcon}</span>
      </button>
    `;
  }).join("");

  const feedbackMarkup = answer ? `
    <section class="feedback${answer.correct ? "" : " is-wrong"}" tabindex="-1" aria-live="polite">
      <div class="feedback-head">
        <span class="feedback-icon">${answer.correct ? hfIcon("check") : hfIcon("x")}</span>
        <span class="feedback-title">
          <strong>${answer.correct ? "回答正确" : "再想一步"}</strong>
          <span>${answer.correct ? "判断准确，继续下一题。" : "正确答案已在选项中标出。"}</span>
        </span>
      </div>
      <div class="answer-line">
        <span>正确答案</span>
        ${question.answer.map((key) => `<span class="answer-key">${key}</span>`).join("")}
        <span>· ${question.answer.map((key) => {
          const option = question.options.find((item) => item.key === key);
          return option ? hfEscape(option.text) : key;
        }).join("；")}</span>
      </div>
      <p class="explanation-text">${hfEscape(question.explanation)}</p>
      <p class="auto-advance-note">${hfSession.index === hfSession.ids.length - 1 ? "1 秒后进入本轮结果" : "1 秒后自动进入下一题"}</p>
      <div class="feedback-foot">
        <span class="feedback-source">来源：${hfEscape(question.source)}</span>
        <span class="feedback-tags">${question.tags.map((tag) => `<span>${hfEscape(tag)}</span>`).join("")}</span>
      </div>
    </section>
  ` : "";

  const mapMarkup = hfSession.ids.map((id, index) => {
    const itemAnswer = hfSession.answers[id];
    const classes = [
      "map-button",
      itemAnswer ? (itemAnswer.correct ? "is-correct" : "is-wrong") : "",
      index === hfSession.index ? "is-current" : ""
    ].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-action="jump-question" data-index="${index}" aria-label="第 ${index + 1} 题">${index + 1}</button>`;
  }).join("");

  hfApp.innerHTML = `
    <div class="practice-view view-enter">
      <div class="practice-head">
        <div class="practice-title-row">
          <button class="back-button" type="button" data-action="exit-practice" aria-label="返回概览">${hfIcon("left")}</button>
          <div><h1>${hfEscape(hfSession.title)}</h1><p>共 ${hfSession.ids.length} 题 · 即时解析 · 独立进度自动保存</p></div>
        </div>
        <span class="mode-badge">${hfEscape(hfSession.mode)}</span>
      </div>
      <div class="practice-layout">
        <section class="quiz-card">
          <div class="quiz-topline">
            <div class="quiz-meta">
              <span class="type-tag ${typeClass}">${HF_TYPE_LABEL[question.type]}</span>
              <span class="category-tag" style="--cat-color:#a9792e;--cat-soft:#fff2dc">第 ${chapterNumber} 章</span>
              <span class="difficulty-tag">${hfEscape(question.difficulty)}</span>
            </div>
            <span class="quiz-index"><strong>${String(hfSession.index + 1).padStart(2, "0")}</strong> / ${String(hfSession.ids.length).padStart(2, "0")}</span>
          </div>
          <div class="quiz-progress"><span style="width:${progress}%"></span></div>
          <div class="question-heading">
            <span class="question-number">${hfSession.index + 1}</span>
            <h2>${hfEscape(question.question)}</h2>
          </div>
          <p class="option-hint">${question.type === "multiple" ? "多选题：选择全部正确项后提交，提交后 1 秒自动进入下一题。" : "点击一个选项后立即查看答案与解析，1 秒后自动进入下一题。"}</p>
          <div class="option-list">${optionsMarkup}</div>
          ${question.type === "multiple" && !answer ? `
            <div class="multi-actions">
              <p>${draft.length ? `已选择 ${draft.length} 项` : "尚未选择选项"}</p>
              <button class="button button-dark button-small" type="button" data-action="submit-multi" ${draft.length ? "" : "disabled"}>提交答案 ${hfIcon("check")}</button>
            </div>
          ` : ""}
          ${feedbackMarkup}
          <div class="quiz-footer">
            <div class="quiz-footer-left"><span class="keyboard-hint">${question.type === "multiple" ? "可选择多项后提交" : "点击选项即判题 · 1 秒后自动下一题"}</span></div>
            <div class="quiz-footer-right">
              <button class="button button-outline button-small" type="button" data-action="previous-question" ${hfSession.index === 0 ? "disabled" : ""}>${hfIcon("left")} 上一题</button>
              <button class="button button-dark button-small" type="button" data-action="next-question">${isLast ? "完成练习" : "下一题"} ${hfIcon("right")}</button>
            </div>
          </div>
        </section>
        <aside class="practice-aside">
          <section class="session-card">
            <div class="session-card-head"><h3>本轮进度</h3><span>${stats.answered} / ${hfSession.ids.length}</span></div>
            <div class="session-stats">
              <div class="session-stat"><strong>${stats.answered}</strong><span>已答</span></div>
              <div class="session-stat"><strong>${stats.correct}</strong><span>正确</span></div>
              <div class="session-stat"><strong>${stats.accuracy}%</strong><span>正确率</span></div>
            </div>
            <div class="map-label"><strong>题目导航</strong><span>点击跳转</span></div>
            <div class="question-map">${mapMarkup}</div>
            <div class="map-legend">
              <span class="legend-item"><span class="legend-dot"></span>未答</span>
              <span class="legend-item"><span class="legend-dot correct"></span>正确</span>
              <span class="legend-item"><span class="legend-dot wrong"></span>错误</span>
            </div>
          </section>
          <button class="session-exit" type="button" data-action="exit-practice">${hfIcon("left")} 退出并返回概览</button>
          <section class="legend-card"><p><strong>独立课程空间</strong><br>本页面的题目、错题和简答自评只保存在人为因素课程，不会影响健康监测题库。</p></section>
        </aside>
      </div>
    </div>
  `;
}

function hfChooseOption(key) {
  if (!hfSession) return;
  const question = HF_QUESTION_BY_ID.get(hfSession.ids[hfSession.index]);
  if (!question || hfSession.answers[question.id]) return;
  if (question.type === "multiple") {
    const draft = hfSession.drafts[question.id] || [];
    hfSession.drafts[question.id] = draft.includes(key)
      ? draft.filter((item) => item !== key)
      : [...draft, key];
    hfRenderPractice();
    return;
  }
  hfSubmitAnswer([key]);
}

function hfClearAutoAdvance() {
  if (hfAutoAdvanceTimer !== null) {
    clearTimeout(hfAutoAdvanceTimer);
    hfAutoAdvanceTimer = null;
  }
}

function hfScheduleAutoAdvance(questionId, questionIndex) {
  hfClearAutoAdvance();
  hfAutoAdvanceTimer = setTimeout(() => {
    hfAutoAdvanceTimer = null;
    if (!hfSession || hfSession.index !== questionIndex) return;
    if (hfSession.ids[hfSession.index] !== questionId) return;
    hfMoveQuestion(1);
  }, 1000);
}

function hfSubmitCurrentMultiple() {
  if (!hfSession) return;
  const question = HF_QUESTION_BY_ID.get(hfSession.ids[hfSession.index]);
  if (!question || question.type !== "multiple") return;
  const draft = hfSession.drafts[question.id] || [];
  if (!draft.length) {
    hfToast("请先选择至少一个选项");
    return;
  }
  hfSubmitAnswer(draft);
}

function hfSubmitAnswer(selected) {
  if (!hfSession) return;
  const question = HF_QUESTION_BY_ID.get(hfSession.ids[hfSession.index]);
  if (!question || hfSession.answers[question.id]) return;
  const normalized = [...new Set(selected)].sort();
  const expected = [...question.answer].sort();
  const correct = normalized.length === expected.length
    && normalized.every((key, index) => key === expected[index]);
  hfSession.answers[question.id] = { selected: normalized, correct };
  hfRecordAnswer(question, normalized, correct);
  hfRenderPractice();
  hfScheduleAutoAdvance(question.id, hfSession.index);
  requestAnimationFrame(() => {
    const feedback = hfApp.querySelector(".feedback");
    if (!feedback) return;
    feedback.focus({ preventScroll: true });
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function hfMoveQuestion(direction) {
  if (!hfSession) return;
  hfClearAutoAdvance();
  if (direction > 0 && hfSession.index === hfSession.ids.length - 1) {
    hfNavigate("result");
    return;
  }
  hfSession.index = Math.max(0, Math.min(hfSession.ids.length - 1, hfSession.index + direction));
  hfRenderPractice();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hfJumpQuestion(index) {
  if (!hfSession) return;
  hfClearAutoAdvance();
  const nextIndex = Number(index);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= hfSession.ids.length) return;
  hfSession.index = nextIndex;
  hfRenderPractice();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hfStartPractice(ids, title, mode) {
  hfClearAutoAdvance();
  const uniqueIds = [...new Set(ids)].filter((id) => HF_QUESTION_BY_ID.has(id));
  if (!uniqueIds.length) {
    hfToast("这里还没有可练习的题目");
    return;
  }
  hfSession = {
    ids: uniqueIds,
    index: 0,
    answers: {},
    drafts: {},
    title,
    mode,
    startedAt: Date.now()
  };
  if (hfRoute() === "practice") hfRenderPractice();
  else hfNavigate("practice");
}

function hfRenderResult() {
  if (!hfSession) {
    hfNavigate("home");
    return;
  }
  const stats = hfSessionStats();
  const total = hfSession.ids.length;
  const resultTitle = stats.answered === 0
    ? "这一轮还没有落笔。"
    : stats.accuracy >= 80
      ? "这一轮，稳住了。"
      : "再复盘一下，会更稳。";
  const wrongIds = Object.entries(hfSession.answers)
    .filter(([, answer]) => !answer.correct)
    .map(([id]) => id);
  hfApp.innerHTML = `
    <div class="result-view view-enter">
      <section class="result-card">
        <div class="result-mark">${hfIcon(stats.accuracy >= 80 ? "check" : "chart")}</div>
        <p class="result-eyebrow">HUMAN FACTORS · SESSION COMPLETE</p>
        <h1>${resultTitle}</h1>
        <p class="result-subtitle">本课程错题已单独归档，不会进入健康监测课程。</p>
        <div class="result-score"><strong>${stats.accuracy}<small>%</small></strong><span>本轮正确率</span></div>
        <div class="result-grid">
          <div class="result-stat"><span>已作答</span><strong>${stats.answered}<small> / ${total}</small></strong></div>
          <div class="result-stat"><span>答对</span><strong>${stats.correct}</strong></div>
          <div class="result-stat"><span>答错</span><strong>${stats.wrong}</strong></div>
        </div>
        <div class="result-actions">
          <button class="button button-dark" type="button" data-action="restart-session">${hfIcon("play")} 再练一轮</button>
          ${wrongIds.length ? `<button class="button button-outline" type="button" data-action="retry-session-wrong">${hfIcon("alert")} 重练本轮错题</button>` : ""}
          <button class="button button-outline" type="button" data-action="go-home">${hfIcon("home")} 返回概览</button>
        </div>
      </section>
    </div>
  `;
}

function hfFilteredQuestions() {
  const query = hfBankState.query.trim().toLowerCase();
  return HF_QUESTIONS.filter((question) => {
    if (hfBankState.type !== "all" && question.type !== hfBankState.type) return false;
    if (hfBankState.chapter !== "all" && question.chapter !== hfBankState.chapter) return false;
    if (!query) return true;
    return [
      question.question,
      question.chapter,
      question.source,
      question.explanation,
      ...question.tags,
      ...question.options.map((option) => option.text)
    ].join(" ").toLowerCase().includes(query);
  });
}

function hfBankItem(question) {
  const index = HF_QUESTIONS.indexOf(question) + 1;
  const progress = hfState.progress[question.id];
  const status = progress
    ? progress.lastCorrect
      ? `<span class="status-check">${hfIcon("check")} 已答对</span>`
      : `<span class="status-check" style="color:var(--red)">${hfIcon("x")} 待复习</span>`
    : "";
  return `
    <article class="bank-item" data-action="open-question" data-id="${question.id}" tabindex="0" role="button" aria-label="练习：${hfEscape(question.question)}">
      <div class="bank-item-top">
        <span class="type-tag ${question.type === "multiple" ? "multiple" : question.type === "judge" ? "judge" : ""}">${HF_TYPE_LABEL[question.type]}</span>
        <span class="category-tag" style="--cat-color:#a9792e;--cat-soft:#fff2dc">${hfEscape(question.chapter)}</span>
      </div>
      <h3>${hfEscape(question.question)}</h3>
      <div class="bank-item-foot">
        <span class="bank-item-source">Q${String(index).padStart(2, "0")} · ${hfEscape(question.source)}</span>
        <span class="bank-item-status">${status}</span>
      </div>
    </article>
  `;
}

function hfRenderBank() {
  const typeChips = [
    { value: "all", label: "全部" },
    { value: "single", label: "单选" },
    { value: "multiple", label: "多选" },
    { value: "judge", label: "判断" }
  ].map((item) => `<button class="filter-chip${hfBankState.type === item.value ? " is-active" : ""}" type="button" data-action="filter-type" data-value="${item.value}">${item.label}</button>`).join("");
  const chapterChips = [
    { value: "all", label: "全部章节" },
    ...HF_CHAPTERS.map((chapter) => ({ value: chapter, label: chapter.replace(/第.+?章\s*/, "") }))
  ].map((item) => `<button class="filter-chip${hfBankState.chapter === item.value ? " is-active" : ""}" type="button" data-action="filter-chapter" data-value="${hfEscape(item.value)}">${hfEscape(item.label)}</button>`).join("");
  const questions = hfFilteredQuestions();
  hfApp.innerHTML = `
    <div class="bank-view view-enter">
      <div class="page-heading">
        <div><h1>人为因素与航空法规题库</h1><p>${HF_QUESTIONS.length} 道客观题，按课程笔记十二个章节整理；与健康监测题库完全独立。</p></div>
        <div class="page-heading-meta"><span class="meta-pill">${hfSolvedCount()} 道已完成</span><span class="meta-pill">${hfState.wrong.length} 道错题</span></div>
      </div>
      <section class="bank-toolbar">
        <label class="bank-search">
          ${hfIcon("search")}
          <input id="hf-bank-search" type="search" value="${hfEscape(hfBankState.query)}" placeholder="搜索题干、章节、CCAR 编号或知识点" autocomplete="off">
        </label>
        <div class="filter-row">
          <div class="filter-group"><span class="filter-label">题型</span>${typeChips}</div>
          <span class="filter-divider"></span>
          <div class="filter-group"><span class="filter-label">章节</span>${chapterChips}</div>
        </div>
      </section>
      <div class="bank-summary"><span>找到 <strong>${questions.length}</strong> 道题</span><span>点击题目开始单题练习</span></div>
      <div class="bank-list">
        ${questions.length
          ? questions.map(hfBankItem).join("")
          : `<div class="empty-state" style="grid-column:1/-1"><span class="empty-visual">${hfIcon("search")}</span><h2>没有找到匹配的题</h2><p>换一个关键词，或清除筛选后再看看。</p><button class="button button-outline" type="button" data-action="clear-filters">清除筛选</button></div>`}
      </div>
    </div>
  `;
  document.getElementById("hf-bank-search").addEventListener("input", (event) => {
    hfBankState.query = event.target.value;
    hfRenderBank();
    const input = document.getElementById("hf-bank-search");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
}

function hfRenderWrong() {
  const questions = hfState.wrong.map((id) => HF_QUESTION_BY_ID.get(id)).filter(Boolean);
  hfApp.innerHTML = `
    <div class="collection-view view-enter">
      <section class="collection-hero">
        <div>
          <p class="eyebrow">HUMAN FACTORS · WRONG ANSWERS</p>
          <h1>人为因素错题本</h1>
          <p>这里只收录本课程的错题。重练答对后会自动移出，不与健康监测课程共享。</p>
          <div class="collection-actions">
            <button class="button button-dark" type="button" data-action="start-wrong" ${questions.length ? "" : "disabled"}>${hfIcon("play")} 开始重练</button>
            ${questions.length ? `<button class="button button-outline" type="button" data-action="clear-wrong">清空错题本</button>` : ""}
          </div>
        </div>
        <span class="collection-hero-icon">${hfIcon("alert")}</span>
      </section>
      ${questions.length
        ? `<div class="bank-list">${questions.map(hfBankItem).join("")}</div>`
        : `<div class="empty-state"><span class="empty-visual">${hfIcon("check")}</span><h2>错题本是空的</h2><p>先完成一轮练习，答错的题会自动归档到这里。</p><button class="button button-dark" type="button" data-action="start-random">${hfIcon("play")} 随机练 20 题</button></div>`}
    </div>
  `;
}

function hfStartShort() {
  if (!HF_SHORT_ANSWERS.length) {
    hfToast("简答题库还没有内容");
    return;
  }
  const firstUnmastered = HF_SHORT_ANSWERS.findIndex(
    (question) => hfState.shortProgress[question.id]?.status !== "mastered"
  );
  hfShortSession = {
    ids: HF_SHORT_ANSWERS.map((question) => question.id),
    index: firstUnmastered >= 0 ? firstUnmastered : 0,
    revealed: new Set(),
    startedAt: Date.now()
  };
  hfNavigate("short");
}

function hfShortStatus(status) {
  if (status === "mastered") return { label: "已掌握", className: "is-mastered", icon: "check" };
  if (status === "fuzzy") return { label: "还模糊", className: "is-fuzzy", icon: "clock" };
  if (status === "unknown") return { label: "不会", className: "is-unknown", icon: "alert" };
  return { label: "未自评", className: "", icon: "edit" };
}

function hfShortAnswerMarkup(question) {
  const points = question.answer.map((item) => `<li>${hfEscape(item)}</li>`).join("");
  return `
    <section class="short-answer-panel" tabindex="-1" aria-live="polite">
      <div class="short-answer-panel-head">
        <span class="short-answer-kicker">参考答案</span>
        <span class="short-source-badge">课程笔记整理</span>
      </div>
      <div class="short-answer-content">
        <section class="short-answer-section">
          <h3>作答要点</h3>
          <ul class="hf-short-answer-list">${points}</ul>
        </section>
      </div>
      <div class="short-keypoints">
        <span class="short-answer-label">评分关键词</span>
        <div>${question.keyPoints.map((point) => `<span>${hfEscape(point)}</span>`).join("")}</div>
      </div>
      <div class="short-answer-foot">
        <span>来源：${hfEscape(question.chapter)}</span>
        <span>${question.tags.map((tag) => `<b>${hfEscape(tag)}</b>`).join("")}</span>
      </div>
    </section>
  `;
}

function hfRenderShort() {
  if (!hfShortSession) {
    hfStartShort();
    return;
  }
  const question = HF_SHORT_BY_ID.get(hfShortSession.ids[hfShortSession.index]);
  if (!question) {
    hfNavigate("home");
    return;
  }
  const saved = hfState.shortProgress[question.id];
  const status = saved?.status || "";
  const statusMeta = hfShortStatus(status);
  const revealed = hfShortSession.revealed.has(question.id) || Boolean(saved);
  const draft = hfState.shortDrafts[question.id] || "";
  const isLast = hfShortSession.index === hfShortSession.ids.length - 1;
  const progress = Math.round(((hfShortSession.index + 1) / hfShortSession.ids.length) * 100);
  const assessed = Object.values(hfState.shortProgress);
  const mastered = assessed.filter((item) => item.status === "mastered").length;
  const fuzzy = assessed.filter((item) => item.status === "fuzzy").length;
  const unknown = assessed.filter((item) => item.status === "unknown").length;
  const mapMarkup = hfShortSession.ids.map((id, index) => {
    const itemStatus = hfState.shortProgress[id]?.status || "";
    const classes = [
      "map-button",
      itemStatus === "mastered" ? "is-correct" : "",
      itemStatus === "fuzzy" ? "is-fuzzy" : "",
      itemStatus === "unknown" ? "is-wrong" : "",
      index === hfShortSession.index ? "is-current" : ""
    ].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-action="jump-short" data-index="${index}" aria-label="第 ${index + 1} 题">${index + 1}</button>`;
  }).join("");
  const assessmentMarkup = revealed ? `
    <div class="short-assess">
      <div><span class="short-answer-label">这一步掌握了吗？</span><p>自评只影响本课程简答进度，不影响客观题统计。</p></div>
      <div class="short-assess-actions">
        <button class="short-assess-button is-mastered${status === "mastered" ? " is-selected" : ""}" type="button" data-action="assess-short" data-status="mastered">${hfIcon("check")} 掌握</button>
        <button class="short-assess-button is-fuzzy${status === "fuzzy" ? " is-selected" : ""}" type="button" data-action="assess-short" data-status="fuzzy">${hfIcon("clock")} 模糊</button>
        <button class="short-assess-button is-unknown${status === "unknown" ? " is-selected" : ""}" type="button" data-action="assess-short" data-status="unknown">${hfIcon("alert")} 不会</button>
      </div>
    </div>
  ` : "";

  hfApp.innerHTML = `
    <div class="practice-view view-enter short-view">
      <div class="practice-head">
        <div class="practice-title-row">
          <button class="back-button" type="button" data-action="exit-short" aria-label="返回概览">${hfIcon("left")}</button>
          <div><h1>人为因素简答练习</h1><p>共 ${HF_SHORT_ANSWERS.length} 题 · 先作答再展开参考答案 · 独立自评</p></div>
        </div>
        <span class="mode-badge">主观题</span>
      </div>
      <div class="practice-layout">
        <section class="quiz-card short-card">
          <div class="quiz-topline">
            <div class="quiz-meta">
              <span class="type-tag short-type-tag">简答题</span>
              <span class="category-tag" style="--cat-color:#a9792e;--cat-soft:#fff2dc">${hfEscape(question.chapter)}</span>
            </div>
            <span class="quiz-index"><strong>${String(hfShortSession.index + 1).padStart(2, "0")}</strong> / ${String(hfShortSession.ids.length).padStart(2, "0")}</span>
          </div>
          <div class="quiz-progress"><span style="width:${progress}%"></span></div>
          <div class="question-heading short-question-heading">
            <span class="question-number">${hfShortSession.index + 1}</span>
            <h2>${hfEscape(question.question)}</h2>
            <span class="short-status-pill ${statusMeta.className}">${hfIcon(statusMeta.icon)}${statusMeta.label}</span>
          </div>
          <p class="option-hint">先写出定义、分类、区别或规章数字，再展开答案核对。</p>
          <div class="hf-short-meta">${question.tags.map((tag) => `<span>${hfEscape(tag)}</span>`).join("")}</div>
          <label class="short-draft">
            <span>我的作答草稿 <small>不会自动判分，可留空</small></span>
            <textarea data-short-draft="${question.id}" rows="7" placeholder="例如：先写定义，再列分类和区别，最后补充规章数字……">${hfEscape(draft)}</textarea>
          </label>
          ${revealed
            ? hfShortAnswerMarkup(question)
            : `<div class="short-reveal-prompt">${hfIcon("edit")}<div><strong>参考答案先藏在这里</strong><p>写完后展开，对照评分关键词检查漏项。</p></div><button class="button button-dark button-small" type="button" data-action="reveal-short">展开参考答案 ${hfIcon("right")}</button></div>`}
          ${assessmentMarkup}
          <div class="quiz-footer">
            <div class="quiz-footer-left"><span class="keyboard-hint">当前为第 ${hfShortSession.index + 1} / ${hfShortSession.ids.length} 题</span></div>
            <div class="quiz-footer-right">
              <button class="button button-outline button-small" type="button" data-action="previous-short" ${hfShortSession.index === 0 ? "disabled" : ""}>${hfIcon("left")} 上一题</button>
              <button class="button button-dark button-small" type="button" data-action="${isLast ? "finish-short" : "next-short"}">${isLast ? "完成练习" : "下一题"} ${hfIcon("right")}</button>
            </div>
          </div>
        </section>
        <aside class="practice-aside">
          <section class="session-card">
            <div class="session-card-head"><h3>简答进度</h3><span>${mastered + fuzzy + unknown} / ${HF_SHORT_ANSWERS.length} 已自评</span></div>
            <div class="session-stats">
              <div class="session-stat"><strong>${mastered}</strong><span>掌握</span></div>
              <div class="session-stat"><strong>${fuzzy}</strong><span>模糊</span></div>
              <div class="session-stat"><strong>${unknown}</strong><span>不会</span></div>
            </div>
            <div class="map-label"><strong>简答导航</strong><span>点击跳转</span></div>
            <div class="question-map">${mapMarkup}</div>
            <div class="map-legend">
              <span class="legend-item"><span class="legend-dot"></span>未自评</span>
              <span class="legend-item"><span class="legend-dot correct"></span>掌握</span>
              <span class="legend-item"><span class="legend-dot wrong"></span>不会</span>
              <span class="legend-item"><span class="legend-dot fuzzy"></span>模糊</span>
            </div>
          </section>
          <button class="session-exit" type="button" data-action="exit-short">${hfIcon("left")} 返回概览</button>
          <section class="legend-card"><p><strong>两门课完全分开</strong><br>简答自评使用独立存储键，与健康监测的 11 道简答互不影响。</p></section>
        </aside>
      </div>
    </div>
  `;
}

function hfSaveShortDraft(questionId, value) {
  if (!HF_SHORT_BY_ID.has(questionId)) return;
  hfState.shortDrafts[questionId] = value;
  hfSaveState();
}

function hfRevealShort() {
  if (!hfShortSession) return;
  const question = HF_SHORT_BY_ID.get(hfShortSession.ids[hfShortSession.index]);
  if (!question) return;
  hfShortSession.revealed.add(question.id);
  hfRenderShort();
  requestAnimationFrame(() => {
    hfApp.querySelector(".short-answer-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function hfAssessShort(status) {
  if (!hfShortSession) return;
  const question = HF_SHORT_BY_ID.get(hfShortSession.ids[hfShortSession.index]);
  if (!question) return;
  hfState.shortProgress[question.id] = { status, updatedAt: new Date().toISOString() };
  hfShortSession.revealed.add(question.id);
  hfSaveState();
  hfUpdateChrome();
  hfRenderShort();
  hfToast(status === "mastered" ? "已标记为掌握" : status === "fuzzy" ? "已标记为模糊" : "已标记为不会");
}

function hfMoveShort(direction) {
  if (!hfShortSession) return;
  if (direction > 0 && hfShortSession.index === hfShortSession.ids.length - 1) {
    hfNavigate("home");
    hfToast("简答练习已完成");
    return;
  }
  hfShortSession.index = Math.max(0, Math.min(hfShortSession.ids.length - 1, hfShortSession.index + direction));
  hfRenderShort();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hfJumpShort(index) {
  if (!hfShortSession) return;
  const nextIndex = Number(index);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= hfShortSession.ids.length) return;
  hfShortSession.index = nextIndex;
  hfRenderShort();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hfFocusBankSearch() {
  if (hfRoute() !== "bank") {
    window.location.hash = "#/bank";
    setTimeout(() => document.getElementById("hf-bank-search")?.focus(), 80);
  } else {
    document.getElementById("hf-bank-search")?.focus();
  }
}

hfApp.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const value = target.dataset.value;
  const id = target.dataset.id;

  if (action === "start-all") {
    hfStartPractice(HF_QUESTIONS.map((question) => question.id), "全题库 · 顺序练习", "顺序练习");
  } else if (action === "start-random") {
    hfStartPractice(hfShuffle(HF_QUESTIONS.map((question) => question.id)).slice(0, 20), "随机 20 题", "随机练习");
  } else if (action === "start-wrong") {
    hfStartPractice([...hfState.wrong], "人为因素错题重练", "错题模式");
  } else if (action === "start-chapter") {
    const chapter = target.dataset.chapter;
    hfStartPractice(hfChapterQuestions(chapter).map((question) => question.id), `${chapter} · 专项练习`, "章节练习");
  } else if (action === "go-quizzes") {
    hfNavigate("quizzes");
  } else if (action === "start-quiz-paper") {
    hfqStartQuizPaper(id);
  } else if (action === "start-quiz-paper-wrong") {
    const quiz = HFQ_QUIZ_BY_ID.get(id);
    const wrongIds = hfqWrongForQuiz(id).map((question) => question.id);
    if (!quiz || !wrongIds.length) {
      hfToast("本卷暂时没有错题");
      return;
    }
    hfqStartQuiz(wrongIds, `${quiz.title} · 错题重练`, "错题重练");
  } else if (action === "start-all-quizzes") {
    hfqStartQuiz(
      HFQ_QUESTIONS.map((question) => question.id),
      `老师测验 · 全部 ${HFQ_QUESTIONS.length} 题`,
      "全部测验"
    );
  } else if (action === "start-quiz-random") {
    hfqStartQuiz(
      hfShuffle(HFQ_QUESTIONS.map((question) => question.id)).slice(0, 20),
      "老师测验 · 随机 20 题",
      "随机练习"
    );
  } else if (action === "start-quiz-wrong") {
    hfqStartQuiz([...hfqState.wrong], "老师测验 · 错题重练", "错题重练");
  } else if (action === "choose-quiz-option") {
    hfqChooseOption(target.dataset.key);
  } else if (action === "submit-quiz-multi") {
    hfqSubmitCurrentMultiple();
  } else if (action === "previous-quiz-question") {
    hfqMoveQuestion(-1);
  } else if (action === "next-quiz-question") {
    hfqMoveQuestion(1);
  } else if (action === "jump-quiz-question") {
    hfqJumpQuestion(target.dataset.index);
  } else if (action === "exit-quiz") {
    hfNavigate("quizzes");
  } else if (action === "start-short") {
    hfStartShort();
  } else if (action === "choose-option") {
    hfChooseOption(target.dataset.key);
  } else if (action === "submit-multi") {
    hfSubmitCurrentMultiple();
  } else if (action === "previous-question") {
    hfMoveQuestion(-1);
  } else if (action === "next-question") {
    hfMoveQuestion(1);
  } else if (action === "jump-question") {
    hfJumpQuestion(target.dataset.index);
  } else if (action === "exit-practice") {
    hfNavigate("home");
  } else if (action === "open-question") {
    const question = HF_QUESTION_BY_ID.get(id);
    if (question) hfStartPractice([question.id], `${question.chapter} · 单题练习`, "单题练习");
  } else if (action === "filter-type") {
    hfBankState.type = value;
    hfRenderBank();
  } else if (action === "filter-chapter") {
    hfBankState.chapter = value;
    hfRenderBank();
  } else if (action === "clear-filters") {
    hfBankState.query = "";
    hfBankState.type = "all";
    hfBankState.chapter = "all";
    hfRenderBank();
  } else if (action === "clear-wrong") {
    if (window.confirm("确定清空人为因素错题本吗？健康监测错题不会受影响。")) {
      hfState.wrong = [];
      hfSaveState();
      hfUpdateChrome();
      hfRenderWrong();
    }
  } else if (action === "reveal-short") {
    hfRevealShort();
  } else if (action === "assess-short") {
    hfAssessShort(target.dataset.status);
  } else if (action === "previous-short") {
    hfMoveShort(-1);
  } else if (action === "next-short") {
    hfMoveShort(1);
  } else if (action === "jump-short") {
    hfJumpShort(target.dataset.index);
  } else if (action === "exit-short") {
    hfNavigate("home");
  } else if (action === "finish-short") {
    hfNavigate("home");
    hfToast("人为因素简答练习已完成");
  } else if (action === "restart-session") {
    const ids = hfSession ? [...hfSession.ids] : HF_QUESTIONS.map((question) => question.id);
    hfStartPractice(ids, hfSession?.title || "全题库 · 顺序练习", "重新练习");
  } else if (action === "retry-session-wrong") {
    const wrongIds = hfSession
      ? Object.entries(hfSession.answers).filter(([, answer]) => !answer.correct).map(([questionId]) => questionId)
      : [];
    hfStartPractice(wrongIds, "本轮错题重练", "错题模式");
  } else if (action === "restart-quiz-session") {
    const ids = hfQuizSession
      ? [...hfQuizSession.ids]
      : HFQ_QUESTIONS.map((question) => question.id);
    hfqStartQuiz(
      ids,
      hfQuizSession?.title || "老师测验 · 再练一轮",
      "重新练习"
    );
  } else if (action === "retry-quiz-session-wrong") {
    const wrongIds = hfQuizSession
      ? Object.entries(hfQuizSession.answers)
        .filter(([, answer]) => !answer.correct)
        .map(([questionId]) => questionId)
      : [];
    hfqStartQuiz(wrongIds, "老师测验 · 本轮错题重练", "错题重练");
  } else if (action === "go-home") {
    hfNavigate("home");
  }
});

hfApp.addEventListener("input", (event) => {
  const draft = event.target.closest("[data-short-draft]");
  if (!draft) return;
  hfSaveShortDraft(draft.dataset.shortDraft, draft.value);
});

hfApp.addEventListener("keydown", (event) => {
  const target = event.target.closest('[data-action="open-question"]');
  if (!target || event.target !== target) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  const question = HF_QUESTION_BY_ID.get(target.dataset.id);
  if (question) hfStartPractice([question.id], `${question.chapter} · 单题练习`, "单题练习");
});

document.getElementById("hf-menu-button").addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
});
document.getElementById("hf-sidebar-scrim").addEventListener("click", hfCloseSidebar);
document.getElementById("hf-search-trigger").addEventListener("click", hfFocusBankSearch);

document.addEventListener("keydown", (event) => {
  const tagName = event.target.tagName;
  const isTyping = tagName === "INPUT" || tagName === "TEXTAREA" || event.target.isContentEditable;
  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    hfFocusBankSearch();
    return;
  }
  if (event.key === "Escape") {
    hfCloseSidebar();
    return;
  }
  if (!isTyping && hfRoute() === "quiz-practice" && hfQuizSession) {
    const quizQuestion = HFQ_QUESTION_BY_ID.get(hfQuizSession.ids[hfQuizSession.index]);
    if (!quizQuestion) return;
    const quizAnswered = Boolean(hfQuizSession.answers[quizQuestion.id]);
    const quizNumber = Number(event.key);
    if (Number.isInteger(quizNumber) && quizNumber >= 1 && quizNumber <= quizQuestion.options.length) {
      event.preventDefault();
      hfqChooseOption(quizQuestion.options[quizNumber - 1].key);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (quizQuestion.type === "multiple" && !quizAnswered) hfqSubmitCurrentMultiple();
      else hfqMoveQuestion(1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      hfqMoveQuestion(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      hfqMoveQuestion(-1);
    }
    return;
  }
  if (isTyping || hfRoute() !== "practice" || !hfSession) return;
  const question = HF_QUESTION_BY_ID.get(hfSession.ids[hfSession.index]);
  if (!question) return;
  const answered = Boolean(hfSession.answers[question.id]);
  const number = Number(event.key);
  if (Number.isInteger(number) && number >= 1 && number <= question.options.length) {
    event.preventDefault();
    hfChooseOption(question.options[number - 1].key);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    if (question.type === "multiple" && !answered) hfSubmitCurrentMultiple();
    else hfMoveQuestion(1);
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    hfMoveQuestion(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    hfMoveQuestion(-1);
  }
});

window.addEventListener("hashchange", hfHandleRoute);
window.addEventListener("resize", () => {
  if (window.innerWidth > 960) hfCloseSidebar();
});

hfUpdateChrome();
if (!window.location.hash) {
  window.history.replaceState(null, "", "#/home");
}
hfHandleRoute();
