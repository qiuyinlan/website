(function () {
  const STORAGE_KEY = "micro-habit-local-state-v1";
  const DEFAULT_APP_VERSION = "2026.05.14-drag-all";
  const TODAY = () => new Date().toISOString().slice(0, 10);

  const state = {
    mode: "local",
    session: null,
    habits: [],
    completions: {},
    mainlines: [],
    principles: [],
    interests: [],
    supabaseNotice: "",
    currentHabitId: null,
    skippedToday: [],
  };

  const els = {
    appVersion: document.getElementById("app-version"),
    modeBadge: document.getElementById("mode-badge"),
    taskOrder: document.getElementById("task-order"),
    taskTitle: document.getElementById("task-title"),
    taskHint: document.getElementById("task-hint"),
    completeTask: document.getElementById("complete-task"),
    skipTask: document.getElementById("skip-task"),
    todayProgress: document.getElementById("today-progress"),
    todayList: document.getElementById("today-list"),
    settingsDialog: document.getElementById("settings-dialog"),
    mainlineDialog: document.getElementById("mainline-dialog"),
    openMainline: document.getElementById("open-mainline"),
    mainlineClose: document.getElementById("mainline-close"),
    addMainline: document.getElementById("add-mainline"),
    deleteMainline: document.getElementById("delete-mainline"),
    mainlineCount: document.getElementById("mainline-count"),
    mainlineEmpty: document.getElementById("mainline-empty"),
    mainlineList: document.getElementById("mainline-list"),
    mainlineEditorEmpty: document.getElementById("mainline-editor-empty"),
    mainlineForm: document.getElementById("mainline-form"),
    mainlineTitleInput: document.getElementById("mainline-title-input"),
    mainlineWhyInput: document.getElementById("mainline-why-input"),
    mainlineOutcomeInput: document.getElementById("mainline-outcome-input"),
    mainlineFirstStepInput: document.getElementById("mainline-first-step-input"),
    mainlineHowWhereInput: document.getElementById("mainline-how-where-input"),
    mainlineCostInput: document.getElementById("mainline-cost-input"),
    saveMainline: document.getElementById("save-mainline"),
    principlesDialog: document.getElementById("principles-dialog"),
    openPrinciples: document.getElementById("open-principles"),
    principlesClose: document.getElementById("principles-close"),
    addPrinciple: document.getElementById("add-principle"),
    deletePrinciple: document.getElementById("delete-principle"),
    principleCount: document.getElementById("principle-count"),
    principleEmpty: document.getElementById("principle-empty"),
    principleList: document.getElementById("principle-list"),
    principleEditorEmpty: document.getElementById("principle-editor-empty"),
    principleForm: document.getElementById("principle-form"),
    principleTitleInput: document.getElementById("principle-title-input"),
    addPrinciplePoint: document.getElementById("add-principle-point"),
    principlePointsEmpty: document.getElementById("principle-points-empty"),
    principlePoints: document.getElementById("principle-points"),
    savePrinciple: document.getElementById("save-principle"),
    interestsDialog: document.getElementById("interests-dialog"),
    openInterests: document.getElementById("open-interests"),
    interestsClose: document.getElementById("interests-close"),
    addInterest: document.getElementById("add-interest"),
    deleteInterest: document.getElementById("delete-interest"),
    interestCount: document.getElementById("interest-count"),
    interestEmpty: document.getElementById("interest-empty"),
    interestList: document.getElementById("interest-list"),
    interestEditorEmpty: document.getElementById("interest-editor-empty"),
    interestForm: document.getElementById("interest-form"),
    interestInput: document.getElementById("interest-input"),
    saveInterest: document.getElementById("save-interest"),
    openSettings: document.getElementById("open-settings"),
    closeSettings: document.getElementById("close-settings"),
    syncStatus: document.getElementById("sync-status"),
    authEmail: document.getElementById("auth-email"),
    authPassword: document.getElementById("auth-password"),
    signIn: document.getElementById("sign-in"),
    signUp: document.getElementById("sign-up"),
    signOut: document.getElementById("sign-out"),
    habitTitleInput: document.getElementById("habit-title-input"),
    addHabit: document.getElementById("add-habit"),
    habitList: document.getElementById("habit-list"),
  };

  let selectedMainlineId = null;
  let selectedPrincipleId = null;
  let selectedInterestId = null;
  const listDrag = {
    kind: null,
    pointerId: null,
    item: null,
    handle: null,
    placeholder: null,
    list: null,
    itemSelector: "",
    onReorder: null,
    offsetY: 0,
  };

  function getAppVersion() {
    const version = window.APP_CONFIG?.version;
    if (typeof version === "string" && version.trim()) {
      return version.trim();
    }
    return DEFAULT_APP_VERSION;
  }

  function renderAppVersion() {
    if (!els.appVersion) return;
    els.appVersion.textContent = `版本 v${getAppVersion()}`;
  }

  function autoResizeTextarea(textarea) {
    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function refreshAutoResizeTextareas(scope = document) {
    scope.querySelectorAll("textarea").forEach((textarea) => {
      autoResizeTextarea(textarea);
    });
  }

  function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function loadLocalState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveLocalState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        habits: state.habits,
        completions: state.completions,
        mainlines: state.mainlines,
        mainline: state.mainlines[0]?.title || "",
        principles: state.principles,
        interests: state.interests,
      }),
    );
  }

  function hydrateStateFromSavedState(saved = loadLocalState()) {
    state.habits = Array.isArray(saved.habits) ? saved.habits : [];
    state.completions =
      saved.completions && typeof saved.completions === "object" ? saved.completions : {};
    state.mainlines = parseMainlinesContent(saved.mainlines, saved.mainline);
    state.principles = parsePrinciplesContent(saved.principles);
    state.interests = parseInterestsContent(saved.interests);
    selectedMainlineId = getSortedMainlines()[0]?.id || null;
    selectedPrincipleId = getSortedPrinciples()[0]?.id || null;
    selectedInterestId = getSortedInterests()[0]?.id || null;
  }

  function getErrorMessage(error, fallback = "发生了未知错误。") {
    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message.trim();
    }
    return fallback;
  }

  function isMissingContentTableError(error, tableName) {
    const detail = [
      error?.code,
      error?.message,
      error?.details,
      error?.hint,
    ]
      .filter((value) => typeof value === "string" && value.trim())
      .join(" ")
      .toLowerCase();

    return detail.includes(tableName.toLowerCase()) || error?.code === "PGRST205";
  }

  function getContentSchemaNotice() {
    return "当前 Supabase 还是旧版表结构：习惯同步可继续使用，但“主线/原则/兴趣”同步需要重新执行最新的 supabase/schema.sql。";
  }

  function createOrderedList(items) {
    return items
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((item, index) => ({ ...item, order: index }));
  }

  function createMainline(partial = {}, fallbackOrder = 0) {
    return {
      id: typeof partial.id === "string" && partial.id.trim() ? partial.id : uid(),
      title: typeof partial.title === "string" ? partial.title.trim() : "",
      why: typeof partial.why === "string" ? partial.why.trim() : "",
      outcome: typeof partial.outcome === "string" ? partial.outcome.trim() : "",
      firstStep: typeof partial.firstStep === "string" ? partial.firstStep.trim() : "",
      howWhere: typeof partial.howWhere === "string" ? partial.howWhere.trim() : "",
      costOfNotDoing:
        typeof partial.costOfNotDoing === "string" ? partial.costOfNotDoing.trim() : "",
      createdAt:
        typeof partial.createdAt === "string" && partial.createdAt.trim()
          ? partial.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof partial.updatedAt === "string" && partial.updatedAt.trim()
          ? partial.updatedAt
          : new Date().toISOString(),
      order: Number.isFinite(partial.order) ? partial.order : fallbackOrder,
    };
  }

  function createLegacyMainline(content) {
    const title = typeof content === "string" ? content.trim() : "";
    return title ? [createMainline({ title }, 0)] : [];
  }

  function normalizeMainlineCollection(items) {
    if (!Array.isArray(items)) return [];
    return createOrderedList(
      items
        .map((item, index) => {
          if (typeof item === "string") {
            return createMainline({ title: item }, index);
          }
          if (!item || typeof item !== "object") return null;
          return createMainline(item, index);
        })
        .filter(Boolean),
    );
  }

  function parseMainlinesContent(savedMainlines, legacyMainline = "") {
    const mainlines = normalizeMainlineCollection(savedMainlines);
    if (mainlines.length) {
      return mainlines;
    }

    if (typeof legacyMainline === "string" && legacyMainline.trim()) {
      return createLegacyMainline(legacyMainline);
    }

    return [];
  }

  function parseMainlinesPayload(content) {
    if (typeof content !== "string" || !content.trim()) {
      return [];
    }

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return normalizeMainlineCollection(parsed);
      }
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return normalizeMainlineCollection(parsed.items);
      }
    } catch {
      return createLegacyMainline(content);
    }

    return [];
  }

  function serializeMainlinesPayload() {
    if (!state.mainlines.length) {
      return "";
    }

    return JSON.stringify({
      version: 3,
      items: getSortedMainlines().map((mainline) => ({
        id: mainline.id,
        title: mainline.title,
        why: mainline.why,
        outcome: mainline.outcome,
        firstStep: mainline.firstStep,
        howWhere: mainline.howWhere,
        costOfNotDoing: mainline.costOfNotDoing,
        createdAt: mainline.createdAt,
        updatedAt: mainline.updatedAt,
        order: mainline.order,
      })),
    });
  }

  function createPrinciplePoint(partial = {}) {
    return {
      id: typeof partial.id === "string" && partial.id.trim() ? partial.id : uid(),
      text: typeof partial.text === "string" ? partial.text : "",
    };
  }

  function normalizePrinciplePoints(items) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        if (typeof item === "string") {
          return createPrinciplePoint({ text: item });
        }
        if (!item || typeof item !== "object") return null;
        return createPrinciplePoint(item);
      })
      .filter(Boolean);
  }

  function createPrinciple(partial = {}, fallbackOrder = 0) {
    return {
      id: typeof partial.id === "string" && partial.id.trim() ? partial.id : uid(),
      title: typeof partial.title === "string" ? partial.title.trim() : "",
      points: normalizePrinciplePoints(partial.points),
      createdAt:
        typeof partial.createdAt === "string" && partial.createdAt.trim()
          ? partial.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof partial.updatedAt === "string" && partial.updatedAt.trim()
          ? partial.updatedAt
          : new Date().toISOString(),
      order: Number.isFinite(partial.order) ? partial.order : fallbackOrder,
    };
  }

  function createInterest(partial = {}, fallbackOrder = 0) {
    return {
      id: typeof partial.id === "string" && partial.id.trim() ? partial.id : uid(),
      content: typeof partial.content === "string" ? partial.content.trim() : "",
      createdAt:
        typeof partial.createdAt === "string" && partial.createdAt.trim()
          ? partial.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof partial.updatedAt === "string" && partial.updatedAt.trim()
          ? partial.updatedAt
          : new Date().toISOString(),
      order: Number.isFinite(partial.order) ? partial.order : fallbackOrder,
    };
  }

  function normalizePrincipleCollection(items) {
    if (!Array.isArray(items)) return [];
    return createOrderedList(
      items
        .map((item, index) => {
          if (!item || typeof item !== "object") return null;
          return createPrinciple(item, index);
        })
        .filter(Boolean),
    );
  }

  function parsePrinciplesContent(savedPrinciples) {
    return normalizePrincipleCollection(savedPrinciples);
  }

  function normalizeInterestCollection(items) {
    if (!Array.isArray(items)) return [];
    return createOrderedList(
      items
        .map((item, index) => {
          if (typeof item === "string") {
            return createInterest({ content: item }, index);
          }
          if (!item || typeof item !== "object") return null;
          return createInterest(item, index);
        })
        .filter(Boolean),
    );
  }

  function parseInterestsContent(savedInterests) {
    return normalizeInterestCollection(savedInterests);
  }

  function parseInterestsPayload(content) {
    if (typeof content !== "string" || !content.trim()) {
      return [];
    }

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return normalizeInterestCollection(parsed);
      }
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return normalizeInterestCollection(parsed.items);
      }
    } catch {
      return normalizeInterestCollection([content]);
    }

    return [];
  }

  function parsePrinciplesPayload(content) {
    if (typeof content !== "string" || !content.trim()) {
      return [];
    }

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return normalizePrincipleCollection(parsed);
      }
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return normalizePrincipleCollection(parsed.items);
      }
    } catch {
      return [];
    }

    return [];
  }

  function serializePrinciplesPayload() {
    if (!state.principles.length) {
      return "";
    }

    return JSON.stringify({
      version: 1,
      items: getSortedPrinciples().map((principle) => ({
        id: principle.id,
        title: principle.title,
        points: principle.points.map((point) => ({
          id: point.id,
          text: point.text,
        })),
        createdAt: principle.createdAt,
        updatedAt: principle.updatedAt,
        order: principle.order,
      })),
    });
  }

  function serializeInterestsPayload() {
    if (!state.interests.length) {
      return "";
    }

    return JSON.stringify({
      version: 1,
      items: getSortedInterests().map((interest) => ({
        id: interest.id,
        content: interest.content,
        createdAt: interest.createdAt,
        updatedAt: interest.updatedAt,
        order: interest.order,
      })),
    });
  }

  function getSortedMainlines() {
    return state.mainlines.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  function getSortedPrinciples() {
    return state.principles.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  function getSortedInterests() {
    return state.interests.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  function ensureSelectedMainline() {
    const sortedMainlines = getSortedMainlines();
    if (!sortedMainlines.length) {
      selectedMainlineId = null;
      return null;
    }

    const selected =
      sortedMainlines.find((mainline) => mainline.id === selectedMainlineId) || sortedMainlines[0];
    selectedMainlineId = selected.id;
    return selected;
  }

  function getSelectedMainline() {
    return ensureSelectedMainline();
  }

  function ensureSelectedPrinciple() {
    const sortedPrinciples = getSortedPrinciples();
    if (!sortedPrinciples.length) {
      selectedPrincipleId = null;
      return null;
    }

    const selected =
      sortedPrinciples.find((principle) => principle.id === selectedPrincipleId) ||
      sortedPrinciples[0];
    selectedPrincipleId = selected.id;
    return selected;
  }

  function getSelectedPrinciple() {
    return ensureSelectedPrinciple();
  }

  function ensureSelectedInterest() {
    const sortedInterests = getSortedInterests();
    if (!sortedInterests.length) {
      selectedInterestId = null;
      return null;
    }

    const selected =
      sortedInterests.find((interest) => interest.id === selectedInterestId) || sortedInterests[0];
    selectedInterestId = selected.id;
    return selected;
  }

  function getSelectedInterest() {
    return ensureSelectedInterest();
  }

  function getMainlineListLabel(mainline, index) {
    const title = typeof mainline?.title === "string" ? mainline.title.trim() : "";
    if (title) return title;
    return `未命名主线 ${index + 1}`;
  }

  function getPrincipleListLabel(principle, index) {
    const title = typeof principle?.title === "string" ? principle.title.trim() : "";
    if (title) return title;
    return `未命名原则 ${index + 1}`;
  }

  function getInterestListLabel(interest, index) {
    const content = typeof interest?.content === "string" ? interest.content.trim() : "";
    if (content) {
      return content.length > 22 ? `${content.slice(0, 22)}...` : content;
    }
    return `未命名兴趣 ${index + 1}`;
  }

  function getTodayCompletions() {
    return state.completions[TODAY()] || [];
  }

  function setTodayCompletions(ids) {
    state.completions[TODAY()] = ids;
  }

  function getActiveHabits() {
    return getSortedHabits().filter((habit) => habit.active !== false);
  }

  function getSortedHabits() {
    return state.habits.slice().sort((a, b) => a.order - b.order);
  }

  function getPendingHabits() {
    const completed = new Set(getTodayCompletions());
    return getActiveHabits().filter((habit) => !completed.has(habit.id));
  }

  function resetSkippedRoundIfNeeded() {
    const pendingHabits = getPendingHabits();
    if (!pendingHabits.length) {
      state.skippedToday = [];
      return;
    }

    const skipped = new Set(state.skippedToday);
    if (pendingHabits.every((habit) => skipped.has(habit.id))) {
      state.skippedToday = [];
    }
  }

  function computeNextHabit() {
    const completed = new Set(getTodayCompletions());
    const skipped = new Set(state.skippedToday);
    return getActiveHabits().find(
      (habit) => !completed.has(habit.id) && !skipped.has(habit.id),
    );
  }

  function renderMain() {
    const activeHabits = getActiveHabits();
    const completed = new Set(getTodayCompletions());
    resetSkippedRoundIfNeeded();
    const skipped = new Set(state.skippedToday);
    const nextHabit = computeNextHabit();

    if (!activeHabits.length) {
      state.currentHabitId = null;
      els.taskOrder.textContent = "还没有习惯";
      els.taskTitle.textContent = "先添加一个微习惯";
      els.taskHint.textContent = "建议从最小动作开始，比如喝一口水。";
      els.completeTask.disabled = true;
      els.skipTask.disabled = true;
    } else if (!nextHabit) {
      state.currentHabitId = null;
      els.taskOrder.textContent = "今天已完成";
      els.taskTitle.textContent = "今天的微习惯已经完成";
      els.taskHint.textContent = "你可以休息一下，或者去设置里再加一个新习惯。";
      els.completeTask.disabled = true;
      els.skipTask.disabled = true;
    } else {
      const currentIndex = activeHabits.findIndex((habit) => habit.id === nextHabit.id);
      els.taskOrder.textContent = `今天第 ${currentIndex + 1} 项`;
      els.taskTitle.textContent = nextHabit.title;
      els.taskHint.textContent = "只做这一个动作就好，完成后系统会自动跳到下一个。";
      els.completeTask.disabled = false;
      els.skipTask.disabled = false;
      state.currentHabitId = nextHabit.id;
    }

    els.modeBadge.textContent =
      state.mode === "supabase" ? "Supabase 同步模式" : "本地模式";
    els.todayProgress.textContent = `${completed.size} / ${activeHabits.length}`;
    renderTodayList(activeHabits, completed, skipped);
  }

  function renderTodayList(activeHabits, completed, skipped = new Set()) {
    els.todayList.innerHTML = "";
    if (!activeHabits.length) {
      const li = document.createElement("li");
      li.className = "today-item";
      li.innerHTML = '<span class="today-title">暂无习惯</span>';
      els.todayList.appendChild(li);
      return;
    }

    activeHabits.forEach((habit) => {
      const isCompleted = completed.has(habit.id);
      const isSkipped = skipped.has(habit.id);
      const li = document.createElement("li");
      li.className = `today-item${isCompleted ? " done" : ""}`;
      const checkButton = document.createElement("button");
      checkButton.type = "button";
      checkButton.className = "today-check";
      checkButton.setAttribute(
        "aria-label",
        isCompleted ? `${habit.title} 已完成` : `把 ${habit.title} 标记为已完成`,
      );
      checkButton.disabled = isCompleted;
      if (!isCompleted) {
        checkButton.addEventListener("click", () => {
          markHabitComplete(habit.id);
        });
      }

      const title = document.createElement("span");
      title.className = "today-title";
      title.textContent = habit.title;

      li.appendChild(checkButton);
      li.appendChild(title);

      const actions = document.createElement("div");
      actions.className = "today-item-actions";

      const status = document.createElement("span");
      status.className = "habit-row-meta";
      status.textContent = isCompleted ? "已完成" : isSkipped ? "已跳过" : "待完成";
      actions.appendChild(status);

      if (isCompleted) {
        const undoButton = document.createElement("button");
        undoButton.className = "small-button undo-button";
        undoButton.type = "button";
        undoButton.textContent = "撤销";
        undoButton.setAttribute("aria-label", `把 ${habit.title} 改为未完成`);
        undoButton.addEventListener("click", () => {
          markHabitIncomplete(habit.id);
        });
        actions.appendChild(undoButton);
      }

      li.appendChild(actions);
      els.todayList.appendChild(li);
    });
  }

  function renderSettings() {
    els.habitList.innerHTML = "";
    const activeCount = getActiveHabits().length;
    const setupStatus = getSupabaseSetupStatus();
    const syncStatusText =
      state.mode === "supabase"
        ? `已连接 Supabase，同步账号：${state.session?.user?.email || "未知"}`
        : setupStatus.ready
          ? "已检测到 Supabase 配置，当前尚未登录；登录后可同步到手机和电脑。"
          : setupStatus.message;

    els.syncStatus.textContent = state.supabaseNotice
      ? `${syncStatusText} ${state.supabaseNotice}`
      : syncStatusText;

    if (!state.habits.length) {
      const li = document.createElement("li");
      li.className = "habit-item";
      li.innerHTML = `<span class="habit-row-meta">还没有任何习惯，先添加一个吧。</span>`;
      els.habitList.appendChild(li);
      return;
    }

    getSortedHabits().forEach((habit, index) => {
        const li = document.createElement("li");
        li.className = "habit-item sortable-item";
        li.dataset.dragId = habit.id;
        li.innerHTML = `
          <div class="habit-item-main">
            <input
              class="habit-title-editor"
              type="text"
              maxlength="80"
              value="${escapeHtml(habit.title)}"
              aria-label="编辑习惯内容"
            />
            <div class="habit-row-meta">${habit.active === false ? "已停用 · " : ""}拖动排序 ${index + 1}</div>
          </div>
          <div class="habit-item-actions">
            <button class="small-button toggle-active" type="button" aria-label="切换启用">${habit.active === false ? "启用" : "停用"}</button>
            <button class="small-button danger delete-habit" type="button" aria-label="删除">删</button>
            <button class="small-button drag-handle" type="button" aria-label="拖动排序" title="拖动排序">≡</button>
          </div>
        `;
        const titleInput = li.querySelector(".habit-title-editor");
        const dragHandle = li.querySelector(".drag-handle");
        titleInput.addEventListener("blur", () =>
          queueHabitTitleSave(habit.id, titleInput.value),
        );
        titleInput.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            titleInput.blur();
          }
          if (event.key === "Escape") {
            titleInput.value = habit.title;
            titleInput.blur();
          }
        });
        li.querySelector(".toggle-active").addEventListener("click", () => toggleHabit(habit.id));
        li.querySelector(".delete-habit").addEventListener("click", () => deleteHabit(habit.id));
        dragHandle.addEventListener("pointerdown", (event) => startHabitDrag(event, li, habit.id));
        els.habitList.appendChild(li);
      });

    if (!activeCount) {
      const note = document.createElement("li");
      note.className = "habit-item";
      note.innerHTML = `<span class="habit-row-meta">你把所有习惯都停用了，主界面不会显示任务。</span>`;
      els.habitList.appendChild(note);
    }
  }

  function renderMainlineDialog() {
    const selected = ensureSelectedMainline();
    const sortedMainlines = getSortedMainlines();

    els.mainlineCount.textContent = `${sortedMainlines.length} 条`;
    els.mainlineEmpty.hidden = sortedMainlines.length > 0;
    els.mainlineList.hidden = sortedMainlines.length === 0;
    els.mainlineList.innerHTML = "";

    sortedMainlines.forEach((mainline, index) => {
      const li = document.createElement("li");
      li.className = "mainline-list-item sortable-item";
      li.dataset.dragId = mainline.id;
      li.innerHTML = `
        <button type="button" class="mainline-list-button${mainline.id === selected?.id ? " is-active" : ""}">
          <span class="mainline-list-title">${escapeHtml(getMainlineListLabel(mainline, index))}</span>
          <span class="mainline-list-meta">${escapeHtml(mainline.why || "还没填写“为什么做”")} · 拖动排序 ${index + 1}</span>
        </button>
        <button class="small-button drag-handle mainline-drag-handle" type="button" aria-label="拖动排序" title="拖动排序">≡</button>
      `;
      const button = li.querySelector(".mainline-list-button");
      const dragHandle = li.querySelector(".drag-handle");
      button.addEventListener("click", () => selectMainline(mainline.id));
      dragHandle.addEventListener("pointerdown", (event) =>
        startMainlineDrag(event, li),
      );
      els.mainlineList.appendChild(li);
    });

    els.deleteMainline.disabled = !selected;
    els.mainlineEditorEmpty.hidden = Boolean(selected);
    els.mainlineForm.hidden = !selected;

    if (!selected) {
      return;
    }

    els.mainlineTitleInput.value = selected.title;
    els.mainlineWhyInput.value = selected.why;
    els.mainlineOutcomeInput.value = selected.outcome;
    els.mainlineFirstStepInput.value = selected.firstStep;
    els.mainlineHowWhereInput.value = selected.howWhere;
    els.mainlineCostInput.value = selected.costOfNotDoing;
    refreshAutoResizeTextareas(els.mainlineForm);
  }

  function renderPrinciplesDialog() {
    const selected = ensureSelectedPrinciple();
    const sortedPrinciples = getSortedPrinciples();

    els.principleCount.textContent = `${sortedPrinciples.length} 条`;
    els.principleEmpty.hidden = sortedPrinciples.length > 0;
    els.principleList.hidden = sortedPrinciples.length === 0;
    els.principleList.innerHTML = "";

    sortedPrinciples.forEach((principle, index) => {
      const li = document.createElement("li");
      li.className = "mainline-list-item sortable-item";
      li.dataset.dragId = principle.id;
      li.innerHTML = `
        <button type="button" class="mainline-list-button${principle.id === selected?.id ? " is-active" : ""}">
          <span class="mainline-list-title">${escapeHtml(getPrincipleListLabel(principle, index))}</span>
          <span class="mainline-list-meta">${principle.points.length} 条原则点 · 拖动排序 ${index + 1}</span>
        </button>
        <button class="small-button drag-handle mainline-drag-handle" type="button" aria-label="拖动排序" title="拖动排序">≡</button>
      `;
      const button = li.querySelector(".mainline-list-button");
      const dragHandle = li.querySelector(".drag-handle");
      button.addEventListener("click", () => selectPrinciple(principle.id));
      dragHandle.addEventListener("pointerdown", (event) =>
        startPrincipleDrag(event, li),
      );
      els.principleList.appendChild(li);
    });

    els.deletePrinciple.disabled = !selected;
    els.principleEditorEmpty.hidden = Boolean(selected);
    els.principleForm.hidden = !selected;

    if (!selected) {
      return;
    }

    els.principleTitleInput.value = selected.title;
    renderPrinciplePoints(selected.points);
    refreshAutoResizeTextareas(els.principleForm);
  }

  function renderInterestsDialog() {
    const selected = ensureSelectedInterest();
    const sortedInterests = getSortedInterests();

    els.interestCount.textContent = `${sortedInterests.length} 条`;
    els.interestEmpty.hidden = sortedInterests.length > 0;
    els.interestList.hidden = sortedInterests.length === 0;
    els.interestList.innerHTML = "";

    sortedInterests.forEach((interest, index) => {
      const li = document.createElement("li");
      li.className = "mainline-list-item sortable-item";
      li.dataset.dragId = interest.id;
      li.innerHTML = `
        <button type="button" class="mainline-list-button${interest.id === selected?.id ? " is-active" : ""}">
          <span class="mainline-list-title">${escapeHtml(getInterestListLabel(interest, index))}</span>
          <span class="mainline-list-meta">拖动排序 ${index + 1}</span>
        </button>
        <button class="small-button drag-handle mainline-drag-handle" type="button" aria-label="拖动排序" title="拖动排序">≡</button>
      `;
      const button = li.querySelector(".mainline-list-button");
      const dragHandle = li.querySelector(".drag-handle");
      button.addEventListener("click", () => selectInterest(interest.id));
      dragHandle.addEventListener("pointerdown", (event) =>
        startInterestDrag(event, li),
      );
      els.interestList.appendChild(li);
    });

    els.deleteInterest.disabled = !selected;
    els.interestEditorEmpty.hidden = Boolean(selected);
    els.interestForm.hidden = !selected;

    if (!selected) {
      return;
    }

    els.interestInput.value = selected.content;
    refreshAutoResizeTextareas(els.interestForm);
  }

  function renderPrinciplePoints(points) {
    els.principlePoints.innerHTML = "";
    els.principlePointsEmpty.hidden = points.length > 0;

    points.forEach((point, index) => {
      const item = document.createElement("div");
      item.className = "principle-point-item";

      const header = document.createElement("div");
      header.className = "principle-point-header";

      const label = document.createElement("span");
      label.className = "principle-point-index";
      label.textContent = `原则点 ${index + 1}`;
      header.appendChild(label);

      const actions = document.createElement("div");
      actions.className = "principle-point-actions";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "small-button danger";
      deleteButton.textContent = "删";
      deleteButton.setAttribute("aria-label", `删除原则点 ${index + 1}`);
      deleteButton.addEventListener("click", () => {
        deletePrinciplePoint(point.id);
      });
      actions.appendChild(deleteButton);

      header.appendChild(actions);
      item.appendChild(header);

      const textarea = document.createElement("textarea");
      textarea.className = "principle-point-input";
      textarea.value = point.text;
      textarea.placeholder = "例如：先保护最重要的那件事，再处理杂音。";
      textarea.setAttribute("data-point-id", point.id);
      item.appendChild(textarea);

      els.principlePoints.appendChild(item);
    });

    refreshAutoResizeTextareas(els.principlePoints);
  }

  function focusMainlineTitleInput() {
    requestAnimationFrame(() => {
      if (els.mainlineForm.hidden) return;
      els.mainlineTitleInput.focus();
      const value = els.mainlineTitleInput.value;
      els.mainlineTitleInput.setSelectionRange(value.length, value.length);
    });
  }

  function focusPrincipleTitleInput() {
    requestAnimationFrame(() => {
      if (els.principleForm.hidden) return;
      els.principleTitleInput.focus();
      const value = els.principleTitleInput.value;
      els.principleTitleInput.setSelectionRange(value.length, value.length);
    });
  }

  function focusPrinciplePointInput(pointId) {
    requestAnimationFrame(() => {
      const input = els.principlePoints.querySelector(`[data-point-id="${pointId}"]`);
      if (!input) return;
      input.focus();
      const value = input.value;
      input.setSelectionRange(value.length, value.length);
    });
  }

  function focusInterestInput() {
    requestAnimationFrame(() => {
      if (els.interestForm.hidden) return;
      els.interestInput.focus();
      const value = els.interestInput.value;
      els.interestInput.setSelectionRange(value.length, value.length);
    });
  }

  function updateSelectedMainlineFromForm() {
    const selected = getSelectedMainline();
    if (!selected || els.mainlineForm.hidden) {
      return selected;
    }

    selected.title = els.mainlineTitleInput.value.trim();
    selected.why = els.mainlineWhyInput.value.trim();
    selected.outcome = els.mainlineOutcomeInput.value.trim();
    selected.firstStep = els.mainlineFirstStepInput.value.trim();
    selected.howWhere = els.mainlineHowWhereInput.value.trim();
    selected.costOfNotDoing = els.mainlineCostInput.value.trim();
    selected.updatedAt = new Date().toISOString();
    return selected;
  }

  function updateSelectedPrincipleFromForm() {
    const selected = getSelectedPrinciple();
    if (!selected || els.principleForm.hidden) {
      return selected;
    }

    selected.title = els.principleTitleInput.value.trim();
    selected.points = Array.from(els.principlePoints.querySelectorAll("[data-point-id]")).map(
      (input) =>
        createPrinciplePoint({
          id: input.getAttribute("data-point-id"),
          text: input.value.trim(),
        }),
    );
    selected.updatedAt = new Date().toISOString();
    return selected;
  }

  function updateSelectedInterestFromForm() {
    const selected = getSelectedInterest();
    if (!selected || els.interestForm.hidden) {
      return selected;
    }

    selected.content = els.interestInput.value.trim();
    selected.updatedAt = new Date().toISOString();
    return selected;
  }

  function openMainlineDialog() {
    ensureSelectedMainline();
    renderMainlineDialog();
    if (!els.mainlineDialog.open) {
      els.mainlineDialog.showModal();
    }
    if (getSelectedMainline()) {
      focusMainlineTitleInput();
    }
  }

  function closeMainlineDialog() {
    updateSelectedMainlineFromForm();
    if (els.mainlineDialog.open) {
      els.mainlineDialog.close();
    }
  }

  function openPrinciplesDialog() {
    ensureSelectedPrinciple();
    renderPrinciplesDialog();
    if (!els.principlesDialog.open) {
      els.principlesDialog.showModal();
    }
    if (getSelectedPrinciple()) {
      focusPrincipleTitleInput();
    }
  }

  function closePrinciplesDialog() {
    updateSelectedPrincipleFromForm();
    if (els.principlesDialog.open) {
      els.principlesDialog.close();
    }
  }

  function openInterestsDialog() {
    ensureSelectedInterest();
    renderInterestsDialog();
    if (!els.interestsDialog.open) {
      els.interestsDialog.showModal();
    }
    if (getSelectedInterest()) {
      focusInterestInput();
    }
  }

  function closeInterestsDialog() {
    updateSelectedInterestFromForm();
    if (els.interestsDialog.open) {
      els.interestsDialog.close();
    }
  }

  function selectMainline(id) {
    updateSelectedMainlineFromForm();
    selectedMainlineId = id;
    renderMainlineDialog();
  }

  function selectPrinciple(id) {
    updateSelectedPrincipleFromForm();
    selectedPrincipleId = id;
    renderPrinciplesDialog();
  }

  function selectInterest(id) {
    updateSelectedInterestFromForm();
    selectedInterestId = id;
    renderInterestsDialog();
  }

  function normalizeOrders() {
    state.habits
      .sort((a, b) => a.order - b.order)
      .forEach((habit, index) => {
        habit.order = index;
      });

    state.mainlines = createOrderedList(state.mainlines);
    state.principles = createOrderedList(state.principles);
    state.interests = createOrderedList(state.interests);
  }

  async function addHabit() {
    const title = els.habitTitleInput.value.trim();
    if (!title) return;
    state.habits.push({
      id: uid(),
      title,
      active: true,
      order: state.habits.length,
      createdAt: new Date().toISOString(),
    });
    els.habitTitleInput.value = "";
    await persistAll();
  }

  function queueHabitTitleSave(id, nextTitle) {
    window.setTimeout(() => {
      saveHabitTitle(id, nextTitle);
    }, 0);
  }

  async function saveHabitTitle(id, nextTitle) {
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) return;
    const title = nextTitle.trim();
    if (!title) {
      if (listDrag.item) return;
      renderSettings();
      return;
    }
    if (title === habit.title) {
      return;
    }
    habit.title = title;
    if (listDrag.item) {
      return;
    }
    await persistAll();
  }

  async function reorderHabits(nextIds) {
    await reorderCollection(state.habits, nextIds, renderSettings);
  }

  async function reorderMainlines(nextIds) {
    updateSelectedMainlineFromForm();
    await reorderCollection(state.mainlines, nextIds, renderMainlineDialog);
  }

  async function reorderPrinciples(nextIds) {
    updateSelectedPrincipleFromForm();
    await reorderCollection(state.principles, nextIds, renderPrinciplesDialog);
  }

  async function reorderInterests(nextIds) {
    updateSelectedInterestFromForm();
    await reorderCollection(state.interests, nextIds, renderInterestsDialog);
  }

  async function reorderCollection(items, nextIds, renderFallback) {
    const nextOrder = new Map(nextIds.map((id, index) => [id, index]));
    let changed = false;

    items.forEach((item) => {
      const order = nextOrder.get(item.id);
      if (order === undefined || item.order === order) return;
      item.order = order;
      changed = true;
    });

    if (changed) {
      await persistAll();
    } else {
      renderFallback();
    }
  }

  async function moveHabit(id, delta) {
    const sorted = state.habits.slice().sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((habit) => habit.id === id);
    if (index < 0) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= sorted.length) return;
    [sorted[index], sorted[nextIndex]] = [sorted[nextIndex], sorted[index]];
    sorted.forEach((habit, order) => {
      const target = state.habits.find((item) => item.id === habit.id);
      if (target) target.order = order;
    });
    await persistAll();
  }

  async function toggleHabit(id) {
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) return;
    habit.active = habit.active === false;
    await persistAll();
  }

  async function deleteHabit(id) {
    state.habits = state.habits.filter((habit) => habit.id !== id);
    Object.keys(state.completions).forEach((date) => {
      state.completions[date] = (state.completions[date] || []).filter(
        (habitId) => habitId !== id,
      );
    });
    normalizeOrders();
    await persistAll();
  }

  function startHabitDrag(event, item) {
    startListDrag(event, {
      list: els.habitList,
      item,
      itemSelector: ".habit-item.sortable-item[data-drag-id]",
      onReorder: reorderHabits,
    });
  }

  function startMainlineDrag(event, item) {
    updateSelectedMainlineFromForm();
    startListDrag(event, {
      list: els.mainlineList,
      item,
      itemSelector: ".mainline-list-item.sortable-item[data-drag-id]",
      onReorder: reorderMainlines,
    });
  }

  function startPrincipleDrag(event, item) {
    updateSelectedPrincipleFromForm();
    startListDrag(event, {
      list: els.principleList,
      item,
      itemSelector: ".mainline-list-item.sortable-item[data-drag-id]",
      onReorder: reorderPrinciples,
    });
  }

  function startInterestDrag(event, item) {
    updateSelectedInterestFromForm();
    startListDrag(event, {
      list: els.interestList,
      item,
      itemSelector: ".mainline-list-item.sortable-item[data-drag-id]",
      onReorder: reorderInterests,
    });
  }

  function startListDrag(event, { list, item, itemSelector, onReorder }) {
    if (event.button !== 0 || listDrag.item || !list || list.querySelectorAll(itemSelector).length < 2) {
      return;
    }

    const rect = item.getBoundingClientRect();
    const placeholder = document.createElement("li");
    placeholder.className = `${item.className} drag-sort-placeholder`;
    placeholder.style.height = `${rect.height}px`;

    listDrag.pointerId = event.pointerId;
    listDrag.item = item;
    listDrag.handle = event.currentTarget;
    listDrag.placeholder = placeholder;
    listDrag.list = list;
    listDrag.itemSelector = itemSelector;
    listDrag.onReorder = onReorder;
    listDrag.offsetY = event.clientY - rect.top;

    item.after(placeholder);
    item.classList.add("is-dragging");
    item.style.height = `${rect.height}px`;
    item.style.width = `${rect.width}px`;
    item.style.left = `${rect.left}px`;
    item.style.top = `${rect.top}px`;
    document.body.classList.add("habit-dragging");

    if (listDrag.handle instanceof HTMLElement) {
      listDrag.handle.setPointerCapture(event.pointerId);
    }

    updateListDragPosition(event.clientY);
    document.addEventListener("pointermove", handleListDragMove);
    document.addEventListener("pointerup", handleListDragEnd);
    document.addEventListener("pointercancel", handleListDragEnd);
  }

  function updateListDragPosition(clientY) {
    if (!listDrag.item || !listDrag.placeholder || !listDrag.list) return;

    listDrag.item.style.top = `${clientY - listDrag.offsetY}px`;

    const siblings = Array.from(listDrag.list.querySelectorAll(listDrag.itemSelector)).filter(
      (element) => element !== listDrag.item,
    );
    const nextSibling = siblings.find((element) => {
      const rect = element.getBoundingClientRect();
      return clientY < rect.top + rect.height / 2;
    });

    if (nextSibling) {
      listDrag.list.insertBefore(listDrag.placeholder, nextSibling);
    } else {
      listDrag.list.appendChild(listDrag.placeholder);
    }
  }

  function handleListDragMove(event) {
    if (event.pointerId !== listDrag.pointerId) return;
    event.preventDefault();
    updateListDragPosition(event.clientY);
  }

  async function handleListDragEnd(event) {
    if (event.pointerId !== listDrag.pointerId || !listDrag.item || !listDrag.placeholder) {
      return;
    }

    document.removeEventListener("pointermove", handleListDragMove);
    document.removeEventListener("pointerup", handleListDragEnd);
    document.removeEventListener("pointercancel", handleListDragEnd);

    if (listDrag.handle instanceof HTMLElement && listDrag.handle.hasPointerCapture(event.pointerId)) {
      listDrag.handle.releasePointerCapture(event.pointerId);
    }

    const { item, placeholder, list, itemSelector, onReorder } = listDrag;
    placeholder.replaceWith(item);
    item.classList.remove("is-dragging");
    item.style.height = "";
    item.style.width = "";
    item.style.left = "";
    item.style.top = "";
    document.body.classList.remove("habit-dragging");

    const nextIds = Array.from(list.querySelectorAll(itemSelector)).map(
      (element) => element.dataset.dragId,
    );

    listDrag.kind = null;
    listDrag.pointerId = null;
    listDrag.item = null;
    listDrag.handle = null;
    listDrag.placeholder = null;
    listDrag.list = null;
    listDrag.itemSelector = "";
    listDrag.onReorder = null;
    listDrag.offsetY = 0;

    await onReorder(nextIds);
  }

  async function addMainline() {
    updateSelectedMainlineFromForm();
    const mainline = createMainline(
      {
        title: `新的主线 ${state.mainlines.length + 1}`,
        order: state.mainlines.length,
      },
      state.mainlines.length,
    );
    state.mainlines.push(mainline);
    selectedMainlineId = mainline.id;
    await persistAll();
    focusMainlineTitleInput();
  }

  async function moveMainline(delta) {
    updateSelectedMainlineFromForm();
    const sortedMainlines = getSortedMainlines();
    const index = sortedMainlines.findIndex((mainline) => mainline.id === selectedMainlineId);
    if (index < 0) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= sortedMainlines.length) return;
    [sortedMainlines[index], sortedMainlines[nextIndex]] = [
      sortedMainlines[nextIndex],
      sortedMainlines[index],
    ];
    sortedMainlines.forEach((mainline, order) => {
      const target = state.mainlines.find((item) => item.id === mainline.id);
      if (target) target.order = order;
    });
    await persistAll();
  }

  async function deleteSelectedMainline() {
    const selected = getSelectedMainline();
    if (!selected) return;
    const selectedIndex = getSortedMainlines().findIndex((mainline) => mainline.id === selected.id);
    if (!confirm(`确定删除“${getMainlineListLabel(selected, Math.max(selectedIndex, 0))}”吗？`)) {
      return;
    }

    state.mainlines = state.mainlines.filter((mainline) => mainline.id !== selected.id);
    selectedMainlineId = getSortedMainlines()[0]?.id || null;
    await persistAll();
  }

  async function addPrinciple() {
    updateSelectedPrincipleFromForm();
    const principle = createPrinciple(
      {
        title: `新的原则 ${state.principles.length + 1}`,
        order: state.principles.length,
      },
      state.principles.length,
    );
    state.principles.push(principle);
    selectedPrincipleId = principle.id;
    await persistAll();
    focusPrincipleTitleInput();
  }

  async function movePrinciple(delta) {
    updateSelectedPrincipleFromForm();
    const sortedPrinciples = getSortedPrinciples();
    const index = sortedPrinciples.findIndex((principle) => principle.id === selectedPrincipleId);
    if (index < 0) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= sortedPrinciples.length) return;
    [sortedPrinciples[index], sortedPrinciples[nextIndex]] = [
      sortedPrinciples[nextIndex],
      sortedPrinciples[index],
    ];
    sortedPrinciples.forEach((principle, order) => {
      const target = state.principles.find((item) => item.id === principle.id);
      if (target) target.order = order;
    });
    await persistAll();
  }

  async function deleteSelectedPrinciple() {
    const selected = getSelectedPrinciple();
    if (!selected) return;
    const selectedIndex = getSortedPrinciples().findIndex((principle) => principle.id === selected.id);
    if (!confirm(`确定删除“${getPrincipleListLabel(selected, Math.max(selectedIndex, 0))}”吗？`)) {
      return;
    }

    state.principles = state.principles.filter((principle) => principle.id !== selected.id);
    selectedPrincipleId = getSortedPrinciples()[0]?.id || null;
    await persistAll();
  }

  function addPrinciplePoint() {
    const selected = updateSelectedPrincipleFromForm();
    if (!selected) {
      return;
    }

    const point = createPrinciplePoint();
    selected.points.push(point);
    selected.updatedAt = new Date().toISOString();
    renderPrinciplesDialog();
    focusPrinciplePointInput(point.id);
  }

  function deletePrinciplePoint(pointId) {
    const selected = updateSelectedPrincipleFromForm();
    if (!selected) return;
    selected.points = selected.points.filter((point) => point.id !== pointId);
    selected.updatedAt = new Date().toISOString();
    renderPrinciplesDialog();
  }

  async function addInterest() {
    updateSelectedInterestFromForm();
    const interest = createInterest(
      {
        content: `新的兴趣 ${state.interests.length + 1}`,
        order: state.interests.length,
      },
      state.interests.length,
    );
    state.interests.push(interest);
    selectedInterestId = interest.id;
    await persistAll();
    focusInterestInput();
  }

  async function moveInterest(delta) {
    updateSelectedInterestFromForm();
    const sortedInterests = getSortedInterests();
    const index = sortedInterests.findIndex((interest) => interest.id === selectedInterestId);
    if (index < 0) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= sortedInterests.length) return;
    [sortedInterests[index], sortedInterests[nextIndex]] = [
      sortedInterests[nextIndex],
      sortedInterests[index],
    ];
    sortedInterests.forEach((interest, order) => {
      const target = state.interests.find((item) => item.id === interest.id);
      if (target) target.order = order;
    });
    await persistAll();
  }

  async function deleteSelectedInterest() {
    const selected = getSelectedInterest();
    if (!selected) return;
    const selectedIndex = getSortedInterests().findIndex((interest) => interest.id === selected.id);
    if (!confirm(`确定删除“${getInterestListLabel(selected, Math.max(selectedIndex, 0))}”吗？`)) {
      return;
    }

    state.interests = state.interests.filter((interest) => interest.id !== selected.id);
    selectedInterestId = getSortedInterests()[0]?.id || null;
    await persistAll();
  }

  async function completeCurrentHabit() {
    if (!state.currentHabitId) return;
    await markHabitComplete(state.currentHabitId);
  }

  async function markHabitComplete(id) {
    const completed = new Set(getTodayCompletions());
    if (completed.has(id)) return;
    completed.add(id);
    setTodayCompletions(Array.from(completed));
    state.skippedToday = state.skippedToday.filter((habitId) => habitId !== id);
    await persistAll();
  }

  async function markHabitIncomplete(id) {
    const completed = new Set(getTodayCompletions());
    if (!completed.has(id)) return;
    completed.delete(id);
    setTodayCompletions(Array.from(completed));
    state.skippedToday = state.skippedToday.filter((habitId) => habitId !== id);
    await persistAll();
  }

  function skipCurrentHabit() {
    if (!state.currentHabitId) return;
    if (!state.skippedToday.includes(state.currentHabitId)) {
      state.skippedToday.push(state.currentHabitId);
    }
    renderMain();
  }

  async function saveMainline() {
    const selected = updateSelectedMainlineFromForm();
    if (!selected) {
      alert("请先新增一条主线。");
      return;
    }
    if (!selected.title) {
      alert("请先写主线名称。");
      focusMainlineTitleInput();
      return;
    }
    await persistAll();
  }

  async function savePrinciple() {
    const selected = updateSelectedPrincipleFromForm();
    if (!selected) {
      alert("请先新增一个原则板块。");
      return;
    }
    if (!selected.title) {
      alert("请先写原则板块名称。");
      focusPrincipleTitleInput();
      return;
    }
    await persistAll();
  }

  async function saveInterest() {
    const selected = updateSelectedInterestFromForm();
    if (!selected) {
      alert("请先新增一条兴趣。");
      return;
    }
    if (!selected.content) {
      alert("请先写兴趣内容。");
      focusInterestInput();
      return;
    }
    await persistAll();
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getSupabaseSetupStatus() {
    const config = window.APP_CONFIG || {};
    const hasUrl =
      typeof config.supabaseUrl === "string" && config.supabaseUrl.trim().length > 0;
    const hasKey =
      typeof config.supabaseAnonKey === "string" &&
      config.supabaseAnonKey.trim().length > 0;
    const hasSdk = typeof window.supabase?.createClient === "function";

    if (!hasUrl || !hasKey) {
      return {
        ready: false,
        reason: "config-missing",
        message:
          "未读取到 Supabase 配置，请检查 config.js 是否已更新；如果刚改过配置，请先清除站点缓存再刷新。",
      };
    }

    if (!hasSdk) {
      return {
        ready: false,
        reason: "sdk-missing",
        message:
          "已检测到 Supabase 配置，但 Supabase SDK 没有加载成功。请检查网络，或确认浏览器没有使用旧缓存。",
      };
    }

    return {
      ready: true,
      reason: "ready",
      message: "已检测到 Supabase 配置，登录后可在多设备之间同步。",
    };
  }

  const localProvider = {
    async init() {
      hydrateStateFromSavedState();
      state.mode = "local";
      state.session = null;
    },
    async persist() {
      saveLocalState();
    },
    async signIn() {
      throw new Error(getSupabaseSetupStatus().message);
    },
    async signUp() {
      throw new Error(getSupabaseSetupStatus().message);
    },
    async signOut() {
      return;
    },
  };

  function createSupabaseProvider(config) {
    const client = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );

    async function syncContentCollection(tableName, payload, userId) {
      try {
        if (payload) {
          const { error } = await client.from(tableName).upsert(
            {
              user_id: userId,
              content: payload,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
          if (error) throw error;
        } else {
          const { error } = await client.from(tableName).delete().eq("user_id", userId);
          if (error) throw error;
        }
        return { missingSchema: false };
      } catch (error) {
        if (isMissingContentTableError(error, tableName)) {
          return { missingSchema: true };
        }
        throw error;
      }
    }

    async function fetchContentCollection(tableName) {
      try {
        const { data, error } = await client.from(tableName).select("content").maybeSingle();
        if (error) throw error;
        return { missingSchema: false, content: data?.content || "" };
      } catch (error) {
        if (isMissingContentTableError(error, tableName)) {
          return { missingSchema: true, content: "" };
        }
        throw error;
      }
    }

    async function getSessionOrNull() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    }

    async function fetchHabits() {
      const savedState = loadLocalState();
      const session = await getSessionOrNull();
      state.session = session;

      if (!session) {
        hydrateStateFromSavedState();
        state.mode = "local";
        state.supabaseNotice = "";
        return;
      }

      const [{ data: habits, error: habitsError }, { data: completions, error: completionsError }] =
        await Promise.all([
          client
            .from("habits")
            .select("id,title,active,sort_order,created_at")
            .order("sort_order", { ascending: true }),
          client
            .from("habit_completions")
            .select("habit_id,completed_on")
            .eq("completed_on", TODAY()),
        ]);

      if (habitsError) throw habitsError;
      if (completionsError) throw completionsError;

      state.habits = (habits || []).map((habit, index) => ({
        id: habit.id,
        title: habit.title,
        active: habit.active,
        order: habit.sort_order ?? index,
        createdAt: habit.created_at,
      }));

      state.completions = {
        [TODAY()]: (completions || []).map((item) => item.habit_id),
      };

      const [mainlineResult, principleResult, interestResult] = await Promise.all([
        fetchContentCollection("user_mainlines"),
        fetchContentCollection("user_principles"),
        fetchContentCollection("user_interests"),
      ]);

      state.mainlines = mainlineResult.missingSchema
        ? parseMainlinesContent(savedState.mainlines, savedState.mainline)
        : parseMainlinesPayload(mainlineResult.content);
      state.principles = principleResult.missingSchema
        ? parsePrinciplesContent(savedState.principles)
        : parsePrinciplesPayload(principleResult.content);
      state.interests = interestResult.missingSchema
        ? parseInterestsContent(savedState.interests)
        : parseInterestsPayload(interestResult.content);

      selectedMainlineId = getSortedMainlines()[0]?.id || null;
      selectedPrincipleId = getSortedPrinciples()[0]?.id || null;
      selectedInterestId = getSortedInterests()[0]?.id || null;
      state.supabaseNotice =
        mainlineResult.missingSchema ||
        principleResult.missingSchema ||
        interestResult.missingSchema
          ? getContentSchemaNotice()
          : "";
      state.mode = "supabase";
    }

    return {
      async init() {
        await fetchHabits();
      },
      async persist() {
        const session = await getSessionOrNull();
        if (!session) {
          saveLocalState();
          return;
        }

        const userId = session.user.id;
        const remoteHabits = state.habits.map((habit, index) => ({
          id: habit.id,
          user_id: userId,
          title: habit.title,
          active: habit.active !== false,
          sort_order: habit.order ?? index,
          created_at: habit.createdAt || new Date().toISOString(),
        }));

        await client.from("habits").delete().eq("user_id", userId);
        if (remoteHabits.length) {
          const { error } = await client.from("habits").insert(remoteHabits);
          if (error) throw error;
        }

        const completionRows = getTodayCompletions().map((habitId) => ({
          user_id: userId,
          habit_id: habitId,
          completed_on: TODAY(),
          completed_at: new Date().toISOString(),
        }));

        await client
          .from("habit_completions")
          .delete()
          .eq("user_id", userId)
          .eq("completed_on", TODAY());
        if (completionRows.length) {
          const { error } = await client.from("habit_completions").insert(completionRows);
          if (error) throw error;
        }

        const [mainlineSync, principleSync, interestSync] = await Promise.all([
          syncContentCollection("user_mainlines", serializeMainlinesPayload(), userId),
          syncContentCollection("user_principles", serializePrinciplesPayload(), userId),
          syncContentCollection("user_interests", serializeInterestsPayload(), userId),
        ]);

        state.supabaseNotice =
          mainlineSync.missingSchema ||
          principleSync.missingSchema ||
          interestSync.missingSchema
            ? getContentSchemaNotice()
            : "";
      },
      async signIn(email, password) {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await fetchHabits();
      },
      async signUp(email, password) {
        const { error } = await client.auth.signUp({ email, password });
        if (error) throw error;
        await fetchHabits();
      },
      async signOut() {
        const { error } = await client.auth.signOut();
        if (error) throw error;
        state.mode = "local";
        state.session = null;
        hydrateStateFromSavedState();
      },
    };
  }

  let provider = localProvider;

  async function persistAll() {
    normalizeOrders();
    saveLocalState();
    await provider.persist();
    renderMain();
    renderMainlineDialog();
    renderPrinciplesDialog();
    renderInterestsDialog();
    renderSettings();
  }

  async function initProvider() {
    const setupStatus = getSupabaseSetupStatus();
    if (setupStatus.ready) {
      provider = createSupabaseProvider(window.APP_CONFIG || {});
    }

    try {
      await provider.init();
    } catch (error) {
      console.error("Supabase init failed:", error);
      provider = localProvider;
      await provider.init();
      state.supabaseNotice = `Supabase 初始化失败，已切回本地模式：${getErrorMessage(error)}`;
    }

    renderMain();
    renderMainlineDialog();
    renderPrinciplesDialog();
    renderSettings();
  }

  async function handleAuth(action) {
    const email = els.authEmail.value.trim();
    const password = els.authPassword.value.trim();
    if (!email || !password) {
      alert("请先输入邮箱和密码。");
      return;
    }

    try {
      if (action === "signin") {
        await provider.signIn(email, password);
      } else {
        await provider.signUp(email, password);
      }
      await provider.persist();
      renderMain();
      renderMainlineDialog();
      renderPrinciplesDialog();
      renderInterestsDialog();
      renderSettings();
    } catch (error) {
      alert(error.message || "认证失败");
    }
  }

  function wireEvents() {
    els.openMainline.addEventListener("click", openMainlineDialog);
    els.mainlineClose.addEventListener("click", closeMainlineDialog);
    els.addMainline.addEventListener("click", addMainline);
    els.deleteMainline.addEventListener("click", deleteSelectedMainline);
    els.saveMainline.addEventListener("click", saveMainline);
    els.mainlineDialog.addEventListener("close", () => {
      updateSelectedMainlineFromForm();
      renderMainlineDialog();
    });

    els.openPrinciples.addEventListener("click", openPrinciplesDialog);
    els.principlesClose.addEventListener("click", closePrinciplesDialog);
    els.addPrinciple.addEventListener("click", addPrinciple);
    els.deletePrinciple.addEventListener("click", deleteSelectedPrinciple);
    els.addPrinciplePoint.addEventListener("click", addPrinciplePoint);
    els.savePrinciple.addEventListener("click", savePrinciple);
    els.principlesDialog.addEventListener("close", () => {
      updateSelectedPrincipleFromForm();
      renderPrinciplesDialog();
    });

    els.openInterests.addEventListener("click", openInterestsDialog);
    els.interestsClose.addEventListener("click", closeInterestsDialog);
    els.addInterest.addEventListener("click", addInterest);
    els.deleteInterest.addEventListener("click", deleteSelectedInterest);
    els.saveInterest.addEventListener("click", saveInterest);
    els.interestsDialog.addEventListener("close", () => {
      updateSelectedInterestFromForm();
      renderInterestsDialog();
    });

    els.openSettings.addEventListener("click", () => els.settingsDialog.showModal());
    els.completeTask.addEventListener("click", completeCurrentHabit);
    els.skipTask.addEventListener("click", skipCurrentHabit);
    els.addHabit.addEventListener("click", addHabit);
    els.signIn.addEventListener("click", () => handleAuth("signin"));
    els.signUp.addEventListener("click", () => handleAuth("signup"));
    els.signOut.addEventListener("click", async () => {
      try {
        await provider.signOut();
        renderMain();
        renderMainlineDialog();
        renderPrinciplesDialog();
        renderInterestsDialog();
        renderSettings();
      } catch (error) {
        alert(error.message || "退出失败");
      }
    });

    document.addEventListener("input", (event) => {
      if (event.target instanceof HTMLTextAreaElement) {
        autoResizeTextarea(event.target);
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && document.activeElement === els.habitTitleInput) {
      addHabit();
    }
  });

  wireEvents();
  renderAppVersion();
  initProvider();
  refreshAutoResizeTextareas();

  const timerEls = {
    dialog: document.getElementById("timer-dialog"),
    openBtn: document.getElementById("open-timer"),
    closeBtn: document.getElementById("timer-close"),
    setup: document.getElementById("timer-setup"),
    running: document.getElementById("timer-running"),
    taskInput: document.getElementById("timer-task-input"),
    durationInput: document.getElementById("timer-duration-input"),
    startBtn: document.getElementById("timer-start"),
    pauseBtn: document.getElementById("timer-pause"),
    resetBtn: document.getElementById("timer-reset"),
    taskName: document.getElementById("timer-task-name"),
    display: document.getElementById("timer-display"),
    progress: document.getElementById("timer-progress"),
  };

  let timerInterval = null;
  let timerRemaining = 0;
  let timerTotal = 0;
  let timerPaused = false;

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateTimerDisplay() {
    timerEls.display.textContent = formatTime(timerRemaining);
    const pct = timerTotal > 0 ? ((timerTotal - timerRemaining) / timerTotal) * 100 : 0;
    timerEls.progress.style.width = `${100 - pct}%`;
  }

  function startTimer() {
    const task = timerEls.taskInput.value.trim() || "专注任务";
    const minutes = parseInt(timerEls.durationInput.value, 10);
    if (!minutes || minutes < 1) {
      alert("请输入有效的时长（至少 1 分钟）。");
      return;
    }

    timerTotal = minutes * 60;
    timerRemaining = timerTotal;
    timerPaused = false;
    timerEls.taskName.textContent = task;
    timerEls.pauseBtn.textContent = "暂停";
    timerEls.setup.hidden = true;
    timerEls.running.hidden = false;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      if (timerPaused) return;
      timerRemaining--;
      updateTimerDisplay();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerEls.display.textContent = "完成！";
        timerEls.progress.style.width = "0%";
        timerEls.pauseBtn.disabled = true;
        if (Notification.permission === "granted") {
          new Notification("倒计时结束", { body: `「${task}」已完成！` });
        }
      }
    }, 1000);
  }

  function pauseTimer() {
    if (timerRemaining <= 0) return;
    timerPaused = !timerPaused;
    timerEls.pauseBtn.textContent = timerPaused ? "继续" : "暂停";
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRemaining = 0;
    timerTotal = 0;
    timerPaused = false;
    timerEls.pauseBtn.disabled = false;
    timerEls.pauseBtn.textContent = "暂停";
    timerEls.setup.hidden = false;
    timerEls.running.hidden = true;
  }

  timerEls.openBtn.addEventListener("click", () => {
    if (!timerEls.dialog.open) timerEls.dialog.showModal();
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  });
  timerEls.closeBtn.addEventListener("click", () => timerEls.dialog.close());
  timerEls.startBtn.addEventListener("click", startTimer);
  timerEls.pauseBtn.addEventListener("click", pauseTimer);
  timerEls.resetBtn.addEventListener("click", resetTimer);
  timerEls.durationInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") startTimer();
  });

  // --- DoneList ---
  const DONELIST_KEY = "micro-habit-donelist-v2";
  const donelistEls = {
    dialog: document.getElementById("donelist-dialog"),
    openBtn: document.getElementById("open-donelist"),
    closeBtn: document.getElementById("donelist-close"),
    copyBtn: document.getElementById("donelist-copy"),
    diet: document.getElementById("donelist-diet"),
    positive: document.getElementById("donelist-positive"),
    morning: document.getElementById("donelist-morning"),
    afternoon: document.getElementById("donelist-afternoon"),
    evening: document.getElementById("donelist-evening"),
    gratitude: document.getElementById("donelist-gratitude"),
    selfPraise: document.getElementById("donelist-self-praise"),
    review: document.getElementById("donelist-review"),
    body: document.getElementById("donelist-body"),
    emotion: document.getElementById("donelist-emotion"),
    emotionKit: document.getElementById("donelist-emotion-kit"),
    vent: document.getElementById("donelist-vent"),
    tomorrowPlan: document.getElementById("donelist-tomorrow-plan"),
  };

  let donelistSaveTimer = null;

  function freshDonelist() {
    return {
      date: TODAY(),
      diet: "",
      positive: "",
      morning: "",
      afternoon: "",
      evening: "",
      gratitude: "",
      selfPraise: "",
      review: "",
      body: "",
      emotion: "",
      emotionKit: "",
      vent: "",
      tomorrowPlan: false,
    };
  }

  function loadDonelist() {
    try {
      const raw = localStorage.getItem(DONELIST_KEY);
      if (!raw) return freshDonelist();
      const data = JSON.parse(raw);
      if (data.date !== TODAY()) {
        localStorage.removeItem(DONELIST_KEY);
        return freshDonelist();
      }
      return { ...freshDonelist(), ...data };
    } catch {
      return freshDonelist();
    }
  }

  function collectDonelistData() {
    return {
      date: TODAY(),
      diet: donelistEls.diet.value,
      positive: donelistEls.positive.value,
      morning: donelistEls.morning.value,
      afternoon: donelistEls.afternoon.value,
      evening: donelistEls.evening.value,
      gratitude: donelistEls.gratitude.value,
      selfPraise: donelistEls.selfPraise.value,
      review: donelistEls.review.value,
      body: donelistEls.body.value,
      emotion: donelistEls.emotion.value,
      emotionKit: donelistEls.emotionKit.value,
      vent: donelistEls.vent.value,
      tomorrowPlan: donelistEls.tomorrowPlan.checked,
    };
  }

  function saveDonelist() {
    const data = collectDonelistData();
    localStorage.setItem(DONELIST_KEY, JSON.stringify(data));
    syncDonelistToSupabase(data);
  }

  function debounceSaveDonelist() {
    clearTimeout(donelistSaveTimer);
    donelistSaveTimer = setTimeout(saveDonelist, 800);
  }

  async function syncDonelistToSupabase(data) {
    if (state.mode !== "supabase" || !state.session) return;
    const config = window.APP_CONFIG || {};
    if (!config.supabaseUrl || !config.supabaseAnonKey) return;
    try {
      const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      const content = JSON.stringify(data);
      await client.from("user_donelist").upsert(
        { user_id: state.session.user.id, content, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    } catch {}
  }

  async function loadDonelistFromSupabase() {
    if (state.mode !== "supabase" || !state.session) return null;
    const config = window.APP_CONFIG || {};
    if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
    try {
      const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      const { data } = await client.from("user_donelist").select("content").maybeSingle();
      if (!data?.content) return null;
      const parsed = JSON.parse(data.content);
      if (parsed.date !== TODAY()) return null;
      return { ...freshDonelist(), ...parsed };
    } catch {
      return null;
    }
  }

  function renderDonelist(data) {
    donelistEls.diet.value = data.diet || "";
    donelistEls.positive.value = data.positive || "";
    donelistEls.morning.value = data.morning || "";
    donelistEls.afternoon.value = data.afternoon || "";
    donelistEls.evening.value = data.evening || "";
    donelistEls.gratitude.value = data.gratitude || "";
    donelistEls.selfPraise.value = data.selfPraise || "";
    donelistEls.review.value = data.review || "";
    donelistEls.body.value = data.body || "";
    donelistEls.emotion.value = data.emotion || "";
    donelistEls.emotionKit.value = data.emotionKit || "";
    donelistEls.vent.value = data.vent || "";
    donelistEls.tomorrowPlan.checked = data.tomorrowPlan === true;
    Object.values(donelistEls).forEach((el) => {
      if (el instanceof HTMLTextAreaElement) autoResizeTextarea(el);
    });
  }

  async function openDonelist() {
    let data = loadDonelist();
    if (state.mode === "supabase" && state.session) {
      const remote = await loadDonelistFromSupabase();
      if (remote) {
        data = remote;
        localStorage.setItem(DONELIST_KEY, JSON.stringify(data));
      }
    }
    renderDonelist(data);
    if (!donelistEls.dialog.open) donelistEls.dialog.showModal();
  }

  function copyDonelist() {
    const d = new Date();
    const dateStr = `#日记/${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    const fields = [
      { label: "饮食", value: donelistEls.diet.value },
      { label: "正向链接（生活中的美好）", value: donelistEls.positive.value },
      { label: "具体事件", value: null, subs: [
        { label: "早上", value: donelistEls.morning.value },
        { label: "中午", value: donelistEls.afternoon.value },
        { label: "晚上", value: donelistEls.evening.value },
      ]},
      { label: "感谢", value: donelistEls.gratitude.value },
      { label: "夸夸自己", value: donelistEls.selfPraise.value },
      { label: "复盘", value: donelistEls.review.value },
      { label: "身体", value: donelistEls.body.value },
      { label: "情绪", value: donelistEls.emotion.value },
      { label: "情绪急救包", value: donelistEls.emotionKit.value },
      { label: "自由发泄区", value: donelistEls.vent.value },
    ];

    const parts = [];
    fields.forEach((f) => {
      if (f.subs) {
        const subParts = f.subs.filter((s) => s.value.trim()).map((s) => `${s.label}:\n${s.value.trim()}`);
        if (subParts.length) {
          parts.push(`• ${f.label}:\n${subParts.join("\n")}`);
        }
      } else {
        const v = f.value.trim();
        if (v) parts.push(`• ${f.label}:\n${v}`);
      }
    });

    const checked = donelistEls.tomorrowPlan.checked ? "✓" : "✗";
    parts.push(`• 明日计划: ${checked} 已自己 / AI 辅助列出了明天的计划`);

    const text = parts.length ? `${dateStr}\n\n${parts.join("\n\n")}` : `${dateStr}\n今天还没有记录。`;
    const doCopy = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise((resolve, reject) => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          document.execCommand("copy");
          resolve();
        } catch (e) {
          reject(e);
        }
        document.body.removeChild(ta);
      });
    };
    doCopy().then(() => {
      const original = donelistEls.copyBtn.textContent;
      donelistEls.copyBtn.textContent = "已复制";
      setTimeout(() => { donelistEls.copyBtn.textContent = original; }, 1500);
    }).catch(() => {
      alert("复制失败，请手动全选后 Ctrl+C 复制。");
    });
  }

  donelistEls.openBtn.addEventListener("click", openDonelist);
  donelistEls.closeBtn.addEventListener("click", () => {
    saveDonelist();
    donelistEls.dialog.close();
  });
  donelistEls.copyBtn.addEventListener("click", copyDonelist);
  const donelistFields = [donelistEls.diet, donelistEls.positive, donelistEls.morning, donelistEls.afternoon, donelistEls.evening, donelistEls.gratitude, donelistEls.selfPraise, donelistEls.review, donelistEls.body, donelistEls.emotion, donelistEls.emotionKit, donelistEls.vent];
  donelistFields.forEach((el) => el.addEventListener("input", debounceSaveDonelist));
  donelistEls.tomorrowPlan.addEventListener("change", debounceSaveDonelist);
})();
