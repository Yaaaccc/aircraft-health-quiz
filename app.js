const QUESTIONS = window.QUESTIONS || [];
const SHORT_ANSWERS = window.SHORT_ANSWERS || [];
const META = window.QUIZ_META || { title: "飞机健康监测与故障诊断", subtitle: "课程复习题库" };
const QUESTION_BY_ID = new Map(QUESTIONS.map((question) => [question.id, question]));
const SHORT_BY_ID = new Map(SHORT_ANSWERS.map((question) => [question.id, question]));
const STORAGE_KEY = "aeroprep-state-v1";

const CATEGORY_META = {
  "传感器与测量": { icon: "gauge", color: "#0d8d7e", soft: "#e1f6f1" },
  "引气系统": { icon: "wind", color: "#bd7420", soft: "#fff0dc" },
  "空调系统": { icon: "snow", color: "#487cd6", soft: "#eaf1ff" },
  "健康监测与 PHM": { icon: "pulse", color: "#725bc2", soft: "#f0ebff" },
  "数据链路与预处理": { icon: "signal", color: "#2c879d", soft: "#e7f6fa" },
  "故障树与可靠性": { icon: "tree", color: "#c25755", soft: "#fdeceb" }
};

const CATEGORY_ORDER = Object.keys(CATEGORY_META);
const TYPE_LABEL = { single: "单选题", multiple: "多选题", judge: "判断题" };
const PAGE_LABEL = {
  home: "今日概览",
  practice: "刷题练习",
  bank: "全部题库",
  short: "简答练习",
  wrong: "错题本",
  favorites: "我的收藏",
  result: "练习结果",
  "human-factors": "人为因素与航空法规"
};

const app = document.getElementById("app");
const toastEl = document.getElementById("toast");
const bankState = { query: "", type: "all", category: "all" };
let session = null;
let shortSession = null;
let toastTimer = null;
let autoAdvanceTimer = null;

function icon(name, className = "") {
  return `<svg${className ? ` class="${className}"` : ""} aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function dateKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dateDifference(from, to) {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  return Math.round(
    (Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86400000
  );
}

function defaultState() {
  return {
    progress: {},
    shortProgress: {},
    shortDrafts: {},
    wrong: [],
    favorites: [],
    stats: {
      totalAnswered: 0,
      totalCorrect: 0,
      streak: 0,
      lastActive: null,
      todayDate: dateKey(),
      todayCount: 0
    }
  };
}

function loadState() {
  const base = defaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return base;
    const merged = {
      ...base,
      ...saved,
      progress: saved.progress && typeof saved.progress === "object" ? saved.progress : {},
      shortProgress: saved.shortProgress && typeof saved.shortProgress === "object"
        ? Object.fromEntries(
          Object.entries(saved.shortProgress).filter(([id]) => SHORT_BY_ID.has(id))
        )
        : {},
      shortDrafts: saved.shortDrafts && typeof saved.shortDrafts === "object"
        ? Object.fromEntries(
          Object.entries(saved.shortDrafts).filter(([id]) => SHORT_BY_ID.has(id))
        )
        : {},
      wrong: Array.isArray(saved.wrong) ? saved.wrong.filter((id) => QUESTION_BY_ID.has(id)) : [],
      favorites: Array.isArray(saved.favorites)
        ? saved.favorites.filter((id) => QUESTION_BY_ID.has(id))
        : [],
      stats: { ...base.stats, ...(saved.stats || {}) }
    };
    if (merged.stats.todayDate !== dateKey()) {
      merged.stats.todayDate = dateKey();
      merged.stats.todayCount = 0;
    }
    return merged;
  } catch {
    return base;
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast("浏览器未能保存本地进度");
  }
}

function solvedCount() {
  return Object.keys(state.progress).length;
}

function overallPercent() {
  return QUESTIONS.length ? Math.round((solvedCount() / QUESTIONS.length) * 100) : 0;
}

function overallAccuracy() {
  if (!state.stats.totalAnswered) return 0;
  return Math.round((state.stats.totalCorrect / state.stats.totalAnswered) * 100);
}

function currentStreak() {
  if (!state.stats.lastActive) return 0;
  const difference = dateDifference(state.stats.lastActive, dateKey());
  return difference <= 1 ? state.stats.streak : 0;
}

function categoryQuestions(category) {
  return QUESTIONS.filter((question) => question.category === category);
}

function categorySolved(category) {
  return categoryQuestions(category).filter((question) => state.progress[question.id]).length;
}

function getCategoryMeta(category) {
  return CATEGORY_META[category] || {
    icon: "layers",
    color: "#4c6d73",
    soft: "#eef4f2"
  };
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2400);
}

function recordAnswer(question, selected, correct) {
  const previous = state.progress[question.id] || { attempts: 0, correct: 0 };
  state.progress[question.id] = {
    attempts: previous.attempts + 1,
    correct: previous.correct + (correct ? 1 : 0),
    lastSelected: selected,
    lastCorrect: correct,
    updatedAt: new Date().toISOString()
  };

  state.stats.totalAnswered += 1;
  if (correct) state.stats.totalCorrect += 1;

  if (correct) {
    state.wrong = state.wrong.filter((id) => id !== question.id);
  } else {
    state.wrong = [question.id, ...state.wrong.filter((id) => id !== question.id)];
  }

  const today = dateKey();
  if (state.stats.todayDate !== today) {
    state.stats.todayDate = today;
    state.stats.todayCount = 0;
  }
  state.stats.todayCount += 1;

  if (state.stats.lastActive !== today) {
    const difference = state.stats.lastActive
      ? dateDifference(state.stats.lastActive, today)
      : null;
    state.stats.streak = difference === 1 ? state.stats.streak + 1 : 1;
    state.stats.lastActive = today;
  }

  saveState();
  updateChrome();
}

function updateChrome() {
  const total = QUESTIONS.length;
  const solved = solvedCount();
  const percent = overallPercent();

  document.getElementById("sidebar-solved").textContent = solved;
  document.getElementById("sidebar-total").textContent = total;
  document.getElementById("sidebar-percent").textContent = `${percent}%`;
  document.getElementById("sidebar-progress-fill").style.width = `${percent}%`;
  document.getElementById("nav-wrong-count").textContent = state.wrong.length;
  document.getElementById("nav-favorite-count").textContent = state.favorites.length;
  const mastered = Object.values(state.shortProgress).filter((item) => item.status === "mastered").length;
  const shortCount = document.getElementById("nav-short-count");
  if (shortCount) shortCount.textContent = `${mastered}/${SHORT_ANSWERS.length}`;
  document.getElementById("streak-days").textContent = currentStreak();
}

function setPageLabel(route) {
  document.getElementById("page-label").textContent = PAGE_LABEL[route] || "学习空间";
}

function updateNavigation(route) {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.nav === route);
  });
  const isHumanFactors = route === "human-factors";
  document.querySelectorAll("[data-course]").forEach((link) => {
    const expected = isHumanFactors ? "human-factors" : "health";
    link.classList.toggle("is-active", link.dataset.course === expected);
  });
}

function closeSidebar() {
  document.body.classList.remove("nav-open");
}

function getCurrentRoute() {
  return (window.location.hash.replace(/^#\/?/, "") || "home").split("?")[0];
}

function navigate(route) {
  const nextHash = `#/${route}`;
  if (window.location.hash === nextHash) {
    handleRoute();
  } else {
    window.location.hash = nextHash;
  }
}

function handleRoute() {
  closeSidebar();
  const route = getCurrentRoute();
  if (route !== "practice") clearAutoAdvance();

  if (route === "result" && !session) {
    window.location.hash = "#/home";
    return;
  }

  if (route === "practice" && !session) {
    session = {
      ids: QUESTIONS.map((question) => question.id),
      index: 0,
      answers: {},
      drafts: {},
      title: "全题库 · 顺序练习",
      mode: "顺序练习",
      startedAt: Date.now()
    };
  }

  if (route === "short" && !shortSession) {
    const firstUnmastered = SHORT_ANSWERS.findIndex(
      (question) => state.shortProgress[question.id]?.status !== "mastered"
    );
    shortSession = {
      ids: SHORT_ANSWERS.map((question) => question.id),
      index: firstUnmastered >= 0 ? firstUnmastered : 0,
      revealed: new Set(),
      startedAt: Date.now()
    };
  }

  setPageLabel(route);
  updateNavigation(route);
  updateChrome();

  if (route === "home") renderHome();
  else if (route === "practice") renderPractice();
  else if (route === "bank") renderBankPage();
  else if (route === "short") renderShortPractice();
  else if (route === "wrong") renderCollection("wrong");
  else if (route === "favorites") renderCollection("favorites");
  else if (route === "result") renderResult();
  else if (route === "human-factors") renderHumanFactorsPage();
  else renderHome();

  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderHome() {
  const total = QUESTIONS.length;
  const solved = solvedCount();
  const percent = overallPercent();
  const accuracy = overallAccuracy();
  const streak = currentStreak();
  const todayCount = state.stats.todayCount;
  const dailyGoal = 20;
  const dailyPercent = Math.min(100, Math.round((todayCount / dailyGoal) * 100));
  const dateText = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date());

  const wrongPreview = state.wrong
    .slice(0, 2)
    .map((id) => QUESTION_BY_ID.get(id))
    .filter(Boolean);
  const weakCategory = getWeakestCategory();
  const recommendation = state.wrong.length
    ? `错题集中在「${weakCategory}」，今天优先处理这一块。`
    : solved === 0
      ? "先从传感器与测量热身，建立第一轮知识框架。"
      : "按分类推进未完成题目，别让熟悉的知识点反复占用时间。";

  const categoryCards = CATEGORY_ORDER.map((category) => {
    const meta = getCategoryMeta(category);
    const questions = categoryQuestions(category);
    const solvedInCategory = categorySolved(category);
    const categoryPercent = questions.length
      ? Math.round((solvedInCategory / questions.length) * 100)
      : 0;
    return `
      <button
        class="category-card"
        type="button"
        data-action="start-category"
        data-category="${escapeHTML(category)}"
        style="--cat-color:${meta.color};--cat-soft:${meta.soft}"
      >
        <span class="category-icon">${icon(meta.icon)}</span>
        <span class="category-info">
          <strong>${escapeHTML(category)}</strong>
          <span>${questions.length} 道题 · 已完成 ${categoryPercent}%</span>
        </span>
        <span class="category-count">${icon("arrow")}</span>
      </button>
    `;
  }).join("");

  const wrongPreviewMarkup = wrongPreview.length
    ? wrongPreview.map((question) => `
        <button class="wrong-preview-item" type="button" data-action="open-question" data-id="${question.id}">
          <span class="wrong-preview-num">${String(QUESTIONS.indexOf(question) + 1).padStart(2, "0")}</span>
          <span class="wrong-preview-copy">
            <strong>${escapeHTML(question.question)}</strong>
            <span>${escapeHTML(question.category)} · ${TYPE_LABEL[question.type]}</span>
          </span>
        </button>
      `).join("")
    : `<p class="empty-mini">还没有错题。保持专注，第一轮先把知识框架跑通。</p>`;

  app.innerHTML = `
    <div class="home-view view-enter">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">AIRCRAFT HEALTH · ${escapeHTML(dateText)}</p>
          <h1>把复杂系统，<span>拆成一道题。</span></h1>
          <p class="hero-subtitle">从引气、空调到传感器与 PHM，用短题反复校准知识边界。每次选择后立即查看答案与解析，把复习变成可量化的进度。</p>
          <div class="hero-actions">
            <button class="button button-primary" type="button" data-action="start-all">
              ${icon("play")}
              开始刷题
            </button>
            <button class="button button-ghost-light" type="button" data-action="start-random">
              ${icon("spark")}
              随机 20 题
            </button>
          </div>
          <div class="hero-meta">
            <span class="hero-meta-item">${icon("layers")}<strong>${total}</strong> 道题</span>
            <span class="hero-meta-item">${icon("grid")}<strong>${CATEGORY_ORDER.length}</strong> 个模块</span>
            <span class="hero-meta-item">${icon("edit")}<strong>${SHORT_ANSWERS.length}</strong> 道简答</span>
            <span class="hero-meta-item">${icon("check")}即时判题与解析</span>
          </div>
        </div>
        <div class="hero-visual" aria-label="题库总进度">
          <div class="orbit" style="--progress:${percent}">
            <div class="orbit-center">
              <strong>${percent}<small>%</small></strong>
              <span>题库总进度</span>
            </div>
            <span class="orbit-chip orbit-chip-one">${icon("target")} ${solved} / ${total} 已练习</span>
            <span class="orbit-chip orbit-chip-two">${icon("database")} 本地进度已同步</span>
          </div>
        </div>
      </section>

      <div class="stat-strip">
        <article class="stat-card">
          <span class="stat-icon tone-teal">${icon("target")}</span>
          <span class="stat-copy">
            <span>今日完成</span>
            <strong>${todayCount}<small>题</small></strong>
          </span>
        </article>
        <article class="stat-card">
          <span class="stat-icon tone-blue">${icon("chart")}</span>
          <span class="stat-copy">
            <span>累计正确率</span>
            <strong>${accuracy}<small>%</small></strong>
          </span>
        </article>
        <article class="stat-card">
          <span class="stat-icon tone-amber">${icon("flame")}</span>
          <span class="stat-copy">
            <span>连续学习</span>
            <strong>${streak}<small>天</small></strong>
          </span>
        </article>
      </div>

      <section class="section">
        <div class="section-heading">
          <div>
            <h2>选择练习模式</h2>
            <p>按当前状态进入，不必每次都从头开始。</p>
          </div>
          <a class="text-link" href="#/bank">查看全部题库 ${icon("arrow")}</a>
        </div>
        <div class="mode-grid">
          <button class="mode-card" type="button" data-action="start-all">
            <span class="mode-arrow">${icon("arrow")}</span>
            <span class="mode-icon">${icon("play")}</span>
            <strong>顺序刷题</strong>
            <p>${total} 道题 · 按知识模块推进</p>
          </button>
          <button class="mode-card" type="button" data-action="start-random">
            <span class="mode-arrow">${icon("arrow")}</span>
            <span class="mode-icon">${icon("spark")}</span>
            <strong>随机抽题</strong>
            <p>20 道混合题 · 快速查漏补缺</p>
          </button>
          <button class="mode-card" type="button" data-action="start-wrong">
            <span class="mode-arrow">${icon("arrow")}</span>
            <span class="mode-icon">${icon("alert")}</span>
            <strong>错题重练</strong>
            <p>${state.wrong.length ? `${state.wrong.length} 道待复盘` : "暂无错题 · 先热身"} </p>
          </button>
          <button class="mode-card" type="button" data-action="start-favorites">
            <span class="mode-arrow">${icon("arrow")}</span>
            <span class="mode-icon">${icon("bookmark")}</span>
            <strong>收藏专项</strong>
            <p>${state.favorites.length ? `${state.favorites.length} 道已收藏` : "暂无收藏 · 标记重点题"}</p>
          </button>
          <button class="mode-card mode-card-short" type="button" data-action="start-short">
            <span class="mode-arrow">${icon("arrow")}</span>
            <span class="mode-icon">${icon("edit")}</span>
            <strong>简答练习</strong>
            <p>${SHORT_ANSWERS.length} 道主观题 · 先作答再展开答案</p>
          </button>
        </div>
      </section>

      <div class="workspace-grid">
        <section class="section" style="margin-top:25px">
          <div class="section-heading">
            <div>
              <h2>按知识模块练习</h2>
              <p>每个模块独立计分，适合针对性复盘。</p>
            </div>
          </div>
          <div class="category-grid">${categoryCards}</div>
        </section>

        <aside class="study-side section" style="margin-top:25px">
          <article class="daily-card">
            <p class="daily-label">${icon("flame")} TODAY'S FOCUS</p>
            <h3>今天，再推进一点。</h3>
            <p>${escapeHTML(recommendation)}</p>
            <div class="daily-goal">
              <strong>${todayCount}<small>/ ${dailyGoal} 题</small></strong>
              <span>${dailyPercent}% 完成</span>
            </div>
            <div class="progress-track"><span style="width:${dailyPercent}%"></span></div>
          </article>

          <article class="side-card">
            <div class="side-card-head">
              <h3>最近错题</h3>
              <span>${state.wrong.length} 道待复盘</span>
            </div>
            <div class="wrong-preview">${wrongPreviewMarkup}</div>
          </article>

          <article class="tip-card">
            ${icon("spark")}
            <p><strong>小提示</strong>客观题作答后立即判题，1 秒后自动进入下一题；简答题先写关键词，再展开参考答案并做自评。也可以<a class="text-link" href="output/pdf/飞机健康监测与故障诊断_题库.pdf" target="_blank" rel="noopener">打开 PDF 题库 ${icon("arrow")}</a>。</p>
          </article>
        </aside>
      </div>
    </div>
  `;
}

function getWeakestCategory() {
  if (!state.wrong.length) return CATEGORY_ORDER[0];
  const counts = {};
  state.wrong.forEach((id) => {
    const question = QUESTION_BY_ID.get(id);
    if (question) counts[question.category] = (counts[question.category] || 0) + 1;
  });
  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || CATEGORY_ORDER[0];
}

function startPractice(ids, title, mode) {
  clearAutoAdvance();
  const uniqueIds = [...new Set(ids)].filter((id) => QUESTION_BY_ID.has(id));
  if (!uniqueIds.length) {
    showToast("这里还没有可练习的题目");
    return;
  }
  session = {
    ids: uniqueIds,
    index: 0,
    answers: {},
    drafts: {},
    title,
    mode,
    startedAt: Date.now()
  };
  if (getCurrentRoute() === "practice") {
    renderPractice();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.location.hash = "#/practice";
  }
}

function sessionStats() {
  if (!session) return { answered: 0, correct: 0, wrong: 0, accuracy: 0 };
  const answers = Object.values(session.answers);
  const correct = answers.filter((answer) => answer.correct).length;
  return {
    answered: answers.length,
    correct,
    wrong: answers.length - correct,
    accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0
  };
}

function renderPractice() {
  if (!session || !session.ids.length) {
    navigate("home");
    return;
  }

  const currentQuestion = QUESTION_BY_ID.get(session.ids[session.index]);
  if (!currentQuestion) {
    navigate("home");
    return;
  }

  const categoryMeta = getCategoryMeta(currentQuestion.category);
  const answer = session.answers[currentQuestion.id];
  const draft = session.drafts[currentQuestion.id] || [];
  const stats = sessionStats();
  const isLast = session.index === session.ids.length - 1;
  const progress = Math.round(((session.index + 1) / session.ids.length) * 100);
  const typeClass = currentQuestion.type === "multiple"
    ? "multiple"
    : currentQuestion.type === "judge"
      ? "judge"
      : "";

  const optionsMarkup = currentQuestion.options.map((option) => {
    const isAnswered = Boolean(answer);
    const isCorrectOption = currentQuestion.answer.includes(option.key);
    const isSelected = isAnswered ? answer.selected.includes(option.key) : draft.includes(option.key);
    let stateClass = "";
    let resultIcon = "";
    if (isAnswered) {
      if (isCorrectOption) {
        stateClass = " is-correct";
        resultIcon = icon("check");
      } else if (isSelected) {
        stateClass = " is-wrong";
        resultIcon = icon("x");
      }
    } else if (isSelected) {
      stateClass = " is-selected";
      resultIcon = icon("check");
    }
    return `
      <button
        class="option${stateClass}"
        type="button"
        data-action="choose-option"
        data-key="${option.key}"
        aria-pressed="${isSelected}"
        ${isAnswered ? "disabled" : ""}
      >
        <span class="option-key">${option.key}</span>
        <span class="option-text">${escapeHTML(option.text)}</span>
        <span class="option-mark">${resultIcon}</span>
      </button>
    `;
  }).join("");

  const feedbackMarkup = answer ? `
    <section
      class="feedback${answer.correct ? "" : " is-wrong"}"
      tabindex="-1"
      aria-live="polite"
    >
      <div class="feedback-head">
        <span class="feedback-icon">${answer.correct ? icon("check") : icon("x")}</span>
        <span class="feedback-title">
          <strong>${answer.correct ? "回答正确" : "再想一步"}</strong>
          <span>${answer.correct ? "判断准确，保持这个节奏。" : "正确答案已在选项中标出。"}</span>
        </span>
      </div>
      <div class="answer-line">
        <span>正确答案</span>
        ${currentQuestion.answer.map((key) => `<span class="answer-key">${key}</span>`).join("")}
        <span>· ${currentQuestion.answer.map((key) => {
          const option = currentQuestion.options.find((item) => item.key === key);
          return option ? escapeHTML(option.text) : key;
        }).join("；")}</span>
      </div>
      <p class="explanation-text">${escapeHTML(currentQuestion.explanation)}</p>
      <p class="auto-advance-note">${isLast ? "1 秒后进入本轮结果" : "1 秒后自动进入下一题"}</p>
      <div class="feedback-foot">
        <span class="feedback-source">来源：${escapeHTML(currentQuestion.source)}</span>
        <span class="feedback-tags">${currentQuestion.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</span>
      </div>
    </section>
  ` : "";

  const mapMarkup = session.ids.map((id, index) => {
    const itemAnswer = session.answers[id];
    const classes = [
      "map-button",
      itemAnswer ? (itemAnswer.correct ? "is-correct" : "is-wrong") : "",
      index === session.index ? "is-current" : ""
    ].filter(Boolean).join(" ");
    return `
      <button
        class="${classes}"
        type="button"
        data-action="jump-question"
        data-index="${index}"
        aria-label="第 ${index + 1} 题"
      >${index + 1}</button>
    `;
  }).join("");

  app.innerHTML = `
    <div class="practice-view view-enter">
      <div class="practice-head">
        <div class="practice-title-row">
          <button class="back-button" type="button" data-action="exit-practice" aria-label="返回概览">
            ${icon("left")}
          </button>
          <div>
            <h1>${escapeHTML(session.title)}</h1>
            <p>共 ${session.ids.length} 题 · 即时解析 · 进度自动保存</p>
          </div>
        </div>
        <span class="mode-badge">${escapeHTML(session.mode)}</span>
      </div>

      <div class="practice-layout">
        <section class="quiz-card">
          <div class="quiz-topline">
            <div class="quiz-meta">
              <span class="type-tag ${typeClass}">${TYPE_LABEL[currentQuestion.type]}</span>
              <span
                class="category-tag"
                style="--cat-color:${categoryMeta.color};--cat-soft:${categoryMeta.soft}"
              >${escapeHTML(currentQuestion.category)}</span>
              <span class="difficulty-tag">${escapeHTML(currentQuestion.difficulty)}</span>
            </div>
            <span class="quiz-index"><strong>${String(session.index + 1).padStart(2, "0")}</strong> / ${String(session.ids.length).padStart(2, "0")}</span>
          </div>
          <div class="quiz-progress"><span style="width:${progress}%"></span></div>

          <div class="question-heading">
            <span class="question-number">${session.index + 1}</span>
            <h2>${escapeHTML(currentQuestion.question)}</h2>
            <button
              class="favorite-button${state.favorites.includes(currentQuestion.id) ? " is-active" : ""}"
              type="button"
              data-action="toggle-favorite"
              data-id="${currentQuestion.id}"
              aria-label="${state.favorites.includes(currentQuestion.id) ? "取消收藏" : "收藏此题"}"
            >${icon("star")}</button>
          </div>
          ${currentQuestion.type === "multiple" ? `<p class="option-hint">多选题：选择全部正确项后提交，提交后 1 秒自动进入下一题。</p>` : `<p class="option-hint">点击一个选项后立即查看答案与解析，1 秒后自动进入下一题。</p>`}

          <div class="option-list">${optionsMarkup}</div>

          ${currentQuestion.type === "multiple" && !answer ? `
            <div class="multi-actions">
              <p>${draft.length ? `已选择 ${draft.length} 项` : "尚未选择选项"}</p>
              <button
                class="button button-dark button-small"
                type="button"
                data-action="submit-multi"
                ${draft.length ? "" : "disabled"}
              >提交答案 ${icon("check")}</button>
            </div>
          ` : ""}

          ${feedbackMarkup}

          <div class="quiz-footer">
            <div class="quiz-footer-left">
              <span class="keyboard-hint"><kbd>1</kbd>–<kbd>4</kbd> 选择 · <kbd>Enter</kbd> ${isLast ? "完成" : "下一题"}</span>
            </div>
            <div class="quiz-footer-right">
              <button
                class="button button-outline button-small"
                type="button"
                data-action="previous-question"
                ${session.index === 0 ? "disabled" : ""}
              >${icon("left")} 上一题</button>
              <button class="button button-dark button-small" type="button" data-action="next-question">
                ${isLast ? "完成练习" : "下一题"} ${icon("right")}
              </button>
            </div>
          </div>
        </section>

        <aside class="practice-aside">
          <section class="session-card">
            <div class="session-card-head">
              <h3>本轮进度</h3>
              <span>${stats.answered} / ${session.ids.length}</span>
            </div>
            <div class="session-stats">
              <div class="session-stat"><strong>${stats.answered}</strong><span>已答</span></div>
              <div class="session-stat"><strong>${stats.correct}</strong><span>正确</span></div>
              <div class="session-stat"><strong>${stats.accuracy}%</strong><span>正确率</span></div>
            </div>
            <div class="map-label">
              <strong>题目导航</strong>
              <span>点击跳转</span>
            </div>
            <div class="question-map">${mapMarkup}</div>
            <div class="map-legend">
              <span class="legend-item"><span class="legend-dot"></span>未答</span>
              <span class="legend-item"><span class="legend-dot correct"></span>正确</span>
              <span class="legend-item"><span class="legend-dot wrong"></span>错误</span>
            </div>
          </section>

          <button class="session-exit" type="button" data-action="exit-practice">
            ${icon("left")} 退出并返回概览
          </button>

          <section class="legend-card">
            <p><strong>即时反馈</strong><br>答错的题目会自动进入错题本；重练答对后会自动移出。所有进度仅保存在当前浏览器。</p>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function shortStatusMeta(status) {
  if (status === "mastered") return { label: "已掌握", className: "is-mastered", icon: "check" };
  if (status === "fuzzy") return { label: "还模糊", className: "is-fuzzy", icon: "clock" };
  if (status === "unknown") return { label: "不会", className: "is-unknown", icon: "alert" };
  return { label: "未自评", className: "", icon: "edit" };
}

function shortAnswerMarkup(question) {
  const sections = question.answer.map((section) => {
    const list = section.list
      ? `<ul class="short-answer-list">${section.list.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`
      : "";
    const body = section.body ? `<p>${escapeHTML(section.body)}</p>` : "";
    return `
      <section class="short-answer-section">
        <h3>${escapeHTML(section.heading)}</h3>
        ${body}
        ${list}
      </section>
    `;
  }).join("");

  const figure = question.figure
    ? `
      <figure class="short-answer-figure">
        <img src="${escapeHTML(question.figure)}" alt="故障树题目电路图">
        <figcaption>题目电路图：正常时 A 不亮</figcaption>
      </figure>
    `
    : "";

  const formula = question.formula
    ? `<div class="short-formula">${escapeHTML(question.formula)}</div>`
    : "";

  const keyPoints = question.keyPoints?.length
    ? `
      <div class="short-keypoints">
        <span class="short-answer-label">评分关键词</span>
        <div>${question.keyPoints.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>
      </div>
    `
    : "";

  const caution = question.caution
    ? `<p class="short-answer-caution">${escapeHTML(question.caution)}</p>`
    : "";

  return `
    <section class="short-answer-panel" tabindex="-1" aria-live="polite">
      <div class="short-answer-panel-head">
        <span class="short-answer-kicker">参考答案</span>
        <span class="short-source-badge">${escapeHTML(question.sourceType)}</span>
      </div>
      ${figure}
      <div class="short-answer-content">${sections}</div>
      ${formula}
      ${keyPoints}
      ${caution}
      <div class="short-answer-foot">
        <span>来源：${escapeHTML(question.source)}</span>
        <span>${question.tags.map((tag) => `<b>${escapeHTML(tag)}</b>`).join("")}</span>
      </div>
    </section>
  `;
}

function renderShortPractice() {
  if (!SHORT_ANSWERS.length) {
    navigate("home");
    return;
  }
  if (!shortSession) {
    shortSession = {
      ids: SHORT_ANSWERS.map((question) => question.id),
      index: 0,
      revealed: new Set(),
      startedAt: Date.now()
    };
  }

  const currentQuestion = SHORT_BY_ID.get(shortSession.ids[shortSession.index]);
  if (!currentQuestion) {
    navigate("home");
    return;
  }

  const categoryMeta = getCategoryMeta(currentQuestion.category);
  const saved = state.shortProgress[currentQuestion.id];
  const status = saved?.status || "";
  const statusMeta = shortStatusMeta(status);
  const revealed = shortSession.revealed.has(currentQuestion.id) || Boolean(saved);
  const draft = state.shortDrafts[currentQuestion.id] || "";
  const isLast = shortSession.index === shortSession.ids.length - 1;
  const progress = Math.round(((shortSession.index + 1) / shortSession.ids.length) * 100);
  const assessed = Object.values(state.shortProgress);
  const mastered = assessed.filter((item) => item.status === "mastered").length;
  const fuzzy = assessed.filter((item) => item.status === "fuzzy").length;
  const unknown = assessed.filter((item) => item.status === "unknown").length;

  const mapMarkup = shortSession.ids.map((id, index) => {
    const item = SHORT_BY_ID.get(id);
    const itemStatus = state.shortProgress[id]?.status || "";
    const classes = [
      "map-button",
      itemStatus === "mastered" ? "is-correct" : "",
      itemStatus === "fuzzy" ? "is-fuzzy" : "",
      itemStatus === "unknown" ? "is-wrong" : "",
      index === shortSession.index ? "is-current" : ""
    ].filter(Boolean).join(" ");
    return `
      <button
        class="${classes}"
        type="button"
        data-action="jump-short"
        data-index="${index}"
        aria-label="第 ${index + 1} 题：${escapeHTML(item?.question || "")}"
      >${index + 1}</button>
    `;
  }).join("");

  const assessmentMarkup = revealed
    ? `
      <div class="short-assess">
        <div>
          <span class="short-answer-label">这一步掌握了吗？</span>
          <p>自评只影响你的简答进度，不影响选择题统计。</p>
        </div>
        <div class="short-assess-actions">
          <button class="short-assess-button is-mastered${status === "mastered" ? " is-selected" : ""}" type="button" data-action="assess-short" data-status="mastered">
            ${icon("check")} 掌握
          </button>
          <button class="short-assess-button is-fuzzy${status === "fuzzy" ? " is-selected" : ""}" type="button" data-action="assess-short" data-status="fuzzy">
            ${icon("clock")} 模糊
          </button>
          <button class="short-assess-button is-unknown${status === "unknown" ? " is-selected" : ""}" type="button" data-action="assess-short" data-status="unknown">
            ${icon("alert")} 不会
          </button>
        </div>
      </div>
    `
    : "";

  app.innerHTML = `
    <div class="practice-view view-enter short-view">
      <div class="practice-head">
        <div class="practice-title-row">
          <button class="back-button" type="button" data-action="exit-short" aria-label="返回概览">
            ${icon("left")}
          </button>
          <div>
            <h1>简答练习</h1>
            <p>共 ${SHORT_ANSWERS.length} 题 · 先作答再展开参考答案 · 自评会保存在本机</p>
          </div>
        </div>
        <span class="mode-badge">主观题</span>
      </div>

      <div class="practice-layout">
        <section class="quiz-card short-card">
          <div class="quiz-topline">
            <div class="quiz-meta">
              <span class="type-tag short-type-tag">简答题</span>
              <span
                class="category-tag"
                style="--cat-color:${categoryMeta.color};--cat-soft:${categoryMeta.soft}"
              >${escapeHTML(currentQuestion.category)}</span>
              <span class="difficulty-tag">${escapeHTML(currentQuestion.difficulty)}</span>
            </div>
            <span class="quiz-index"><strong>${String(shortSession.index + 1).padStart(2, "0")}</strong> / ${String(shortSession.ids.length).padStart(2, "0")}</span>
          </div>
          <div class="quiz-progress"><span style="width:${progress}%"></span></div>

          <div class="question-heading short-question-heading">
            <span class="question-number">${shortSession.index + 1}</span>
            <h2>${escapeHTML(currentQuestion.question)}</h2>
            <span class="short-status-pill ${statusMeta.className}">${icon(statusMeta.icon)}${statusMeta.label}</span>
          </div>
          <p class="option-hint">先在草稿里写出关键词和结构，再展开答案核对。答案展开后可以自评。</p>

          <label class="short-draft">
            <span>我的作答草稿 <small>不会自动判分，可留空</small></span>
            <textarea
              data-short-draft="${currentQuestion.id}"
              rows="6"
              placeholder="例如：先写系统组成、关键活门、保护逻辑……"
            >${escapeHTML(draft)}</textarea>
          </label>

          ${revealed
            ? shortAnswerMarkup(currentQuestion)
            : `
              <div class="short-reveal-prompt">
                ${icon("edit")}
                <div>
                  <strong>参考答案先藏在这里</strong>
                  <p>写完后展开，对照评分关键词检查自己漏了哪一层。</p>
                </div>
                <button class="button button-dark button-small" type="button" data-action="reveal-short">
                  展开参考答案 ${icon("right")}
                </button>
              </div>
            `}

          ${assessmentMarkup}

          <div class="quiz-footer">
            <div class="quiz-footer-left">
              <span class="keyboard-hint">当前为第 ${shortSession.index + 1} / ${shortSession.ids.length} 题</span>
            </div>
            <div class="quiz-footer-right">
              <button
                class="button button-outline button-small"
                type="button"
                data-action="previous-short"
                ${shortSession.index === 0 ? "disabled" : ""}
              >${icon("left")} 上一题</button>
              <button class="button button-dark button-small" type="button" data-action="${isLast ? "finish-short" : "next-short"}">
                ${isLast ? "完成练习" : "下一题"} ${icon("right")}
              </button>
            </div>
          </div>
        </section>

        <aside class="practice-aside">
          <section class="session-card">
            <div class="session-card-head">
              <h3>简答进度</h3>
              <span>${mastered + fuzzy + unknown} / ${SHORT_ANSWERS.length} 已自评</span>
            </div>
            <div class="session-stats">
              <div class="session-stat"><strong>${mastered}</strong><span>掌握</span></div>
              <div class="session-stat"><strong>${fuzzy}</strong><span>模糊</span></div>
              <div class="session-stat"><strong>${unknown}</strong><span>不会</span></div>
            </div>
            <div class="map-label">
              <strong>简答导航</strong>
              <span>点击跳转</span>
            </div>
            <div class="question-map">${mapMarkup}</div>
            <div class="map-legend">
              <span class="legend-item"><span class="legend-dot"></span>未自评</span>
              <span class="legend-item"><span class="legend-dot correct"></span>掌握</span>
              <span class="legend-item"><span class="legend-dot wrong"></span>不会</span>
              <span class="legend-item"><span class="legend-dot fuzzy"></span>模糊</span>
            </div>
          </section>

          <button class="session-exit" type="button" data-action="exit-short">
            ${icon("left")} 返回概览
          </button>

          <section class="legend-card">
            <p><strong>简答题怎么练</strong><br>先写草稿，再展开答案。能说出“定义、结构、原因、场景”四层，通常就已经抓住得分点。</p>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function saveShortDraft(questionId, value) {
  if (!SHORT_BY_ID.has(questionId)) return;
  state.shortDrafts[questionId] = value;
  saveState();
}

function revealShortAnswer() {
  if (!shortSession) return;
  const question = SHORT_BY_ID.get(shortSession.ids[shortSession.index]);
  if (!question) return;
  shortSession.revealed.add(question.id);
  renderShortPractice();
  requestAnimationFrame(() => {
    app.querySelector(".short-answer-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function assessShortAnswer(status) {
  if (!shortSession) return;
  const question = SHORT_BY_ID.get(shortSession.ids[shortSession.index]);
  if (!question) return;
  state.shortProgress[question.id] = {
    status,
    updatedAt: new Date().toISOString()
  };
  shortSession.revealed.add(question.id);
  saveState();
  updateChrome();
  renderShortPractice();
  showToast(status === "mastered" ? "已标记为掌握" : status === "fuzzy" ? "已标记为模糊" : "已标记为不会");
}

function moveShortQuestion(direction) {
  if (!shortSession) return;
  if (direction > 0 && shortSession.index === shortSession.ids.length - 1) {
    navigate("home");
    showToast("简答练习已完成");
    return;
  }
  shortSession.index = Math.max(
    0,
    Math.min(shortSession.ids.length - 1, shortSession.index + direction)
  );
  renderShortPractice();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function jumpToShort(index) {
  if (!shortSession) return;
  const nextIndex = Number(index);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= shortSession.ids.length) return;
  shortSession.index = nextIndex;
  renderShortPractice();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startShortPractice() {
  if (!SHORT_ANSWERS.length) {
    showToast("简答题库还没有内容");
    return;
  }
  const firstUnmastered = SHORT_ANSWERS.findIndex(
    (question) => state.shortProgress[question.id]?.status !== "mastered"
  );
  shortSession = {
    ids: SHORT_ANSWERS.map((question) => question.id),
    index: firstUnmastered >= 0 ? firstUnmastered : 0,
    revealed: new Set(),
    startedAt: Date.now()
  };
  navigate("short");
}

function renderHumanFactorsPage() {
  window.location.replace("human-factors.html");
}

function chooseOption(key) {
  if (!session) return;
  const question = QUESTION_BY_ID.get(session.ids[session.index]);
  if (!question || session.answers[question.id]) return;

  if (question.type === "multiple") {
    const draft = session.drafts[question.id] || [];
    session.drafts[question.id] = draft.includes(key)
      ? draft.filter((item) => item !== key)
      : [...draft, key];
    renderPractice();
    return;
  }

  submitAnswer([key]);
}

function clearAutoAdvance() {
  if (autoAdvanceTimer !== null) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function scheduleAutoAdvance(questionId, questionIndex) {
  clearAutoAdvance();
  autoAdvanceTimer = setTimeout(() => {
    autoAdvanceTimer = null;
    if (!session || session.index !== questionIndex) return;
    if (session.ids[session.index] !== questionId) return;
    moveQuestion(1);
  }, 1000);
}

function submitCurrentMultiple() {
  if (!session) return;
  const question = QUESTION_BY_ID.get(session.ids[session.index]);
  if (!question || question.type !== "multiple") return;
  const draft = session.drafts[question.id] || [];
  if (!draft.length) {
    showToast("请先选择至少一个选项");
    return;
  }
  submitAnswer(draft);
}

function submitAnswer(selected) {
  if (!session) return;
  const question = QUESTION_BY_ID.get(session.ids[session.index]);
  if (!question || session.answers[question.id]) return;
  const normalized = [...new Set(selected)].sort();
  const expected = [...question.answer].sort();
  const correct = normalized.length === expected.length
    && normalized.every((key, index) => key === expected[index]);

  session.answers[question.id] = { selected: normalized, correct };
  recordAnswer(question, normalized, correct);
  renderPractice();

  scheduleAutoAdvance(question.id, session.index);

  requestAnimationFrame(() => {
    const feedback = app.querySelector(".feedback");
    if (!feedback) return;
    feedback.focus({ preventScroll: true });
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function moveQuestion(direction) {
  if (!session) return;
  clearAutoAdvance();
  if (direction > 0 && session.index === session.ids.length - 1) {
    finishSession();
    return;
  }
  session.index = Math.max(0, Math.min(session.ids.length - 1, session.index + direction));
  renderPractice();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function jumpToQuestion(index) {
  if (!session) return;
  clearAutoAdvance();
  const nextIndex = Number(index);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= session.ids.length) return;
  session.index = nextIndex;
  renderPractice();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function finishSession() {
  if (!session) return;
  window.location.hash = "#/result";
}

function renderResult() {
  if (!session) {
    navigate("home");
    return;
  }
  const stats = sessionStats();
  const answered = stats.answered;
  const total = session.ids.length;
  const resultTitle = answered === 0
    ? "这一轮还没有落笔。"
    : stats.accuracy >= 80
      ? "这一轮，稳住了。"
      : "再复盘一下，会更稳。";
  const resultSubtitle = answered === 0
    ? "回到题库完成几道题，系统才能生成这一轮的反馈。"
    : stats.accuracy >= 80
      ? "判断与知识框架都在线，继续保持这种节奏。"
      : "错题已经统一收进错题本，下一轮优先复盘薄弱模块。";
  const wrongIds = Object.entries(session.answers)
    .filter(([, answer]) => !answer.correct)
    .map(([id]) => id);

  app.innerHTML = `
    <div class="result-view view-enter">
      <section class="result-card">
        <div class="result-mark">${icon(stats.accuracy >= 80 ? "check" : "chart")}</div>
        <p class="result-eyebrow">SESSION COMPLETE</p>
        <h1>${resultTitle}</h1>
        <p class="result-subtitle">${resultSubtitle}</p>

        <div class="result-score">
          <strong>${stats.accuracy}<small>%</small></strong>
          <span>本轮正确率</span>
        </div>

        <div class="result-grid">
          <div class="result-stat"><span>已作答</span><strong>${answered}<small> / ${total}</small></strong></div>
          <div class="result-stat"><span>答对</span><strong>${stats.correct}</strong></div>
          <div class="result-stat"><span>答错</span><strong>${stats.wrong}</strong></div>
        </div>

        <div class="result-actions">
          <button class="button button-dark" type="button" data-action="restart-session">
            ${icon("rotate")} 再练一轮
          </button>
          ${wrongIds.length ? `
            <button class="button button-outline" type="button" data-action="retry-session-wrong">
              ${icon("alert")} 重练本轮错题
            </button>
          ` : ""}
          <button class="button button-outline" type="button" data-action="go-home">
            ${icon("home")} 返回概览
          </button>
        </div>
        <p class="result-note">${wrongIds.length ? `${wrongIds.length} 道错题已自动加入错题本。` : "本轮没有新增错题。"} 本地进度已保存。</p>
      </section>
    </div>
  `;
}

function renderBankPage() {
  const typeChips = [
    { value: "all", label: "全部" },
    { value: "single", label: "单选" },
    { value: "multiple", label: "多选" },
    { value: "judge", label: "判断" }
  ].map((item) => `
    <button
      class="filter-chip${bankState.type === item.value ? " is-active" : ""}"
      type="button"
      data-action="filter-type"
      data-value="${item.value}"
    >${item.label}</button>
  `).join("");

  const categoryChips = [
    { value: "all", label: "全部" },
    ...CATEGORY_ORDER.map((category) => ({ value: category, label: category }))
  ].map((item) => `
    <button
      class="filter-chip${bankState.category === item.value ? " is-active" : ""}"
      type="button"
      data-action="filter-category"
      data-value="${escapeHTML(item.value)}"
    >${escapeHTML(item.label)}</button>
  `).join("");

  app.innerHTML = `
    <div class="bank-view view-enter">
      <div class="page-heading">
        <div>
          <h1>全部题库</h1>
          <p>${QUESTIONS.length} 道课程自制题，覆盖大纲中的传感器、引气、空调、PHM、数据与故障树模块。</p>
        </div>
        <div class="page-heading-meta">
          <span class="meta-pill">${solvedCount()} 道已完成</span>
          <span class="meta-pill">${state.favorites.length} 道已收藏</span>
        </div>
      </div>

      <section class="bank-toolbar">
        <label class="bank-search">
          ${icon("search")}
          <input
            id="bank-search"
            type="search"
            value="${escapeHTML(bankState.query)}"
            placeholder="搜索题干、知识点或来源，例如：LVDT、引气、最小割集"
            autocomplete="off"
          >
        </label>
        <div class="filter-row">
          <div class="filter-group">
            <span class="filter-label">题型</span>
            ${typeChips}
          </div>
          <span class="filter-divider"></span>
          <div class="filter-group">
            <span class="filter-label">模块</span>
            ${categoryChips}
          </div>
        </div>
      </section>

      <div class="bank-summary">
        <span>找到 <strong id="bank-result-count">${filteredQuestions().length}</strong> 道题</span>
        <span>点击题目即可开始单题练习</span>
      </div>
      <div id="bank-list" class="bank-list">${bankListMarkup()}</div>
    </div>
  `;

  const searchInput = document.getElementById("bank-search");
  searchInput.addEventListener("input", (event) => {
    bankState.query = event.target.value;
    renderBankList();
  });
}

function filteredQuestions() {
  const query = bankState.query.trim().toLowerCase();
  return QUESTIONS.filter((question) => {
    const typeMatches = bankState.type === "all" || question.type === bankState.type;
    const categoryMatches = bankState.category === "all" || question.category === bankState.category;
    if (!typeMatches || !categoryMatches) return false;
    if (!query) return true;
    const searchable = [
      question.question,
      question.category,
      question.source,
      ...question.tags,
      ...question.options.map((option) => option.text),
      question.explanation
    ].join(" ").toLowerCase();
    return searchable.includes(query);
  });
}

function renderBankList() {
  const list = document.getElementById("bank-list");
  const count = document.getElementById("bank-result-count");
  if (!list) return;
  if (count) count.textContent = filteredQuestions().length;
  list.innerHTML = bankListMarkup();
}

function bankListMarkup() {
  const questions = filteredQuestions();
  if (!questions.length) {
    return `
      <div class="empty-state" style="grid-column:1/-1">
        <span class="empty-visual">${icon("search")}</span>
        <h2>没有找到匹配的题</h2>
        <p>换一个关键词，或清除题型与模块筛选后再看看。</p>
        <button class="button button-outline" type="button" data-action="clear-filters">清除筛选</button>
      </div>
    `;
  }
  return questions.map((question) => bankItemMarkup(question)).join("");
}

function bankItemMarkup(question) {
  const meta = getCategoryMeta(question.category);
  const typeClass = question.type === "multiple"
    ? "multiple"
    : question.type === "judge"
      ? "judge"
      : "";
  const progress = state.progress[question.id];
  const isFavorite = state.favorites.includes(question.id);
  const status = progress
    ? progress.lastCorrect
      ? `<span class="status-check">${icon("check")} 已答对</span>`
      : `<span class="status-check" style="color:var(--red)">${icon("x")} 待复习</span>`
    : "";

  return `
    <article class="bank-item" data-action="open-question" data-id="${question.id}" tabindex="0" role="button" aria-label="练习：${escapeHTML(question.question)}">
      <button
        class="bank-star${isFavorite ? " is-active" : ""}"
        type="button"
        data-action="toggle-favorite"
        data-id="${question.id}"
        aria-label="${isFavorite ? "取消收藏" : "收藏此题"}"
      >${icon("star")}</button>
      <div class="bank-item-top">
        <span class="type-tag ${typeClass}">${TYPE_LABEL[question.type]}</span>
        <span
          class="category-tag"
          style="--cat-color:${meta.color};--cat-soft:${meta.soft}"
        >${escapeHTML(question.category)}</span>
      </div>
      <h3>${escapeHTML(question.question)}</h3>
      <div class="bank-item-foot">
        <span class="bank-item-source">${escapeHTML(question.source)}</span>
        <span class="bank-item-status">${status}</span>
      </div>
    </article>
  `;
}

function renderCollection(kind) {
  const isFavorites = kind === "favorites";
  const ids = isFavorites ? state.favorites : state.wrong;
  const questions = ids.map((id) => QUESTION_BY_ID.get(id)).filter(Boolean);
  const title = isFavorites ? "我的收藏" : "错题本";
  const description = isFavorites
    ? "把需要反复确认的概念留在这里。收藏不会自动移除，适合考前二轮复习。"
    : "答错的题会自动进入这里，答对后自动移出。先复盘错因，再做下一题。";

  const content = questions.length
    ? `<div class="bank-list">${questions.map((question) => bankItemMarkup(question)).join("")}</div>`
    : `
      <div class="empty-state">
        <span class="empty-visual">${icon(isFavorites ? "bookmark" : "check")}</span>
        <h2>${isFavorites ? "还没有收藏题目" : "错题本是空的"}</h2>
        <p>${isFavorites ? "练习时点击题目右上角的星标，就能把重点题集中到这里。" : "先完成一轮练习，错题会自动归档；答对后会自动移出。"}</p>
        <button class="button button-dark" type="button" data-action="${isFavorites ? "start-all" : "start-random"}">
          ${icon("play")} ${isFavorites ? "去题库看看" : "随机练 20 题"}
        </button>
      </div>
    `;

  app.innerHTML = `
    <div class="collection-view view-enter">
      <section class="collection-hero${isFavorites ? " is-favorites" : ""}">
        <div>
          <h1>${title}</h1>
          <p>${description}</p>
          <div class="collection-actions">
            <button
              class="button ${isFavorites ? "button-outline" : "button-dark"}"
              type="button"
              data-action="${isFavorites ? "start-favorites" : "start-wrong"}"
              ${questions.length ? "" : "disabled"}
            >${icon("play")} ${isFavorites ? "收藏专项练习" : "开始重练"}</button>
            ${!isFavorites && questions.length ? `
              <button class="button button-outline" type="button" data-action="clear-wrong">清空错题本</button>
            ` : ""}
          </div>
        </div>
        <span class="collection-hero-icon">${icon(isFavorites ? "bookmark" : "alert")}</span>
      </section>
      ${content}
    </div>
  `;
}

function toggleFavorite(questionId) {
  if (!QUESTION_BY_ID.has(questionId)) return;
  const isFavorite = state.favorites.includes(questionId);
  state.favorites = isFavorite
    ? state.favorites.filter((id) => id !== questionId)
    : [questionId, ...state.favorites];
  saveState();
  updateChrome();
  showToast(isFavorite ? "已取消收藏" : "已加入收藏");

  const route = getCurrentRoute();
  if (route === "practice") renderPractice();
  else if (route === "bank") renderBankPage();
  else if (route === "favorites") renderCollection("favorites");
  else if (route === "wrong") renderCollection("wrong");
}

function openSingleQuestion(questionId) {
  const question = QUESTION_BY_ID.get(questionId);
  if (!question) return;
  startPractice(
    [question.id],
    `${question.category} · 单题练习`,
    "单题练习"
  );
}

function clearWrongBook() {
  if (!state.wrong.length) return;
  if (!window.confirm("确定清空错题本吗？学习统计不会受影响。")) return;
  state.wrong = [];
  saveState();
  updateChrome();
  renderCollection("wrong");
  showToast("错题本已清空");
}

function focusBankSearch() {
  if (getCurrentRoute() !== "bank") {
    window.location.hash = "#/bank";
    setTimeout(() => document.getElementById("bank-search")?.focus(), 80);
  } else {
    document.getElementById("bank-search")?.focus();
  }
}

app.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  const value = actionTarget.dataset.value;
  const id = actionTarget.dataset.id;

  if (action === "start-all") {
    startPractice(QUESTIONS.map((question) => question.id), "全题库 · 顺序练习", "顺序练习");
  } else if (action === "start-random") {
    startPractice(
      shuffle(QUESTIONS.map((question) => question.id)).slice(0, 20),
      "随机 20 题",
      "随机练习"
    );
  } else if (action === "start-wrong") {
    startPractice([...state.wrong], "错题重练", "错题模式");
  } else if (action === "start-favorites") {
    startPractice([...state.favorites], "收藏专项练习", "收藏模式");
  } else if (action === "start-category") {
    const category = actionTarget.dataset.category;
    startPractice(
      categoryQuestions(category).map((question) => question.id),
      `${category} · 专项练习`,
      "分类练习"
    );
  } else if (action === "start-short") {
    startShortPractice();
  } else if (action === "reveal-short") {
    revealShortAnswer();
  } else if (action === "assess-short") {
    assessShortAnswer(actionTarget.dataset.status);
  } else if (action === "previous-short") {
    moveShortQuestion(-1);
  } else if (action === "next-short") {
    moveShortQuestion(1);
  } else if (action === "jump-short") {
    jumpToShort(actionTarget.dataset.index);
  } else if (action === "exit-short") {
    navigate("home");
  } else if (action === "finish-short") {
    navigate("home");
    showToast("简答练习已完成");
  } else if (action === "choose-option") {
    chooseOption(actionTarget.dataset.key);
  } else if (action === "submit-multi") {
    submitCurrentMultiple();
  } else if (action === "previous-question") {
    moveQuestion(-1);
  } else if (action === "next-question") {
    moveQuestion(1);
  } else if (action === "jump-question") {
    jumpToQuestion(actionTarget.dataset.index);
  } else if (action === "exit-practice") {
    navigate("home");
  } else if (action === "toggle-favorite") {
    toggleFavorite(id);
  } else if (action === "open-question") {
    openSingleQuestion(id);
  } else if (action === "filter-type") {
    bankState.type = value;
    renderBankPage();
  } else if (action === "filter-category") {
    bankState.category = value;
    renderBankPage();
  } else if (action === "clear-filters") {
    bankState.query = "";
    bankState.type = "all";
    bankState.category = "all";
    renderBankPage();
  } else if (action === "clear-wrong") {
    clearWrongBook();
  } else if (action === "restart-session") {
    const ids = session ? [...session.ids] : QUESTIONS.map((question) => question.id);
    startPractice(ids, session ? session.title : "全题库 · 顺序练习", "重新练习");
  } else if (action === "retry-session-wrong") {
    const wrongIds = session
      ? Object.entries(session.answers)
        .filter(([, answer]) => !answer.correct)
        .map(([questionId]) => questionId)
      : [];
    startPractice(wrongIds, "本轮错题重练", "错题模式");
  } else if (action === "go-home") {
    navigate("home");
  }
});

app.addEventListener("input", (event) => {
  const draft = event.target.closest("[data-short-draft]");
  if (!draft) return;
  saveShortDraft(draft.dataset.shortDraft, draft.value);
});

app.addEventListener("keydown", (event) => {
  const target = event.target.closest('[data-action="open-question"]');
  if (!target) return;
  if (event.target !== target) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openSingleQuestion(target.dataset.id);
});

document.getElementById("menu-button").addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
});

document.getElementById("sidebar-scrim").addEventListener("click", closeSidebar);
document.getElementById("search-trigger").addEventListener("click", focusBankSearch);

document.addEventListener("keydown", (event) => {
  const tagName = event.target.tagName;
  const isTyping = tagName === "INPUT" || tagName === "TEXTAREA" || event.target.isContentEditable;

  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    focusBankSearch();
    return;
  }

  if (event.key === "Escape") {
    closeSidebar();
    return;
  }

  if (isTyping || getCurrentRoute() !== "practice" || !session) return;
  const question = QUESTION_BY_ID.get(session.ids[session.index]);
  if (!question) return;
  const answered = Boolean(session.answers[question.id]);

  const number = Number(event.key);
  if (Number.isInteger(number) && number >= 1 && number <= question.options.length) {
    event.preventDefault();
    chooseOption(question.options[number - 1].key);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    if (question.type === "multiple" && !answered) submitCurrentMultiple();
    else moveQuestion(1);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveQuestion(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveQuestion(-1);
  }
});

window.addEventListener("hashchange", handleRoute);
window.addEventListener("resize", () => {
  if (window.innerWidth > 960) closeSidebar();
});

updateChrome();
if (!window.location.hash) {
  window.history.replaceState(null, "", "#/home");
}
handleRoute();
