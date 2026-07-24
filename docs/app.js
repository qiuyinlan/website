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
    scoreRules: [],
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
    moodDialog: document.getElementById("mood-dialog"),
    openMood: document.getElementById("open-mood"),
    moodClose: document.getElementById("mood-close"),
    moodProgress: document.getElementById("mood-progress"),
    moodQuestion: document.getElementById("mood-question"),
    moodOptionA: document.getElementById("mood-option-a"),
    moodOptionB: document.getElementById("mood-option-b"),
    bedtimeDialog: document.getElementById("bedtime-dialog"),
    openBedtime: document.getElementById("open-bedtime"),
    bedtimeClose: document.getElementById("bedtime-close"),
    bedtimeProgress: document.getElementById("bedtime-progress"),
    bedtimeMessage: document.getElementById("bedtime-message"),
    bedtimeNext: document.getElementById("bedtime-next"),
    bedtimeDone: document.getElementById("bedtime-done"),
    frogDialog: document.getElementById("frog-dialog"),
    openFrog: document.getElementById("open-frog"),
    frogClose: document.getElementById("frog-close"),
    frogInput: document.getElementById("frog-input"),
    frogAdd: document.getElementById("frog-add"),
    frogList: document.getElementById("frog-list"),
    donelistOpenFrog: document.getElementById("donelist-open-frog"),
    donelistFrogList: document.getElementById("donelist-frog-list"),
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
  let moodStepIndex = 0;
  let bedtimeStepIndex = 0;
  const dismissedMoodSteps = new Set();
  const moodSteps = [
    {
      question: "我想过_____的人生",
      optionA: "用自己的人生来逃避内心的痛苦",
      optionB: "主宰自己的人生，自由地活",
    },
    {
      question: "你相信难受的感觉会消失吗？",
      optionA: "不相信",
      optionB: "相信",
    },
    {
      question: "我担心的事情一定会发生吗，我在害怕什么",
      optionA: "会",
      optionB: "不会",
    },
  ];
  let persistPromise = Promise.resolve();
  let persistPending = false;
  let persistScheduled = false;
  let persistStatusTimer = null;
  let celebrationTimer = null;
  let wasAllHabitsDone = null;
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

  function queueSyncStatus(message, autoClear = false) {
    state.supabaseNotice = message;
    renderSettings();
    if (persistStatusTimer) {
      clearTimeout(persistStatusTimer);
      persistStatusTimer = null;
    }
    if (autoClear) {
      persistStatusTimer = setTimeout(() => {
        if (state.supabaseNotice === message) {
          state.supabaseNotice = "";
          renderSettings();
        }
        persistStatusTimer = null;
      }, 1600);
    }
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

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function isUuid(value) {
    return typeof value === "string" && UUID_PATTERN.test(value);
  }

  function uid() {
    const cryptoApi = globalThis.crypto || {};
    if (typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();

    const bytes =
      typeof cryptoApi.getRandomValues === "function"
        ? cryptoApi.getRandomValues(new Uint8Array(16))
        : Uint8Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
      16,
      20,
    )}-${hex.slice(20)}`;
  }

  function remapStoredHabitIds(idMap, validIds) {
    const remapId = (id) => idMap.get(id) || id;

    Object.keys(state.completions).forEach((date) => {
      const uniqueIds = [];
      const seen = new Set();
      const ids = Array.isArray(state.completions[date]) ? state.completions[date] : [];

      ids.forEach((id) => {
        const nextId = remapId(id);
        if (!validIds.has(nextId) || seen.has(nextId)) return;
        uniqueIds.push(nextId);
        seen.add(nextId);
      });

      if (uniqueIds.length) {
        state.completions[date] = uniqueIds;
      } else {
        delete state.completions[date];
      }
    });

    state.skippedToday = Array.isArray(state.skippedToday)
      ? state.skippedToday.map(remapId).filter((id) => validIds.has(id))
      : [];

    if (state.currentHabitId) {
      const nextCurrentId = remapId(state.currentHabitId);
      state.currentHabitId = validIds.has(nextCurrentId) ? nextCurrentId : null;
    }
  }

  function ensureHabitIdsAreUuids() {
    const idMap = new Map();
    const usedIds = new Set();
    let changed = false;

    state.habits = (Array.isArray(state.habits) ? state.habits : [])
      .map((habit, index) => {
        if (!habit || typeof habit !== "object") {
          changed = true;
          return null;
        }

        const originalId = typeof habit.id === "string" ? habit.id.trim() : "";
        let nextId = originalId;

        if (!isUuid(nextId) || usedIds.has(nextId)) {
          nextId = uid();
          changed = true;
          if (originalId && !idMap.has(originalId)) {
            idMap.set(originalId, nextId);
          }
        }

        usedIds.add(nextId);

        return {
          ...habit,
          id: nextId,
          title: typeof habit.title === "string" ? habit.title : "",
          active: habit.active !== false,
          order: Number.isFinite(habit.order) ? habit.order : index,
          createdAt:
            typeof habit.createdAt === "string" && habit.createdAt.trim()
              ? habit.createdAt
              : new Date().toISOString(),
        };
      })
      .filter(Boolean);

    remapStoredHabitIds(idMap, new Set(state.habits.map((habit) => habit.id)));
    return changed || idMap.size > 0;
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
        scoreRules: state.scoreRules,
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
    state.scoreRules = parseScoreRulesContent(saved.scoreRules);
    ensureHabitIdsAreUuids();
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
    return "当前 Supabase 还是旧版表结构：习惯同步可继续使用，但“主线/原则/兴趣/打分规则”同步需要重新执行最新的 supabase/schema.sql。";
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

  function createScoreRule(partial = {}, fallbackOrder = 0) {
    const rawPoints = Number(partial.points);
    return {
      id: typeof partial.id === "string" && partial.id.trim() ? partial.id : uid(),
      title: typeof partial.title === "string" ? partial.title.trim() : "",
      points: Number.isFinite(rawPoints) ? Math.trunc(rawPoints) : 0,
      active: partial.active !== false,
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

  function getDefaultScoreRules() {
    return [
      createScoreRule({ title: "主动开始困难任务", points: 5, order: 0 }, 0),
      createScoreRule({ title: "完成一个关键行动", points: 10, order: 1 }, 1),
      createScoreRule({ title: "及时复盘并调整", points: 3, order: 2 }, 2),
      createScoreRule({ title: "无意识拖延", points: -5, order: 3 }, 3),
    ];
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

  function normalizeScoreRuleCollection(items) {
    if (!Array.isArray(items)) return [];
    return createOrderedList(
      items
        .map((item, index) => {
          if (typeof item === "string") {
            return createScoreRule({ title: item, points: 0 }, index);
          }
          if (!item || typeof item !== "object") return null;
          return createScoreRule(item, index);
        })
        .filter((rule) => rule && rule.title),
    );
  }

  function parseScoreRulesContent(savedRules) {
    if (!Array.isArray(savedRules)) return getDefaultScoreRules();
    return normalizeScoreRuleCollection(savedRules);
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

  function parseScoreRulesPayload(content) {
    if (typeof content !== "string" || !content.trim()) {
      return getDefaultScoreRules();
    }

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parseScoreRulesContent(parsed);
      }
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return parseScoreRulesContent(parsed.items);
      }
    } catch {
      return getDefaultScoreRules();
    }

    return getDefaultScoreRules();
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

  function serializeScoreRulesPayload() {
    return JSON.stringify({
      version: 1,
      items: getSortedScoreRules().map((rule) => ({
        id: rule.id,
        title: rule.title,
        points: rule.points,
        active: rule.active !== false,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        order: rule.order,
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

  function getSortedScoreRules() {
    return state.scoreRules.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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

  function clearCelebration() {
    if (celebrationTimer) {
      clearTimeout(celebrationTimer);
      celebrationTimer = null;
    }
    document.querySelectorAll(".celebration-fireworks").forEach((node) => node.remove());
  }

  function launchCompletionCelebration() {
    clearCelebration();

    const layer = document.createElement("div");
    layer.className = "celebration-fireworks";
    layer.setAttribute("aria-hidden", "true");

    const bursts = [
      { x: "18%", y: "24%", delay: "0ms", hue: "24deg" },
      { x: "50%", y: "16%", delay: "260ms", hue: "132deg" },
      { x: "81%", y: "28%", delay: "520ms", hue: "315deg" },
      { x: "34%", y: "48%", delay: "760ms", hue: "210deg" },
      { x: "68%", y: "54%", delay: "1020ms", hue: "58deg" },
    ];

    bursts.forEach((burst, burstIndex) => {
      const firework = document.createElement("div");
      firework.className = "firework-burst";
      firework.style.left = burst.x;
      firework.style.top = burst.y;
      firework.style.animationDelay = burst.delay;
      firework.style.setProperty("--burst-hue", burst.hue);

      for (let i = 0; i < 12; i += 1) {
        const spark = document.createElement("span");
        spark.className = "firework-spark";
        spark.style.setProperty("--spark-angle", `${i * 30}deg`);
        spark.style.setProperty("--spark-delay", `${burstIndex * 140 + i * 22}ms`);
        firework.appendChild(spark);
      }

      layer.appendChild(firework);
    });

    const message = document.createElement("div");
    message.className = "celebration-banner";
    message.textContent = "今日微习惯全部完成";
    layer.appendChild(message);

    document.body.appendChild(layer);

    celebrationTimer = setTimeout(() => {
      layer.remove();
      if (celebrationTimer) {
        clearTimeout(celebrationTimer);
        celebrationTimer = null;
      }
    }, 4200);
  }

  function renderMain() {
    const activeHabits = getActiveHabits();
    const completed = new Set(getTodayCompletions());
    resetSkippedRoundIfNeeded();
    const skipped = new Set(state.skippedToday);
    const nextHabit = computeNextHabit();
    const allHabitsDone = activeHabits.length > 0 && completed.size === activeHabits.length;

    if (!activeHabits.length) {
      state.currentHabitId = null;
      wasAllHabitsDone = false;
      clearCelebration();
      els.taskOrder.textContent = "还没有习惯";
      els.taskTitle.textContent = "先添加一个微习惯";
      els.taskHint.textContent = "建议从最小动作开始，比如喝一口水。";
      els.completeTask.disabled = true;
      els.skipTask.disabled = true;
    } else if (!nextHabit) {
      state.currentHabitId = null;
      if (allHabitsDone && wasAllHabitsDone === false) {
        launchCompletionCelebration();
      }
      wasAllHabitsDone = allHabitsDone;
      els.taskOrder.textContent = "今天已完成";
      els.taskTitle.textContent = "今天的微习惯已经完成";
      els.taskHint.textContent = "你可以休息一下，或者去设置里再加一个新习惯。";
      els.completeTask.disabled = true;
      els.skipTask.disabled = true;
    } else {
      const currentIndex = activeHabits.findIndex((habit) => habit.id === nextHabit.id);
      wasAllHabitsDone = false;
      clearCelebration();
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
    state.skippedToday = state.skippedToday.filter((habitId) => habitId !== id);
    if (state.currentHabitId === id) {
      state.currentHabitId = null;
    }
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

      const [mainlineResult, principleResult, interestResult, scoreRuleResult] = await Promise.all([
        fetchContentCollection("user_mainlines"),
        fetchContentCollection("user_principles"),
        fetchContentCollection("user_interests"),
        fetchContentCollection("user_score_rules"),
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
      state.scoreRules = scoreRuleResult.missingSchema
        ? parseScoreRulesContent(savedState.scoreRules)
        : parseScoreRulesPayload(scoreRuleResult.content);

      selectedMainlineId = getSortedMainlines()[0]?.id || null;
      selectedPrincipleId = getSortedPrinciples()[0]?.id || null;
      selectedInterestId = getSortedInterests()[0]?.id || null;
      state.supabaseNotice =
        mainlineResult.missingSchema ||
        principleResult.missingSchema ||
        interestResult.missingSchema ||
        scoreRuleResult.missingSchema
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

        ensureHabitIdsAreUuids();
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

        const [mainlineSync, principleSync, interestSync, scoreRuleSync] = await Promise.all([
          syncContentCollection("user_mainlines", serializeMainlinesPayload(), userId),
          syncContentCollection("user_principles", serializePrinciplesPayload(), userId),
          syncContentCollection("user_interests", serializeInterestsPayload(), userId),
          syncContentCollection("user_score_rules", serializeScoreRulesPayload(), userId),
        ]);

        state.supabaseNotice =
          mainlineSync.missingSchema ||
          principleSync.missingSchema ||
          interestSync.missingSchema ||
          scoreRuleSync.missingSchema
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

  async function persistAll(flushRemote = false) {
    ensureHabitIdsAreUuids();
    normalizeOrders();
    saveLocalState();
    renderMain();
    renderSettings();

    if (els.mainlineDialog.open) {
      renderMainlineDialog();
    }
    if (els.principlesDialog.open) {
      renderPrinciplesDialog();
    }
    if (els.interestsDialog.open) {
      renderInterestsDialog();
    }

    if (flushRemote) {
      await provider.persist();
      return;
    }

    scheduleProviderPersist();
  }

  function scheduleProviderPersist() {
    persistPending = true;
    if (persistScheduled) return;
    persistScheduled = true;
    queueSyncStatus("正在后台同步...");

    persistPromise = persistPromise
      .catch(() => {})
      .then(async () => {
        persistScheduled = false;
        if (!persistPending) return;
        persistPending = false;
        try {
          await provider.persist();
          queueSyncStatus("已同步", true);
        } catch (error) {
          const message = getErrorMessage(error, "同步失败");
          queueSyncStatus(`同步失败：${message}`);
        }
      });
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

  function renderMoodDialog() {
    const step = moodSteps[moodStepIndex];
    const isComplete = !step;

    if (isComplete) {
      els.moodProgress.textContent = "完成";
      els.moodQuestion.textContent = "你已经走到这一页了。";
      els.moodOptionA.hidden = true;
      els.moodOptionB.hidden = true;
      return;
    }

    els.moodProgress.textContent = `第 ${moodStepIndex + 1} 页 / 共 ${moodSteps.length} 页`;
    els.moodQuestion.textContent = step.question;
    els.moodOptionA.hidden = dismissedMoodSteps.has(moodStepIndex);
    els.moodOptionA.querySelector("strong").textContent = step.optionA;
    els.moodOptionB.hidden = false;
    els.moodOptionB.querySelector("strong").textContent = step.optionB;
  }

  function openMoodDialog() {
    moodStepIndex = 0;
    dismissedMoodSteps.clear();
    renderMoodDialog();
    if (!els.moodDialog.open) {
      els.moodDialog.showModal();
    }
  }

  function closeMoodDialog() {
    if (els.moodDialog.open) {
      els.moodDialog.close();
    }
  }

  function dismissMoodOptionA() {
    dismissedMoodSteps.add(moodStepIndex);
    renderMoodDialog();
  }

  function goToNextMoodStep() {
    moodStepIndex += 1;
    renderMoodDialog();
  }

  function renderBedtimeDialog() {
    const isReady = bedtimeStepIndex > 0;
    els.bedtimeProgress.textContent = isReady ? "完成" : "第 1 页 / 共 2 页";
    els.bedtimeMessage.textContent = isReady
      ? "我已做好准备早睡"
      : "明天一定是很棒的一天，明媚自由！让我们一起畅想吧，明天想做什么呢？";
    els.bedtimeNext.hidden = isReady;
    els.bedtimeDone.hidden = !isReady;
  }

  function openBedtimeDialog() {
    bedtimeStepIndex = 0;
    renderBedtimeDialog();
    if (!els.bedtimeDialog.open) {
      els.bedtimeDialog.showModal();
    }
  }

  function closeBedtimeDialog() {
    if (els.bedtimeDialog.open) {
      els.bedtimeDialog.close();
    }
  }

  function goToBedtimeReadyStep() {
    bedtimeStepIndex = 1;
    renderBedtimeDialog();
  }

  const FROG_STORAGE_PREFIX = "micro-habit-frogs-";
  let frogViewDate = TODAY();

  function frogDateKey(dateStr = TODAY()) {
    return `${FROG_STORAGE_PREFIX}${dateStr}`;
  }

  function normalizeFrogs(items) {
    return Array.isArray(items)
      ? items
          .filter((item) => item && typeof item === "object")
          .map((item) => ({
            id: typeof item.id === "string" && item.id ? item.id : uid(),
            title: typeof item.title === "string" ? item.title.trim() : "",
            done: item.done === true,
            autoSourceDate:
              typeof item.autoSourceDate === "string" && item.autoSourceDate.trim()
                ? item.autoSourceDate.trim()
                : "",
          }))
          .filter((item) => item.title.trim())
      : [];
  }

  function loadFrogsForDate(dateStr = TODAY()) {
    try {
      return normalizeFrogs(JSON.parse(localStorage.getItem(frogDateKey(dateStr)) || "[]"));
    } catch {
      return [];
    }
  }

  function loadFrogDraftsForDate(dateStr = TODAY()) {
    try {
      const items = JSON.parse(localStorage.getItem(frogDateKey(dateStr)) || "[]");
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  function saveFrogsForDate(dateStr, frogs) {
    localStorage.setItem(frogDateKey(dateStr), JSON.stringify(normalizeFrogs(frogs)));
    renderDonelistFrogSummary();
  }

  function nextDateKey(dateStr) {
    const year = Number(dateStr.slice(0, 4));
    const month = Number(dateStr.slice(5, 7));
    const day = Number(dateStr.slice(8, 10));
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function saveFrogsIntoDonelist(dateStr, frogs) {
    const normalized = normalizeFrogs(frogs);
    const current = loadDonelistForDate(dateStr) || { ...freshDonelist(), date: dateStr };
    const next = { ...current, date: dateStr, frogs: normalized };
    localStorage.setItem(donelistDateKey(dateStr), JSON.stringify(next));
    if (dateStr === TODAY()) {
      localStorage.setItem(DONELIST_KEY, JSON.stringify(next));
    }
    syncDonelistToSupabase(next);
  }

  function syncTomorrowPlanToNextFrog(data) {
    const sourceDate = data.date || TODAY();
    const plan = typeof data.tomorrowPlan === "string" ? data.tomorrowPlan.trim() : "";
    const targetDate = nextDateKey(sourceDate);
    const frogs = loadFrogsForDate(targetDate);
    const autoIndex = frogs.findIndex((frog) => frog.autoSourceDate === sourceDate);

    if (!plan) {
      if (autoIndex < 0) return;
      const next = frogs.filter((frog) => frog.autoSourceDate !== sourceDate);
      saveFrogsForDate(targetDate, next);
      saveFrogsIntoDonelist(targetDate, next);
      return;
    }

    const next = frogs.slice();
    if (autoIndex >= 0) {
      next[autoIndex] = { ...next[autoIndex], title: plan };
    } else {
      next.push({
        id: uid(),
        title: plan,
        done: false,
        autoSourceDate: sourceDate,
      });
    }

    saveFrogsForDate(targetDate, next);
    saveFrogsIntoDonelist(targetDate, next);
  }

  function getFrogStatusText(frog) {
    return frog.done ? "已吃掉" : "未吃掉";
  }

  function renderFrogDialog() {
    const frogs = loadFrogsForDate(frogViewDate);
    els.frogList.innerHTML = "";

    if (!frogs.length) {
      const empty = document.createElement("li");
      empty.className = "frog-empty";
      empty.textContent = "还没有写今日的蛙。";
      els.frogList.appendChild(empty);
      return;
    }

    frogs.forEach((frog) => {
      const li = document.createElement("li");
      li.className = `frog-item${frog.done ? " done" : ""}`;

      const check = document.createElement("button");
      check.type = "button";
      check.className = "frog-check";
      check.setAttribute("aria-label", `${frog.title}：${getFrogStatusText(frog)}`);
      check.addEventListener("click", () => {
        const next = loadFrogsForDate(frogViewDate).map((item) =>
          item.id === frog.id ? { ...item, done: !item.done } : item,
        );
        saveFrogsForDate(frogViewDate, next);
        renderFrogDialog();
      });

      const input = document.createElement("input");
      input.className = "frog-edit-input";
      input.type = "text";
      input.maxLength = 120;
      input.value = frog.title;
      input.addEventListener("input", () => {
        const next = loadFrogDraftsForDate(frogViewDate).map((item) =>
          item.id === frog.id ? { ...item, title: input.value } : item,
        );
        localStorage.setItem(frogDateKey(frogViewDate), JSON.stringify(next));
        renderDonelistFrogSummary();
      });
      input.addEventListener("blur", () => {
        const next = normalizeFrogs(loadFrogsForDate(frogViewDate));
        saveFrogsForDate(frogViewDate, next);
        renderFrogDialog();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-button danger frog-delete";
      remove.textContent = "删";
      remove.addEventListener("click", () => {
        const next = loadFrogsForDate(frogViewDate).filter((item) => item.id !== frog.id);
        saveFrogsForDate(frogViewDate, next);
        renderFrogDialog();
      });

      li.appendChild(check);
      li.appendChild(input);
      li.appendChild(remove);
      els.frogList.appendChild(li);
    });
  }

  function openFrogDialog(dateStr = TODAY()) {
    frogViewDate = dateStr;
    els.frogInput.value = "";
    renderFrogDialog();
    if (!els.frogDialog.open) {
      els.frogDialog.showModal();
    }
  }

  function addFrog() {
    const title = els.frogInput.value.trim();
    if (!title) return;
    const frogs = loadFrogsForDate(frogViewDate);
    frogs.push({ id: uid(), title, done: false });
    saveFrogsForDate(frogViewDate, frogs);
    els.frogInput.value = "";
    renderFrogDialog();
    els.frogInput.focus();
  }

  function formatFrogCopyBlock(dateStr = donelistViewDate) {
    const frogs = loadFrogsForDate(dateStr);
    const lines = frogs.length
      ? frogs.map((frog) => `${frog.done ? "✓" : "○"} ${frog.title}（${getFrogStatusText(frog)}）`)
      : ["暂无"];
    return `• 蛙:\n${lines.join("\n")}`;
  }

  function renderDonelistFrogSummary(dateStr = donelistViewDate) {
    if (!els.donelistFrogList) return;
    const frogs = loadFrogsForDate(dateStr);
    els.donelistFrogList.innerHTML = "";

    if (!frogs.length) {
      const empty = document.createElement("li");
      empty.className = "frog-summary-empty";
      empty.textContent = "还没有写今日的蛙。";
      els.donelistFrogList.appendChild(empty);
      return;
    }

    frogs.forEach((frog) => {
      const li = document.createElement("li");
      li.className = `frog-summary-item${frog.done ? " done" : ""}`;
      li.innerHTML = `<span class="frog-summary-dot">${frog.done ? "✓" : ""}</span><span>${frog.title}</span><em>${getFrogStatusText(frog)}</em>`;
      els.donelistFrogList.appendChild(li);
    });
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

    els.openMood.addEventListener("click", openMoodDialog);
    els.moodClose.addEventListener("click", closeMoodDialog);
    els.moodOptionA.addEventListener("click", dismissMoodOptionA);
    els.moodOptionB.addEventListener("click", goToNextMoodStep);
    els.openBedtime.addEventListener("click", openBedtimeDialog);
    els.bedtimeClose.addEventListener("click", closeBedtimeDialog);
    els.bedtimeNext.addEventListener("click", goToBedtimeReadyStep);
    els.bedtimeDone.addEventListener("click", closeBedtimeDialog);
    els.openFrog.addEventListener("click", () => openFrogDialog(TODAY()));
    els.frogClose.addEventListener("click", () => els.frogDialog.close());
    els.frogAdd.addEventListener("click", addFrog);
    els.frogInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addFrog();
    });
    els.donelistOpenFrog.addEventListener("click", () => openFrogDialog(donelistViewDate));

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
  const DONELIST_MODE_PREFERENCE_KEY = "donelist-mode-preference";
  const WEEKLY_MODE_PREFERENCE_KEY = "weekly-review-mode-preference";
  const MONTHLY_MODE_PREFERENCE_KEY = "monthly-review-mode-preference";
  const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); }
  const donelistEls = {
    dialog: document.getElementById("donelist-dialog"),
    openBtn: document.getElementById("open-donelist"),
    closeBtn: document.getElementById("donelist-close"),
    copyBtn: document.getElementById("donelist-copy"),
    copyTemplateBtn: document.getElementById("donelist-copy-template"),
    modeTemplateBtn: document.getElementById("donelist-mode-template"),
    modeFreeBtn: document.getElementById("donelist-mode-free"),
    modeGuidedBtn: document.getElementById("donelist-mode-guided"),
    freeformSection: document.getElementById("donelist-freeform-section"),
    freeform: document.getElementById("donelist-freeform"),
    structuredShell: document.getElementById("donelist-structured-shell"),
    stepper: document.getElementById("donelist-stepper"),
    stepCount: document.getElementById("donelist-step-count"),
    stepTitle: document.getElementById("donelist-step-title"),
    stepPrev: document.getElementById("donelist-step-prev"),
    stepNext: document.getElementById("donelist-step-next"),
    positive: document.getElementById("donelist-positive"),
    events: document.getElementById("donelist-events"),
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
  let donelistStepIndex = 0;

  function getJournalSupabaseClient() {
    if (state.mode !== "supabase" || !state.session) return null;
    const config = window.APP_CONFIG || {};
    if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  async function upsertKeyedJournalEntry(tableName, keyColumn, keyValue, content) {
    const client = getJournalSupabaseClient();
    if (!client) return { missingSchema: false };
    try {
      const { error } = await client.from(tableName).upsert(
        {
          user_id: state.session.user.id,
          [keyColumn]: keyValue,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: `user_id,${keyColumn}` },
      );
      if (error) throw error;
      return { missingSchema: false };
    } catch (error) {
      if (isMissingContentTableError(error, tableName)) {
        return { missingSchema: true };
      }
      throw error;
    }
  }

  async function fetchKeyedJournalEntry(tableName, keyColumn, keyValue) {
    const client = getJournalSupabaseClient();
    if (!client) return { missingSchema: false, content: null };
    try {
      const { data, error } = await client
        .from(tableName)
        .select("content")
        .eq(keyColumn, keyValue)
        .maybeSingle();
      if (error) throw error;
      return { missingSchema: false, content: data?.content || null };
    } catch (error) {
      if (isMissingContentTableError(error, tableName)) {
        return { missingSchema: true, content: null };
      }
      throw error;
    }
  }

  function freshDonelist() {
    return {
      date: TODAY(),
      mode: loadReviewModePreference(DONELIST_MODE_PREFERENCE_KEY),
      freeform: "",
      diet: "",
      events: "",
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
      tomorrowPlan: "",
      frogs: [],
      scoreEntries: [],
    };
  }

  function donelistDateKey(dateStr) {
    return `donelist-${dateStr}`;
  }

  function buildLegacyDonelistEvents(data) {
    const parts = [];
    if ((data.morning || "").trim()) parts.push(`早上：${data.morning.trim()}`);
    if ((data.afternoon || "").trim()) parts.push(`中午：${data.afternoon.trim()}`);
    if ((data.evening || "").trim()) parts.push(`晚上：${data.evening.trim()}`);
    return parts.join("\n");
  }

  function normalizeDonelistRecord(data) {
    const merged = { ...freshDonelist(), ...data };
    if (!merged.events.trim()) {
      merged.events = buildLegacyDonelistEvents(merged);
    }
    merged.scoreEntries = normalizeScoreEntries(merged.scoreEntries);
    return merged;
  }

  function loadDonelist() {
    // 优先读按日期存的 key
    const dateKey = donelistDateKey(TODAY());
    try {
      const raw = localStorage.getItem(dateKey);
      if (raw) {
        const data = JSON.parse(raw);
        return normalizeDonelistRecord(data);
      }
    } catch {}

    // 兼容旧 key
    try {
      const raw = localStorage.getItem(DONELIST_KEY);
      if (!raw) return freshDonelist();
      const data = JSON.parse(raw);
      if (data.date !== TODAY()) {
        localStorage.removeItem(DONELIST_KEY);
        return freshDonelist();
      }
      // 迁移到新 key
      const merged = normalizeDonelistRecord(data);
      localStorage.setItem(dateKey, JSON.stringify(merged));
      return merged;
    } catch {
      return freshDonelist();
    }
  }

  function loadDonelistForDate(dateStr) {
    const key = donelistDateKey(dateStr);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return { ...normalizeDonelistRecord(JSON.parse(raw)), date: dateStr };
    } catch {
      return null;
    }
  }

  function collectDonelistData() {
    return {
      date: donelistViewDate,
      mode: getDonelistMode(),
      freeform: donelistEls.freeform.value,
      events: donelistEls.events.value,
      positive: donelistEls.positive.value,
      gratitude: donelistEls.gratitude.value,
      selfPraise: donelistEls.selfPraise.value,
      review: donelistEls.review.value,
      body: donelistEls.body.value,
      emotion: donelistEls.emotion.value,
      emotionKit: donelistEls.emotionKit.value,
      vent: donelistEls.vent.value,
      tomorrowPlan: donelistEls.tomorrowPlan.value,
      frogs: loadFrogsForDate(donelistViewDate),
      scoreEntries: loadScoreEntriesForDate(donelistViewDate),
    };
  }

  function saveDonelist() {
    const data = collectDonelistData();
    localStorage.setItem(DONELIST_KEY, JSON.stringify(data));
    localStorage.setItem(donelistDateKey(data.date || TODAY()), JSON.stringify(data));
    syncTomorrowPlanToNextFrog(data);
    syncDonelistToSupabase(data);
  }

  function debounceSaveDonelist() {
    clearTimeout(donelistSaveTimer);
    donelistSaveTimer = setTimeout(saveDonelist, 800);
  }

  async function syncDonelistToSupabase(data) {
    if (state.mode !== "supabase" || !state.session) return;
    try {
      const targetDate = data.date || TODAY();
      const result = await upsertKeyedJournalEntry(
        "user_donelist_entries",
        "entry_date",
        targetDate,
        data,
      );
      if (!result.missingSchema || targetDate !== TODAY()) {
        return;
      }

      const client = getJournalSupabaseClient();
      if (!client) return;
      const content = JSON.stringify(data);
      await client.from("user_donelist").upsert(
        { user_id: state.session.user.id, content, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    } catch {}
  }

  async function loadDonelistFromSupabase(dateStr = TODAY()) {
    if (state.mode !== "supabase" || !state.session) return null;
    try {
      const result = await fetchKeyedJournalEntry(
        "user_donelist_entries",
        "entry_date",
        dateStr,
      );
      if (result.content && typeof result.content === "object") {
        return { ...normalizeDonelistRecord(result.content), date: dateStr };
      }
      if (!result.missingSchema || dateStr !== TODAY()) return null;

      const client = getJournalSupabaseClient();
      if (!client) return null;
      const { data } = await client.from("user_donelist").select("content").maybeSingle();
      if (!data?.content) return null;
      const parsed = JSON.parse(data.content);
      if (parsed.date !== TODAY()) return null;
      return { ...normalizeDonelistRecord(parsed), date: TODAY() };
    } catch {
      return null;
    }
  }

  async function hydrateDonelistFromSupabase(dateStr) {
    const remote = await loadDonelistFromSupabase(dateStr);
    if (!remote || donelistViewDate !== dateStr) return;
    localStorage.setItem(donelistDateKey(dateStr), JSON.stringify(remote));
    renderDonelist(remote);
    renderDonelistNav();
  }

  function renderDonelist(data) {
    if (Array.isArray(data.frogs) && data.frogs.length) {
      saveFrogsForDate(data.date || donelistViewDate, data.frogs);
    }
    donelistEls.freeform.value = data.freeform || "";
    donelistEls.events.value = data.events || "";
    donelistEls.positive.value = data.positive || "";
    donelistEls.gratitude.value = data.gratitude || "";
    donelistEls.selfPraise.value = data.selfPraise || "";
    donelistEls.review.value = data.review || "";
    donelistEls.body.value = data.body || "";
    donelistEls.emotion.value = data.emotion || "";
    donelistEls.emotionKit.value = data.emotionKit || "";
    donelistEls.vent.value = data.vent || "";
    donelistEls.tomorrowPlan.value = data.tomorrowPlan || "";
    donelistStepIndex = getFirstEmptyReviewStepIndex(donelistSteps);
    setDonelistMode(data.mode);
    renderDonelistFrogSummary(data.date || donelistViewDate);
    renderDonelistScoreSummary(data.date || donelistViewDate);
    Object.values(donelistEls).forEach((el) => {
      if (el instanceof HTMLTextAreaElement) autoResizeTextarea(el);
    });
  }

  async function openDonelist() {
    donelistViewDate = TODAY();
    let data = loadDonelist();
    if (state.mode === "supabase" && state.session) {
      const remote = await loadDonelistFromSupabase();
      if (remote) {
        data = remote;
        localStorage.setItem(DONELIST_KEY, JSON.stringify(data));
        localStorage.setItem(donelistDateKey(data.date || TODAY()), JSON.stringify(data));
      }
    }
    renderDonelist(data);
    renderDonelistNav();
    if (!donelistEls.dialog.open) donelistEls.dialog.showModal();
  }

  function copyDonelist() {
    const dateStr = formatDonelistTag(donelistViewDate);
    const frogBlock = formatFrogCopyBlock(donelistViewDate);
    const scoreBlock = formatScoreCopyBlock(donelistViewDate);
    if (getDonelistMode() === "free") {
      const freeform = donelistEls.freeform.value.trim();
      const text = [dateStr, frogBlock, freeform, scoreBlock].filter(Boolean).join("\n\n");
      copyTextWithFeedback(text, donelistEls.copyBtn);
      return;
    }
    const fields = [
      { label: "收获", value: donelistEls.emotionKit.value },
      { label: "复盘", value: donelistEls.review.value },
      { label: "正向链接（生活中的美好）", value: donelistEls.positive.value },
      { label: "具体事件", value: donelistEls.events.value },
      { label: "感谢", value: donelistEls.gratitude.value },
      { label: "夸夸自己", value: donelistEls.selfPraise.value },
      { label: "身体", value: donelistEls.body.value },
      { label: "情绪", value: donelistEls.emotion.value },
      { label: "自由发泄区", value: donelistEls.vent.value },
    ];

    const parts = [];
    parts.push(frogBlock);
    fields.forEach((f) => {
      const v = f.value.trim();
      if (v) parts.push(`• ${f.label}:\n${v}`);
    });

    const planVal = donelistEls.tomorrowPlan.value.trim();
    if (planVal) parts.push(`• 明日计划:\n${planVal}`);
    parts.push(scoreBlock);

    const text = `${dateStr}\n\n${parts.join("\n\n")}`;
    copyTextWithFeedback(text, donelistEls.copyBtn);
  }

  function copyDonelistTemplate() {
    const dateStr = formatDonelistTag(donelistViewDate);
    const fields = [
      "蛙",
      "随记",
      "收获",
      "复盘",
      "正向链接（生活中的美好）",
      "具体事件",
      "感谢",
      "夸夸自己",
      "身体",
      "情绪",
      "自由发泄区",
      "明日计划",
      "今日打分",
    ];
    const blocks = fields.map((label) => {
      if (label === "蛙") {
        return `• ${label}:\n○ `;
      }
      if (label === "今日打分") {
        return `• ${label}:\n总分：\n加分：\n扣分：\n明细：\n- `;
      }
      return `• ${label}:\n`;
    });
    copyTextWithFeedback(`${dateStr}\n\n${blocks.join("\n\n")}`, donelistEls.copyTemplateBtn);
  }

  function clearDonelist() {
    if (!confirm("确定要清空今天的所有日志记录吗？此操作不可恢复！")) return;
    const fields = [donelistEls.freeform, donelistEls.events, donelistEls.positive, donelistEls.gratitude, donelistEls.selfPraise, donelistEls.review, donelistEls.body, donelistEls.emotion, donelistEls.emotionKit, donelistEls.vent, donelistEls.tomorrowPlan];
    fields.forEach((el) => { el.value = ""; autoResizeTextarea(el); });
    writeScoreEntriesForDate(donelistViewDate, [], { sync: false });
    donelistStepIndex = 0;
    updateDonelistStepView();
    saveDonelist();
  }

  const scoreEls = {
    dialog: document.getElementById("score-dialog"),
    openBtn: document.getElementById("open-score"),
    closeBtn: document.getElementById("score-close"),
    total: document.getElementById("score-total"),
    positive: document.getElementById("score-positive"),
    negative: document.getElementById("score-negative"),
    noteInput: document.getElementById("score-note-input"),
    ruleButtons: document.getElementById("score-rule-buttons"),
    ruleTitle: document.getElementById("score-rule-title"),
    rulePoints: document.getElementById("score-rule-points"),
    ruleAdd: document.getElementById("score-rule-add"),
    ruleList: document.getElementById("score-rule-list"),
    entryList: document.getElementById("score-entry-list"),
    clearToday: document.getElementById("score-clear-today"),
    donelistOpenScore: document.getElementById("donelist-open-score"),
    donelistTotal: document.getElementById("donelist-score-total"),
    donelistList: document.getElementById("donelist-score-list"),
  };

  let scoreViewDate = TODAY();

  function normalizeScoreEntries(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const points = Number(item.points);
        return {
          id: typeof item.id === "string" && item.id ? item.id : uid(),
          ruleId: typeof item.ruleId === "string" ? item.ruleId : "",
          title: typeof item.title === "string" ? item.title.trim() : "",
          points: Number.isFinite(points) ? Math.trunc(points) : 0,
          note: typeof item.note === "string" ? item.note.trim() : "",
          createdAt:
            typeof item.createdAt === "string" && item.createdAt.trim()
              ? item.createdAt
              : new Date().toISOString(),
        };
      })
      .filter((item) => item.title)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  function loadScoreEntriesForDate(dateStr = TODAY()) {
    const data = loadDonelistForDate(dateStr);
    return normalizeScoreEntries(data?.scoreEntries || []);
  }

  function writeScoreEntriesForDate(dateStr, entries, options = {}) {
    const normalized = normalizeScoreEntries(entries);
    const current = loadDonelistForDate(dateStr) || { ...freshDonelist(), date: dateStr };
    const next = { ...current, date: dateStr, scoreEntries: normalized };
    localStorage.setItem(donelistDateKey(dateStr), JSON.stringify(next));
    if (dateStr === TODAY()) {
      localStorage.setItem(DONELIST_KEY, JSON.stringify(next));
    }
    if (options.sync !== false) {
      syncDonelistToSupabase(next);
    }
    renderDonelistScoreSummary(dateStr);
  }

  function getScoreTotals(entries) {
    return entries.reduce(
      (acc, entry) => {
        acc.total += entry.points;
        if (entry.points > 0) acc.positive += entry.points;
        if (entry.points < 0) acc.negative += entry.points;
        return acc;
      },
      { total: 0, positive: 0, negative: 0 },
    );
  }

  function formatSignedPoints(points) {
    return points > 0 ? `+${points}` : String(points);
  }

  function formatScoreTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function formatScoreCopyBlock(dateStr = donelistViewDate) {
    const entries = loadScoreEntriesForDate(dateStr);
    const totals = getScoreTotals(entries);
    const lines = [
      `总分：${formatSignedPoints(totals.total)}`,
      `加分：+${totals.positive}`,
      `扣分：${totals.negative}`,
      "明细：",
    ];
    if (!entries.length) {
      lines.push("暂无");
    } else {
      entries.forEach((entry) => {
        const note = entry.note ? `｜${entry.note}` : "";
        lines.push(`- ${formatScoreTime(entry.createdAt)} ${formatSignedPoints(entry.points)} ${entry.title}${note}`);
      });
    }
    return `• 今日打分:\n${lines.join("\n")}`;
  }

  function renderDonelistScoreSummary(dateStr = donelistViewDate) {
    if (!scoreEls.donelistList || !scoreEls.donelistTotal) return;
    const entries = loadScoreEntriesForDate(dateStr);
    const totals = getScoreTotals(entries);
    scoreEls.donelistTotal.textContent = `总分：${formatSignedPoints(totals.total)}（加分 +${totals.positive} / 扣分 ${totals.negative}）`;
    scoreEls.donelistList.innerHTML = "";
    if (!entries.length) {
      const empty = document.createElement("li");
      empty.className = "score-empty";
      empty.textContent = "本日还没有打分明细。";
      scoreEls.donelistList.appendChild(empty);
      return;
    }
    entries.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "score-entry-item";
      const note = entry.note ? `<span class="score-entry-meta">${escapeHtml(entry.note)}</span>` : "";
      li.innerHTML = `
        <div class="score-entry-main">
          <span class="score-entry-title">${escapeHtml(entry.title)}</span>
          <span class="score-entry-meta">${formatScoreTime(entry.createdAt)}</span>
          ${note}
        </div>
        <strong class="score-entry-points${entry.points < 0 ? " is-negative" : ""}">${formatSignedPoints(entry.points)}</strong>
      `;
      scoreEls.donelistList.appendChild(li);
    });
  }

  function renderScoreHistoryBlock(entriesInput) {
    const entries = normalizeScoreEntries(entriesInput);
    const totals = getScoreTotals(entries);
    let h = '<section class="panel score-summary"><h3 class="donelist-period-title">今日打分</h3>';
    h += `<div class="score-summary-total">总分：${formatSignedPoints(totals.total)}（加分 +${totals.positive} / 扣分 ${totals.negative}）</div>`;
    h += '<ul class="score-entry-list">';
    if (!entries.length) {
      h += '<li class="score-empty">这天没有打分明细。</li>';
    } else {
      entries.forEach((entry) => {
        const note = entry.note ? `<span class="score-entry-meta">${escapeHtml(entry.note)}</span>` : "";
        h += `
          <li class="score-entry-item">
            <div class="score-entry-main">
              <span class="score-entry-title">${escapeHtml(entry.title)}</span>
              <span class="score-entry-meta">${formatScoreTime(entry.createdAt)}</span>
              ${note}
            </div>
            <strong class="score-entry-points${entry.points < 0 ? " is-negative" : ""}">${formatSignedPoints(entry.points)}</strong>
          </li>
        `;
      });
    }
    h += "</ul></section>";
    return h;
  }

  function saveScoreRules() {
    state.scoreRules = createOrderedList(state.scoreRules.filter((rule) => rule.title.trim()));
    saveLocalState();
    if (state.mode === "supabase" && state.session) {
      scheduleProviderPersist();
    }
  }

  function renderScoreRules() {
    const rules = getSortedScoreRules();
    scoreEls.ruleButtons.innerHTML = "";
    scoreEls.ruleList.innerHTML = "";

    const activeRules = rules.filter((rule) => rule.active !== false);
    if (!activeRules.length) {
      const empty = document.createElement("div");
      empty.className = "score-empty";
      empty.textContent = "还没有可用规则，先在下方添加一条。";
      scoreEls.ruleButtons.appendChild(empty);
    } else {
      activeRules.forEach((rule) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `score-rule-button${rule.points < 0 ? " is-negative" : ""}`;
        button.innerHTML = `<span>${escapeHtml(rule.title)}</span><strong>${formatSignedPoints(rule.points)}</strong>`;
        button.addEventListener("click", () => addScoreEntry(rule));
        scoreEls.ruleButtons.appendChild(button);
      });
    }

    rules.forEach((rule) => {
      const li = document.createElement("li");
      li.className = "score-rule-item";

      const editor = document.createElement("div");
      editor.className = "score-rule-editor";

      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.maxLength = 60;
      titleInput.value = rule.title;
      titleInput.addEventListener("change", () => {
        rule.title = titleInput.value.trim() || "未命名规则";
        rule.updatedAt = new Date().toISOString();
        saveScoreRules();
        renderScoreDialog();
      });

      const pointsInput = document.createElement("input");
      pointsInput.type = "number";
      pointsInput.min = "-999";
      pointsInput.max = "999";
      pointsInput.step = "1";
      pointsInput.value = String(rule.points);
      pointsInput.addEventListener("change", () => {
        const points = Number(pointsInput.value);
        rule.points = Number.isFinite(points) ? Math.trunc(points) : 0;
        rule.updatedAt = new Date().toISOString();
        saveScoreRules();
        renderScoreDialog();
      });

      editor.appendChild(titleInput);
      editor.appendChild(pointsInput);

      const actions = document.createElement("div");
      actions.className = "habit-item-actions";

      const activeToggle = document.createElement("button");
      activeToggle.type = "button";
      activeToggle.className = "small-button";
      activeToggle.textContent = rule.active === false ? "启" : "停";
      activeToggle.title = rule.active === false ? "启用" : "停用";
      activeToggle.addEventListener("click", () => {
        rule.active = rule.active === false;
        rule.updatedAt = new Date().toISOString();
        saveScoreRules();
        renderScoreDialog();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-button danger";
      remove.textContent = "删";
      remove.addEventListener("click", () => {
        if (!confirm(`确定删除“${rule.title}”吗？`)) return;
        state.scoreRules = state.scoreRules.filter((item) => item.id !== rule.id);
        saveScoreRules();
        renderScoreDialog();
      });

      actions.appendChild(activeToggle);
      actions.appendChild(remove);
      li.appendChild(editor);
      li.appendChild(actions);
      scoreEls.ruleList.appendChild(li);
    });
  }

  function renderScoreEntries() {
    const entries = loadScoreEntriesForDate(scoreViewDate);
    const totals = getScoreTotals(entries);
    scoreEls.total.textContent = formatSignedPoints(totals.total);
    scoreEls.positive.textContent = `+${totals.positive}`;
    scoreEls.negative.textContent = String(totals.negative);
    scoreEls.entryList.innerHTML = "";

    if (!entries.length) {
      const empty = document.createElement("li");
      empty.className = "score-empty";
      empty.textContent = "本日还没有打分。";
      scoreEls.entryList.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "score-entry-item";
      const main = document.createElement("div");
      main.className = "score-entry-main";
      const title = document.createElement("span");
      title.className = "score-entry-title";
      title.textContent = entry.title;
      const meta = document.createElement("span");
      meta.className = "score-entry-meta";
      meta.textContent = entry.note
        ? `${formatScoreTime(entry.createdAt)}｜${entry.note}`
        : formatScoreTime(entry.createdAt);
      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "habit-item-actions";
      const points = document.createElement("strong");
      points.className = `score-entry-points${entry.points < 0 ? " is-negative" : ""}`;
      points.textContent = formatSignedPoints(entry.points);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-button danger";
      remove.textContent = "删";
      remove.addEventListener("click", () => {
        const next = loadScoreEntriesForDate(scoreViewDate).filter((item) => item.id !== entry.id);
        writeScoreEntriesForDate(scoreViewDate, next);
        renderScoreDialog();
      });
      actions.appendChild(points);
      actions.appendChild(remove);

      li.appendChild(main);
      li.appendChild(actions);
      scoreEls.entryList.appendChild(li);
    });
  }

  function renderScoreDialog() {
    renderScoreRules();
    renderScoreEntries();
    renderDonelistScoreSummary(scoreViewDate);
  }

  function openScoreDialog(dateStr = TODAY()) {
    if (donelistEls.dialog.open && donelistViewDate === dateStr) {
      saveDonelist();
    }
    scoreViewDate = dateStr;
    scoreEls.noteInput.value = "";
    renderScoreDialog();
    if (!scoreEls.dialog.open) {
      scoreEls.dialog.showModal();
    }
  }

  function addScoreRule() {
    const title = scoreEls.ruleTitle.value.trim();
    const points = Number(scoreEls.rulePoints.value);
    if (!title) {
      alert("请先填写规则内容。");
      scoreEls.ruleTitle.focus();
      return;
    }
    if (!Number.isFinite(points)) {
      alert("请填写有效分数。");
      scoreEls.rulePoints.focus();
      return;
    }
    state.scoreRules.push(
      createScoreRule(
        {
          title,
          points,
          order: state.scoreRules.length,
        },
        state.scoreRules.length,
      ),
    );
    scoreEls.ruleTitle.value = "";
    scoreEls.rulePoints.value = "";
    saveScoreRules();
    renderScoreDialog();
    scoreEls.ruleTitle.focus();
  }

  function addScoreEntry(rule) {
    const note = scoreEls.noteInput.value.trim();
    const entries = loadScoreEntriesForDate(scoreViewDate);
    entries.push({
      id: uid(),
      ruleId: rule.id,
      title: rule.title,
      points: rule.points,
      note,
      createdAt: new Date().toISOString(),
    });
    writeScoreEntriesForDate(scoreViewDate, entries);
    scoreEls.noteInput.value = "";
    renderScoreDialog();
  }

  function clearTodayScores() {
    if (!confirm("确定清空本日的所有打分明细吗？")) return;
    writeScoreEntriesForDate(scoreViewDate, []);
    renderScoreDialog();
  }

  scoreEls.openBtn.addEventListener("click", () => openScoreDialog(TODAY()));
  scoreEls.closeBtn.addEventListener("click", () => scoreEls.dialog.close());
  scoreEls.ruleAdd.addEventListener("click", addScoreRule);
  scoreEls.clearToday.addEventListener("click", clearTodayScores);
  scoreEls.ruleTitle.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addScoreRule();
  });
  scoreEls.rulePoints.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addScoreRule();
  });
  scoreEls.donelistOpenScore.addEventListener("click", () => openScoreDialog(donelistViewDate));

  donelistEls.openBtn.addEventListener("click", openDonelist);
  donelistEls.closeBtn.addEventListener("click", () => {
    saveDonelist();
    donelistEls.dialog.close();
  });
  donelistEls.copyBtn.addEventListener("click", copyDonelist);
  donelistEls.copyTemplateBtn.addEventListener("click", copyDonelistTemplate);
  donelistEls.modeTemplateBtn.addEventListener("click", () => {
    setDonelistMode("template");
    saveDonelist();
  });
  donelistEls.modeFreeBtn.addEventListener("click", () => {
    setDonelistMode("free");
    saveDonelist();
  });
  donelistEls.modeGuidedBtn.addEventListener("click", () => {
    setDonelistMode("guided");
    saveDonelist();
  });
  donelistEls.stepPrev.addEventListener("click", () => {
    if (donelistStepIndex === 0) return;
    donelistStepIndex -= 1;
    updateDonelistStepView();
    requestAnimationFrame(() => donelistSteps[donelistStepIndex].el.focus());
  });
  donelistEls.stepNext.addEventListener("click", () => {
    donelistStepIndex = donelistStepIndex >= donelistSteps.length - 1 ? 0 : donelistStepIndex + 1;
    updateDonelistStepView();
    requestAnimationFrame(() => donelistSteps[donelistStepIndex].el.focus());
  });
  document.getElementById("donelist-clear").addEventListener("click", clearDonelist);
  const donelistFields = [donelistEls.freeform, donelistEls.events, donelistEls.positive, donelistEls.gratitude, donelistEls.selfPraise, donelistEls.review, donelistEls.body, donelistEls.emotion, donelistEls.emotionKit, donelistEls.vent, donelistEls.tomorrowPlan];
  donelistFields.forEach((el) => el.addEventListener("input", debounceSaveDonelist));

  // --- Weekly Review ---
  const WEEKLY_REVIEW_PREFIX = "weekly-review-";

  function weeklyReviewStorageKey(dateKey) {
    return `${WEEKLY_REVIEW_PREFIX}${dateKey}`;
  }

  function startOfMondayWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const mondayOffset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - mondayOffset);
    return d;
  }

  function addDays(date, days) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + days);
    return d;
  }

  function firstMondayWeekStartOfMonth(year, month) {
    return startOfMondayWeek(new Date(year, month - 1, 1));
  }

  function getWeekRange(year, month, weekNum) {
    const start = addDays(firstMondayWeekStartOfMonth(year, month), (weekNum - 1) * 7);
    return { start, end: addDays(start, 6) };
  }

  function getWeekOfMonth(date) {
    const firstStart = firstMondayWeekStartOfMonth(date.getFullYear(), date.getMonth() + 1);
    const currentStart = startOfMondayWeek(date);
    return Math.floor((currentStart - firstStart) / 604800000) + 1;
  }

  function weeklyReviewDateKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${getWeekOfMonth(date)}`;
  }

  function getReviewMode(mode) {
    if (mode === "free" || mode === "guided" || mode === "template") return mode;
    return "template";
  }

  function getReviewModeLabel(mode) {
    const normalized = getReviewMode(mode);
    if (normalized === "free") return "随记";
    if (normalized === "guided") return "逐个记";
    return "模板";
  }

  function loadReviewModePreference(storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      return getReviewMode(raw || "template");
    } catch {
      return "template";
    }
  }

  function saveReviewModePreference(storageKey, mode) {
    try {
      localStorage.setItem(storageKey, getReviewMode(mode));
    } catch {}
  }

  function getReviewStepValue(step) {
    if (typeof step.getValue === "function") return step.getValue();
    if (step.el && typeof step.el.value === "string") return step.el.value;
    return "";
  }

  function getFirstEmptyReviewStepIndex(steps) {
    const index = steps.findIndex((step) => !getReviewStepValue(step).trim());
    return index === -1 ? 0 : index;
  }

  function updateReviewModeButtons(buttonMap, mode) {
    Object.entries(buttonMap).forEach(([key, button]) => {
      const isActive = key === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function buildStructuredReviewText(dateTag, fields, emptyFallback) {
    const parts = [];
    fields.forEach((field) => {
      const value = field.value.trim();
      if (value) parts.push(`• ${field.label}:\n${value}`);
    });
    return parts.length ? `${dateTag}\n\n${parts.join("\n\n")}` : `${dateTag}\n${emptyFallback}`;
  }

  function copyTextWithFeedback(text, button) {
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
        } catch (error) {
          reject(error);
        }
        document.body.removeChild(ta);
      });
    };

    doCopy().then(() => {
      const original = button.textContent;
      button.textContent = "已复制";
      setTimeout(() => {
        button.textContent = original;
      }, 1500);
    }).catch(() => {
      alert("复制失败，请手动全选后 Ctrl+C 复制。");
    });
  }

  const donelistSteps = [
    {
      label: "收获",
      el: donelistEls.emotionKit,
      section: document.querySelector('#donelist-structured-sections [data-review-step="emotionKit"]'),
    },
    {
      label: "复盘",
      el: donelistEls.review,
      section: document.querySelector('#donelist-structured-sections [data-review-step="review"]'),
    },
    {
      label: "正向链接（生活中的美好）",
      el: donelistEls.positive,
      section: document.querySelector('#donelist-structured-sections [data-review-step="positive"]'),
    },
    {
      label: "具体事件",
      el: donelistEls.events,
      section: document.querySelector('#donelist-structured-sections [data-review-step="events"]'),
    },
    {
      label: "感谢",
      el: donelistEls.gratitude,
      section: document.querySelector('#donelist-structured-sections [data-review-step="gratitude"]'),
    },
    {
      label: "夸夸自己",
      el: donelistEls.selfPraise,
      section: document.querySelector('#donelist-structured-sections [data-review-step="selfPraise"]'),
    },
    {
      label: "身体",
      el: donelistEls.body,
      section: document.querySelector('#donelist-structured-sections [data-review-step="body"]'),
    },
    {
      label: "情绪",
      el: donelistEls.emotion,
      section: document.querySelector('#donelist-structured-sections [data-review-step="emotion"]'),
    },
    {
      label: "自由发泄区",
      el: donelistEls.vent,
      section: document.querySelector('#donelist-structured-sections [data-review-step="vent"]'),
    },
    {
      label: "明日计划",
      el: donelistEls.tomorrowPlan,
      section: document.querySelector('#donelist-structured-sections [data-review-step="tomorrowPlan"]'),
    },
  ];

  function getDonelistMode() {
    if (donelistEls.modeFreeBtn.classList.contains("is-active")) return "free";
    if (donelistEls.modeGuidedBtn.classList.contains("is-active")) return "guided";
    return "template";
  }

  function formatDonelistTag(dateStr = donelistViewDate) {
    const parts = String(dateStr).split("-");
    return `#日记/${parseInt(parts[0], 10)}/${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
  }

  function updateDonelistStepView() {
    donelistStepIndex = Math.max(0, Math.min(donelistStepIndex, donelistSteps.length - 1));
    const current = donelistSteps[donelistStepIndex];
    donelistEls.stepCount.textContent = `${donelistStepIndex + 1} / ${donelistSteps.length}`;
    donelistEls.stepTitle.textContent = current.label;
    donelistEls.stepPrev.disabled = donelistStepIndex === 0;
    donelistEls.stepNext.disabled = false;

    donelistSteps.forEach((step, index) => {
      const isActive = index === donelistStepIndex;
      step.section.hidden = !isActive;
      step.section.classList.toggle("is-active", isActive);
    });
  }

  function setDonelistMode(mode) {
    const normalized = getReviewMode(mode);
    saveReviewModePreference(DONELIST_MODE_PREFERENCE_KEY, normalized);
    updateReviewModeButtons({
      template: donelistEls.modeTemplateBtn,
      free: donelistEls.modeFreeBtn,
      guided: donelistEls.modeGuidedBtn,
    }, normalized);
    donelistEls.freeformSection.hidden = normalized !== "free";
    donelistEls.structuredShell.hidden = normalized === "free";
    donelistEls.structuredShell.classList.toggle("is-template", normalized === "template");
    donelistEls.stepper.hidden = normalized !== "guided";
    if (normalized === "guided") updateDonelistStepView();
    if (normalized === "template") {
      donelistSteps.forEach((step) => {
        step.section.hidden = false;
        step.section.classList.remove("is-active");
      });
    }
  }

  const weeklyEls = {
    dialog: document.getElementById("weekly-review-dialog"),
    openBtn: document.getElementById("open-weekly-review"),
    closeBtn: document.getElementById("weekly-review-close"),
    copyBtn: document.getElementById("weekly-review-copy"),
    modeTemplateBtn: document.getElementById("weekly-mode-template"),
    modeGuidedBtn: document.getElementById("weekly-mode-guided"),
    modeFreeBtn: document.getElementById("weekly-mode-free"),
    freeformSection: document.getElementById("weekly-freeform-section"),
    freeform: document.getElementById("weekly-freeform"),
    guidedShell: document.getElementById("weekly-guided-shell"),
    stepper: document.getElementById("weekly-stepper"),
    stepCount: document.getElementById("weekly-step-count"),
    stepTitle: document.getElementById("weekly-step-title"),
    stepPrev: document.getElementById("weekly-step-prev"),
    stepNext: document.getElementById("weekly-step-next"),
    events: document.getElementById("weekly-events"),
    body: document.getElementById("weekly-body"),
    gratitude: document.getElementById("weekly-gratitude"),
    progress: document.getElementById("weekly-progress"),
    knowledge: document.getElementById("weekly-knowledge"),
    reflection: document.getElementById("weekly-reflection"),
    nextPlan: document.getElementById("weekly-next-plan"),
  };

  const weeklySteps = [
    {
      label: "本周事件",
      el: weeklyEls.events,
      section: document.querySelector('#weekly-guided-sections [data-review-step="events"]'),
    },
    {
      label: "身体",
      el: weeklyEls.body,
      section: document.querySelector('#weekly-guided-sections [data-review-step="body"]'),
    },
    {
      label: "感恩的事情",
      el: weeklyEls.gratitude,
      section: document.querySelector('#weekly-guided-sections [data-review-step="gratitude"]'),
    },
    {
      label: "本周进步",
      el: weeklyEls.progress,
      section: document.querySelector('#weekly-guided-sections [data-review-step="progress"]'),
    },
    {
      label: "本周收获知识",
      el: weeklyEls.knowledge,
      section: document.querySelector('#weekly-guided-sections [data-review-step="knowledge"]'),
    },
    {
      label: "本周反思",
      el: weeklyEls.reflection,
      section: document.querySelector('#weekly-guided-sections [data-review-step="reflection"]'),
    },
    {
      label: "下周计划",
      el: weeklyEls.nextPlan,
      section: document.querySelector('#weekly-guided-sections [data-review-step="nextPlan"]'),
    },
  ];

  let weeklySaveTimer = null;
  let weeklyStepIndex = 0;

  function getWeeklyMode() {
    if (weeklyEls.modeFreeBtn.classList.contains("is-active")) return "free";
    if (weeklyEls.modeGuidedBtn.classList.contains("is-active")) return "guided";
    return "template";
  }

  function formatWeeklyReviewTag(dateKey = weeklyViewKey) {
    const parts = String(dateKey).split("-");
    return `#${parts[0]}/${parseInt(parts[1], 10)}/${parseInt(parts[1], 10)}.${parseInt(parts[2], 10)}`;
  }

  function updateWeeklyStepView() {
    weeklyStepIndex = Math.max(0, Math.min(weeklyStepIndex, weeklySteps.length - 1));
    const current = weeklySteps[weeklyStepIndex];
    weeklyEls.stepCount.textContent = `${weeklyStepIndex + 1} / ${weeklySteps.length}`;
    weeklyEls.stepTitle.textContent = current.label;
    weeklyEls.stepPrev.disabled = weeklyStepIndex === 0;
    weeklyEls.stepNext.disabled = false;

    weeklySteps.forEach((step, index) => {
      const isActive = index === weeklyStepIndex;
      step.section.hidden = !isActive;
      step.section.classList.toggle("is-active", isActive);
    });
  }

  function setWeeklyMode(mode) {
    const normalized = getReviewMode(mode);
    saveReviewModePreference(WEEKLY_MODE_PREFERENCE_KEY, normalized);
    updateReviewModeButtons({
      template: weeklyEls.modeTemplateBtn,
      free: weeklyEls.modeFreeBtn,
      guided: weeklyEls.modeGuidedBtn,
    }, normalized);
    weeklyEls.freeformSection.hidden = normalized !== "free";
    weeklyEls.guidedShell.hidden = normalized === "free";
    weeklyEls.guidedShell.classList.toggle("is-template", normalized === "template");
    weeklyEls.stepper.hidden = normalized !== "guided";
    if (normalized === "guided") updateWeeklyStepView();
    if (normalized === "template") {
      weeklySteps.forEach((step) => {
        step.section.hidden = false;
        step.section.classList.remove("is-active");
      });
    }
  }

  function freshWeeklyReview() {
    return {
      dateKey: weeklyReviewDateKey(new Date()),
      mode: loadReviewModePreference(WEEKLY_MODE_PREFERENCE_KEY),
      freeform: "",
      events: "",
      body: "",
      gratitude: "",
      progress: "",
      knowledge: "",
      reflection: "",
      nextPlan: "",
    };
  }

  function loadWeeklyReview() {
    const currentKey = weeklyReviewDateKey(new Date());
    const storageKey = weeklyReviewStorageKey(currentKey);
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return freshWeeklyReview();
      return { ...freshWeeklyReview(), ...JSON.parse(raw) };
    } catch {
      return freshWeeklyReview();
    }
  }

  function loadWeeklyReviewForKey(dateKey) {
    const storageKey = weeklyReviewStorageKey(dateKey);
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return { ...freshWeeklyReview(), ...JSON.parse(raw) };
    } catch {
      return null;
    }
  }

  function collectWeeklyData() {
    return {
      dateKey: weeklyViewKey,
      mode: getWeeklyMode(),
      freeform: weeklyEls.freeform.value,
      events: weeklyEls.events.value,
      body: weeklyEls.body.value,
      gratitude: weeklyEls.gratitude.value,
      progress: weeklyEls.progress.value,
      knowledge: weeklyEls.knowledge.value,
      reflection: weeklyEls.reflection.value,
      nextPlan: weeklyEls.nextPlan.value,
    };
  }

  function saveWeeklyReview() {
    const data = collectWeeklyData();
    localStorage.setItem(weeklyReviewStorageKey(data.dateKey), JSON.stringify(data));
    syncWeeklyReviewToSupabase(data);
  }

  function debounceSaveWeekly() {
    clearTimeout(weeklySaveTimer);
    weeklySaveTimer = setTimeout(saveWeeklyReview, 800);
  }

  function renderWeeklyReview(data) {
    weeklyEls.freeform.value = data.freeform || "";
    weeklyEls.events.value = data.events || "";
    weeklyEls.body.value = data.body || "";
    weeklyEls.gratitude.value = data.gratitude || "";
    weeklyEls.progress.value = data.progress || "";
    weeklyEls.knowledge.value = data.knowledge || "";
    weeklyEls.reflection.value = data.reflection || "";
    weeklyEls.nextPlan.value = data.nextPlan || "";
    weeklyStepIndex = getFirstEmptyReviewStepIndex(weeklySteps);
    setWeeklyMode(data.mode);
    [weeklyEls.freeform, weeklyEls.events, weeklyEls.body, weeklyEls.gratitude, weeklyEls.progress, weeklyEls.knowledge, weeklyEls.reflection, weeklyEls.nextPlan].forEach((el) => {
      if (el) autoResizeTextarea(el);
    });
  }

  function openWeeklyReview() {
    weeklyViewKey = weeklyReviewDateKey(new Date());
    const data = loadWeeklyReview();
    renderWeeklyReview(data);
    renderWeeklyNav();
    if (!weeklyEls.dialog.open) weeklyEls.dialog.showModal();
  }

  async function syncWeeklyReviewToSupabase(data) {
    if (state.mode !== "supabase" || !state.session) return;
    try {
      await upsertKeyedJournalEntry("user_weekly_reviews", "review_key", data.dateKey, data);
    } catch {}
  }

  async function loadWeeklyReviewFromSupabase(dateKey) {
    if (state.mode !== "supabase" || !state.session) return null;
    try {
      const result = await fetchKeyedJournalEntry("user_weekly_reviews", "review_key", dateKey);
      if (!result.content || typeof result.content !== "object") return null;
      return { ...freshWeeklyReview(), ...result.content, dateKey };
    } catch {
      return null;
    }
  }

  async function hydrateWeeklyReviewFromSupabase(dateKey) {
    const remote = await loadWeeklyReviewFromSupabase(dateKey);
    if (!remote || weeklyViewKey !== dateKey) return;
    localStorage.setItem(weeklyReviewStorageKey(dateKey), JSON.stringify(remote));
    renderWeeklyReview(remote);
    renderWeeklyNav();
  }

  function copyWeeklyReview() {
    const dateTag = formatWeeklyReviewTag(weeklyViewKey);
    if (getWeeklyMode() === "free") {
      const freeform = weeklyEls.freeform.value.trim();
      const text = freeform ? `${dateTag}\n\n${freeform}` : `${dateTag}\n这周还没有记录。`;
      copyTextWithFeedback(text, weeklyEls.copyBtn);
      return;
    }

    const text = buildStructuredReviewText(dateTag, [
      { label: "本周事件", value: weeklyEls.events.value },
      { label: "身体", value: weeklyEls.body.value },
      { label: "感恩的事情", value: weeklyEls.gratitude.value },
      { label: "本周进步", value: weeklyEls.progress.value },
      { label: "本周收获知识", value: weeklyEls.knowledge.value },
      { label: "本周反思", value: weeklyEls.reflection.value },
      { label: "下周计划", value: weeklyEls.nextPlan.value },
    ], "这周还没有记录。");
    copyTextWithFeedback(text, weeklyEls.copyBtn);
  }

  function clearWeeklyReview() {
    if (!confirm("确定要清空本周复盘的所有记录吗？此操作不可恢复！")) return;
    const fields = [weeklyEls.freeform, weeklyEls.events, weeklyEls.body, weeklyEls.gratitude, weeklyEls.progress, weeklyEls.knowledge, weeklyEls.reflection, weeklyEls.nextPlan];
    fields.forEach((el) => { el.value = ""; autoResizeTextarea(el); });
    weeklyStepIndex = 0;
    updateWeeklyStepView();
    saveWeeklyReview();
  }

  weeklyEls.openBtn.addEventListener("click", openWeeklyReview);
  weeklyEls.closeBtn.addEventListener("click", () => {
    saveWeeklyReview();
    weeklyEls.dialog.close();
  });
  weeklyEls.copyBtn.addEventListener("click", copyWeeklyReview);
  weeklyEls.modeTemplateBtn.addEventListener("click", () => {
    setWeeklyMode("template");
    saveWeeklyReview();
  });
  weeklyEls.modeGuidedBtn.addEventListener("click", () => {
    setWeeklyMode("guided");
    saveWeeklyReview();
  });
  weeklyEls.modeFreeBtn.addEventListener("click", () => {
    setWeeklyMode("free");
    saveWeeklyReview();
  });
  weeklyEls.stepPrev.addEventListener("click", () => {
    if (weeklyStepIndex === 0) return;
    weeklyStepIndex -= 1;
    updateWeeklyStepView();
    requestAnimationFrame(() => weeklySteps[weeklyStepIndex].el.focus());
  });
  weeklyEls.stepNext.addEventListener("click", () => {
    weeklyStepIndex = weeklyStepIndex >= weeklySteps.length - 1 ? 0 : weeklyStepIndex + 1;
    updateWeeklyStepView();
    requestAnimationFrame(() => weeklySteps[weeklyStepIndex].el.focus());
  });
  document.getElementById("weekly-review-clear").addEventListener("click", clearWeeklyReview);
  const weeklyFields = [weeklyEls.freeform, weeklyEls.events, weeklyEls.body, weeklyEls.gratitude, weeklyEls.progress, weeklyEls.knowledge, weeklyEls.reflection, weeklyEls.nextPlan];
  weeklyFields.forEach((el) => el.addEventListener("input", debounceSaveWeekly));

  // --- Monthly Review ---
  const MONTHLY_REVIEW_PREFIX = "monthly-review-";

  function monthlyReviewStorageKey(dateKey) {
    return `${MONTHLY_REVIEW_PREFIX}${dateKey}`;
  }

  function monthlyReviewDateKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }

  const monthlyEls = {
    dialog: document.getElementById("monthly-review-dialog"),
    openBtn: document.getElementById("open-monthly-review"),
    closeBtn: document.getElementById("monthly-review-close"),
    copyBtn: document.getElementById("monthly-review-copy"),
    modeTemplateBtn: document.getElementById("monthly-mode-template"),
    modeGuidedBtn: document.getElementById("monthly-mode-guided"),
    modeFreeBtn: document.getElementById("monthly-mode-free"),
    freeformSection: document.getElementById("monthly-freeform-section"),
    freeform: document.getElementById("monthly-freeform"),
    guidedShell: document.getElementById("monthly-guided-shell"),
    stepper: document.getElementById("monthly-stepper"),
    stepCount: document.getElementById("monthly-step-count"),
    stepTitle: document.getElementById("monthly-step-title"),
    stepPrev: document.getElementById("monthly-step-prev"),
    stepNext: document.getElementById("monthly-step-next"),
    keywords: document.getElementById("monthly-keywords"),
    events: document.getElementById("monthly-events"),
    body: document.getElementById("monthly-body"),
    gratitude: document.getElementById("monthly-gratitude"),
    progress: document.getElementById("monthly-progress"),
    knowledge: document.getElementById("monthly-knowledge"),
    reflection: document.getElementById("monthly-reflection"),
    nextPlan: document.getElementById("monthly-next-plan"),
  };

  const monthlySteps = [
    {
      label: "本月的关键词",
      el: monthlyEls.keywords,
      section: document.querySelector('#monthly-guided-sections [data-review-step="keywords"]'),
    },
    {
      label: "本月事件",
      el: monthlyEls.events,
      section: document.querySelector('#monthly-guided-sections [data-review-step="events"]'),
    },
    {
      label: "身体",
      el: monthlyEls.body,
      section: document.querySelector('#monthly-guided-sections [data-review-step="body"]'),
    },
    {
      label: "感恩的事情",
      el: monthlyEls.gratitude,
      section: document.querySelector('#monthly-guided-sections [data-review-step="gratitude"]'),
    },
    {
      label: "本月进步",
      el: monthlyEls.progress,
      section: document.querySelector('#monthly-guided-sections [data-review-step="progress"]'),
    },
    {
      label: "本月收获知识",
      el: monthlyEls.knowledge,
      section: document.querySelector('#monthly-guided-sections [data-review-step="knowledge"]'),
    },
    {
      label: "本月反思",
      el: monthlyEls.reflection,
      section: document.querySelector('#monthly-guided-sections [data-review-step="reflection"]'),
    },
    {
      label: "下月计划",
      el: monthlyEls.nextPlan,
      section: document.querySelector('#monthly-guided-sections [data-review-step="nextPlan"]'),
    },
  ];

  let monthlySaveTimer = null;
  let monthlyStepIndex = 0;

  function getMonthlyMode() {
    if (monthlyEls.modeFreeBtn.classList.contains("is-active")) return "free";
    if (monthlyEls.modeGuidedBtn.classList.contains("is-active")) return "guided";
    return "template";
  }

  function formatMonthlyReviewTag(dateKey = monthlyViewKey) {
    const parts = String(dateKey).split("-");
    return `#${parts[0]}/${parts[1]}`;
  }

  function updateMonthlyStepView() {
    monthlyStepIndex = Math.max(0, Math.min(monthlyStepIndex, monthlySteps.length - 1));
    const current = monthlySteps[monthlyStepIndex];
    monthlyEls.stepCount.textContent = `${monthlyStepIndex + 1} / ${monthlySteps.length}`;
    monthlyEls.stepTitle.textContent = current.label;
    monthlyEls.stepPrev.disabled = monthlyStepIndex === 0;
    monthlyEls.stepNext.disabled = false;

    monthlySteps.forEach((step, index) => {
      const isActive = index === monthlyStepIndex;
      step.section.hidden = !isActive;
      step.section.classList.toggle("is-active", isActive);
    });
  }

  function setMonthlyMode(mode) {
    const normalized = getReviewMode(mode);
    saveReviewModePreference(MONTHLY_MODE_PREFERENCE_KEY, normalized);
    updateReviewModeButtons({
      template: monthlyEls.modeTemplateBtn,
      free: monthlyEls.modeFreeBtn,
      guided: monthlyEls.modeGuidedBtn,
    }, normalized);
    monthlyEls.freeformSection.hidden = normalized !== "free";
    monthlyEls.guidedShell.hidden = normalized === "free";
    monthlyEls.guidedShell.classList.toggle("is-template", normalized === "template");
    monthlyEls.stepper.hidden = normalized !== "guided";
    if (normalized === "guided") updateMonthlyStepView();
    if (normalized === "template") {
      monthlySteps.forEach((step) => {
        step.section.hidden = false;
        step.section.classList.remove("is-active");
      });
    }
  }

  function freshMonthlyReview() {
    return {
      dateKey: monthlyReviewDateKey(new Date()),
      mode: loadReviewModePreference(MONTHLY_MODE_PREFERENCE_KEY),
      freeform: "",
      keywords: "",
      events: "",
      body: "",
      gratitude: "",
      progress: "",
      knowledge: "",
      reflection: "",
      nextPlan: "",
    };
  }

  function loadMonthlyReview() {
    const currentKey = monthlyReviewDateKey(new Date());
    const storageKey = monthlyReviewStorageKey(currentKey);
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return freshMonthlyReview();
      return { ...freshMonthlyReview(), ...JSON.parse(raw) };
    } catch {
      return freshMonthlyReview();
    }
  }

  function loadMonthlyReviewForKey(dateKey) {
    const storageKey = monthlyReviewStorageKey(dateKey);
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return { ...freshMonthlyReview(), ...JSON.parse(raw) };
    } catch {
      return null;
    }
  }

  function collectMonthlyData() {
    return {
      dateKey: monthlyViewKey,
      mode: getMonthlyMode(),
      freeform: monthlyEls.freeform.value,
      keywords: monthlyEls.keywords.value,
      events: monthlyEls.events.value,
      body: monthlyEls.body.value,
      gratitude: monthlyEls.gratitude.value,
      progress: monthlyEls.progress.value,
      knowledge: monthlyEls.knowledge.value,
      reflection: monthlyEls.reflection.value,
      nextPlan: monthlyEls.nextPlan.value,
    };
  }

  function saveMonthlyReview() {
    const data = collectMonthlyData();
    localStorage.setItem(monthlyReviewStorageKey(data.dateKey), JSON.stringify(data));
    syncMonthlyReviewToSupabase(data);
  }

  function debounceSaveMonthly() {
    clearTimeout(monthlySaveTimer);
    monthlySaveTimer = setTimeout(saveMonthlyReview, 800);
  }

  function renderMonthlyReview(data) {
    monthlyEls.freeform.value = data.freeform || "";
    monthlyEls.keywords.value = data.keywords || "";
    monthlyEls.events.value = data.events || "";
    monthlyEls.body.value = data.body || "";
    monthlyEls.gratitude.value = data.gratitude || "";
    monthlyEls.progress.value = data.progress || "";
    monthlyEls.knowledge.value = data.knowledge || "";
    monthlyEls.reflection.value = data.reflection || "";
    monthlyEls.nextPlan.value = data.nextPlan || "";
    monthlyStepIndex = getFirstEmptyReviewStepIndex(monthlySteps);
    setMonthlyMode(data.mode);
    [monthlyEls.freeform, monthlyEls.keywords, monthlyEls.events, monthlyEls.body, monthlyEls.gratitude, monthlyEls.progress, monthlyEls.knowledge, monthlyEls.reflection, monthlyEls.nextPlan].forEach((el) => {
      if (el) autoResizeTextarea(el);
    });
  }

  function openMonthlyReview() {
    monthlyViewKey = monthlyReviewDateKey(new Date());
    const data = loadMonthlyReview();
    renderMonthlyReview(data);
    renderMonthlyNav();
    if (!monthlyEls.dialog.open) monthlyEls.dialog.showModal();
  }

  async function syncMonthlyReviewToSupabase(data) {
    if (state.mode !== "supabase" || !state.session) return;
    try {
      await upsertKeyedJournalEntry("user_monthly_reviews", "review_key", data.dateKey, data);
    } catch {}
  }

  async function loadMonthlyReviewFromSupabase(dateKey) {
    if (state.mode !== "supabase" || !state.session) return null;
    try {
      const result = await fetchKeyedJournalEntry("user_monthly_reviews", "review_key", dateKey);
      if (!result.content || typeof result.content !== "object") return null;
      return { ...freshMonthlyReview(), ...result.content, dateKey };
    } catch {
      return null;
    }
  }

  async function hydrateMonthlyReviewFromSupabase(dateKey) {
    const remote = await loadMonthlyReviewFromSupabase(dateKey);
    if (!remote || monthlyViewKey !== dateKey) return;
    localStorage.setItem(monthlyReviewStorageKey(dateKey), JSON.stringify(remote));
    renderMonthlyReview(remote);
    renderMonthlyNav();
  }

  function copyMonthlyReview() {
    const dateTag = formatMonthlyReviewTag(monthlyViewKey);
    if (getMonthlyMode() === "free") {
      const freeform = monthlyEls.freeform.value.trim();
      const text = freeform ? `${dateTag}\n\n${freeform}` : `${dateTag}\n这个月还没有记录。`;
      copyTextWithFeedback(text, monthlyEls.copyBtn);
      return;
    }

    const text = buildStructuredReviewText(dateTag, [
      { label: "本月的关键词", value: monthlyEls.keywords.value },
      { label: "本月事件", value: monthlyEls.events.value },
      { label: "身体", value: monthlyEls.body.value },
      { label: "感恩的事情", value: monthlyEls.gratitude.value },
      { label: "本月进步", value: monthlyEls.progress.value },
      { label: "本月收获知识", value: monthlyEls.knowledge.value },
      { label: "本月反思", value: monthlyEls.reflection.value },
      { label: "下月计划", value: monthlyEls.nextPlan.value },
    ], "这个月还没有记录。");
    copyTextWithFeedback(text, monthlyEls.copyBtn);
  }

  function clearMonthlyReview() {
    if (!confirm("确定要清空本月复盘的所有记录吗？此操作不可恢复！")) return;
    const fields = [monthlyEls.freeform, monthlyEls.keywords, monthlyEls.events, monthlyEls.body, monthlyEls.gratitude, monthlyEls.progress, monthlyEls.knowledge, monthlyEls.reflection, monthlyEls.nextPlan];
    fields.forEach((el) => { el.value = ""; autoResizeTextarea(el); });
    monthlyStepIndex = 0;
    updateMonthlyStepView();
    saveMonthlyReview();
  }

  monthlyEls.openBtn.addEventListener("click", openMonthlyReview);
  monthlyEls.closeBtn.addEventListener("click", () => {
    saveMonthlyReview();
    monthlyEls.dialog.close();
  });
  monthlyEls.copyBtn.addEventListener("click", copyMonthlyReview);
  monthlyEls.modeTemplateBtn.addEventListener("click", () => {
    setMonthlyMode("template");
    saveMonthlyReview();
  });
  monthlyEls.modeGuidedBtn.addEventListener("click", () => {
    setMonthlyMode("guided");
    saveMonthlyReview();
  });
  monthlyEls.modeFreeBtn.addEventListener("click", () => {
    setMonthlyMode("free");
    saveMonthlyReview();
  });
  monthlyEls.stepPrev.addEventListener("click", () => {
    if (monthlyStepIndex === 0) return;
    monthlyStepIndex -= 1;
    updateMonthlyStepView();
    requestAnimationFrame(() => monthlySteps[monthlyStepIndex].el.focus());
  });
  monthlyEls.stepNext.addEventListener("click", () => {
    monthlyStepIndex = monthlyStepIndex >= monthlySteps.length - 1 ? 0 : monthlyStepIndex + 1;
    updateMonthlyStepView();
    requestAnimationFrame(() => monthlySteps[monthlyStepIndex].el.focus());
  });
  document.getElementById("monthly-review-clear").addEventListener("click", clearMonthlyReview);
  const monthlyFields = [monthlyEls.freeform, monthlyEls.keywords, monthlyEls.events, monthlyEls.body, monthlyEls.gratitude, monthlyEls.progress, monthlyEls.knowledge, monthlyEls.reflection, monthlyEls.nextPlan];
  monthlyFields.forEach((el) => el.addEventListener("input", debounceSaveMonthly));

  // ========== In-dialog Date Navigation ==========

  // --- Donelist navigation ---
  let donelistViewDate = TODAY();

  function donelistYear() { return parseInt(donelistViewDate.slice(0, 4)); }
  function donelistMonth() { return parseInt(donelistViewDate.slice(5, 7)); }
  function donelistDay() { return parseInt(donelistViewDate.slice(8, 10)); }

  function formatFullDateLabel(year, month, day) {
    return `${year}/${month}/${day}`;
  }

  function formatWeekRangeLabel(year, month, weekNum) {
    const range = getWeekRange(year, month, weekNum);
    return `${range.start.getFullYear()}/${range.start.getMonth() + 1}/${range.start.getDate()}-${range.end.getFullYear()}/${range.end.getMonth() + 1}/${range.end.getDate()}`;
  }

  function renderDonelistNav() {
    var y = donelistYear(), m = donelistMonth(), d = donelistDay();
    document.getElementById("donelist-cur-month").textContent = m;
    document.getElementById("donelist-cur-day").textContent = d;
    var wd = new Date(y, m - 1, d).getDay();
    document.getElementById("donelist-nav-weekday").textContent = `${WEEKDAY_NAMES[wd]} · ${formatFullDateLabel(y, m, d)}`;
  }

  function donelistSaveAndLoad(dateStr) {
    saveDonelist();
    // load new date
    donelistViewDate = dateStr;
    var loaded = loadDonelistForDate(dateStr);
    renderDonelist(loaded || { ...freshDonelist(), date: dateStr });
    renderDonelistNav();
    void hydrateDonelistFromSupabase(dateStr);
  }

  function donelistPrevMonth() {
    var y = donelistYear(), m = donelistMonth(), d = donelistDay();
    m--; if (m < 1) { m = 12; y--; }
    d = Math.min(d, daysInMonth(y, m));
    donelistSaveAndLoad(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  function donelistNextMonth() {
    var y = donelistYear(), m = donelistMonth(), d = donelistDay();
    m++; if (m > 12) { m = 1; y++; }
    d = Math.min(d, daysInMonth(y, m));
    var ds = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (ds > TODAY()) return;
    donelistSaveAndLoad(ds);
  }
  function donelistPrevDay() {
    var y = donelistYear(), m = donelistMonth(), d = donelistDay();
    d--; if (d < 1) { m--; if (m < 1) { m = 12; y--; } d = daysInMonth(y, m); }
    donelistSaveAndLoad(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  function donelistNextDay() {
    var y = donelistYear(), m = donelistMonth(), d = donelistDay();
    d++;
    if (d > daysInMonth(y, m)) { d = 1; m++; if (m > 12) { m = 1; y++; } }
    var ds = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (ds > TODAY()) return;
    donelistSaveAndLoad(ds);
  }

  // Override collectDonelistData to use view date
  var _origCollectDonelistData = collectDonelistData;
  collectDonelistData = function () {
    var d = _origCollectDonelistData();
    d.date = donelistViewDate;
    return d;
  };

  // --- Weekly navigation ---
  let weeklyViewKey = weeklyReviewDateKey(new Date());

  function weeklyParseKey() {
    var parts = weeklyViewKey.split("-");
    return { y: parseInt(parts[0]), m: parseInt(parts[1]), w: parseInt(parts[2]) };
  }

  function renderWeeklyNav() {
    var p = weeklyParseKey();
    document.getElementById("weekly-cur-month").textContent = p.m;
    document.getElementById("weekly-cur-week").textContent = p.w;
    document.getElementById("weekly-date-range").textContent = formatWeekRangeLabel(p.y, p.m, p.w);
  }

  function weeklySaveAndLoad(key) {
    saveWeeklyReview();
    weeklyViewKey = key;
    var loaded = loadWeeklyReviewForKey(key);
    renderWeeklyReview(loaded || { ...freshWeeklyReview(), dateKey: key });
    renderWeeklyNav();
    void hydrateWeeklyReviewFromSupabase(key);
  }

  function weeklyPrevMonth() {
    var p = weeklyParseKey();
    p.m--; if (p.m < 1) { p.m = 12; p.y--; }
    p.w = Math.min(p.w, maxWeeksInMonth(p.y, p.m));
    weeklySaveAndLoad(`${p.y}-${p.m}-${p.w}`);
  }
  function weeklyNextMonth() {
    var p = weeklyParseKey();
    p.m++; if (p.m > 12) { p.m = 1; p.y++; }
    p.w = Math.min(p.w, maxWeeksInMonth(p.y, p.m));
    var nk = `${p.y}-${p.m}-${p.w}`;
    if (isFutureWeek(p.y, p.m, p.w)) return;
    weeklySaveAndLoad(nk);
  }
  function weeklyPrevWeek() {
    var p = weeklyParseKey();
    p.w--; if (p.w < 1) { p.m--; if (p.m < 1) { p.m = 12; p.y--; } p.w = maxWeeksInMonth(p.y, p.m); }
    weeklySaveAndLoad(`${p.y}-${p.m}-${p.w}`);
  }
  function weeklyNextWeek() {
    var p = weeklyParseKey();
    if (isFutureWeek(p.y, p.m, p.w + 1)) return;
    p.w++;
    if (p.w > maxWeeksInMonth(p.y, p.m)) { p.w = 1; p.m++; if (p.m > 12) { p.m = 1; p.y++; } }
    weeklySaveAndLoad(`${p.y}-${p.m}-${p.w}`);
  }

  // Override collectWeeklyData
  var _origCollectWeeklyData = collectWeeklyData;
  collectWeeklyData = function () {
    var d = _origCollectWeeklyData();
    d.dateKey = weeklyViewKey;
    return d;
  };

  // --- Monthly navigation ---
  let monthlyViewKey = monthlyReviewDateKey(new Date());

  function monthlyParseKey() {
    var parts = monthlyViewKey.split("-");
    return { y: parseInt(parts[0]), m: parseInt(parts[1]) };
  }

  function renderMonthlyNav() {
    var p = monthlyParseKey();
    document.getElementById("monthly-cur-year").textContent = p.y;
    document.getElementById("monthly-cur-month").textContent = p.m;
  }

  function monthlySaveAndLoad(key) {
    saveMonthlyReview();
    monthlyViewKey = key;
    var loaded = loadMonthlyReviewForKey(key);
    renderMonthlyReview(loaded || { ...freshMonthlyReview(), dateKey: key });
    renderMonthlyNav();
    void hydrateMonthlyReviewFromSupabase(key);
  }

  function monthlyPrevYear() { var p = monthlyParseKey(); monthlySaveAndLoad(`${p.y - 1}-${p.m}`); }
  function monthlyNextYear() {
    var p = monthlyParseKey();
    if (isFutureMonth(p.y + 1, p.m)) return;
    monthlySaveAndLoad(`${p.y + 1}-${p.m}`);
  }
  function monthlyPrevMonth() {
    var p = monthlyParseKey();
    p.m--; if (p.m < 1) { p.m = 12; p.y--; }
    monthlySaveAndLoad(`${p.y}-${p.m}`);
  }
  function monthlyNextMonth() {
    var p = monthlyParseKey();
    if (isFutureMonth(p.y, p.m + 1)) return;
    p.m++; if (p.m > 12) { p.m = 1; p.y++; }
    monthlySaveAndLoad(`${p.y}-${p.m}`);
  }

  // Override collectMonthlyData
  var _origCollectMonthlyData = collectMonthlyData;
  collectMonthlyData = function () {
    var d = _origCollectMonthlyData();
    d.dateKey = monthlyViewKey;
    return d;
  };

  // Helper: max weeks in month
  function maxWeeksInMonth(year, month) {
    const firstStart = firstMondayWeekStartOfMonth(year, month);
    const lastStart = startOfMondayWeek(new Date(year, month - 1, daysInMonth(year, month)));
    return Math.floor((lastStart - firstStart) / 604800000) + 1;
  }
  function isFutureDay(year, month, day) {
    var now = new Date();
    return new Date(year, month - 1, day) > new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  function isFutureWeek(year, month, weekNum) {
    var now = new Date();
    const range = getWeekRange(year, month, weekNum);
    return range.start > startOfMondayWeek(now);
  }
  function isFutureMonth(year, month) {
    var now = new Date();
    if (year > now.getFullYear()) return true;
    if (year < now.getFullYear()) return false;
    return month > now.getMonth() + 1;
  }

  // --- Nav button event bindings ---
  document.getElementById("donelist-prev-month").addEventListener("click", donelistPrevMonth);
  document.getElementById("donelist-next-month").addEventListener("click", donelistNextMonth);
  document.getElementById("donelist-prev-day").addEventListener("click", donelistPrevDay);
  document.getElementById("donelist-next-day").addEventListener("click", donelistNextDay);

  document.getElementById("weekly-prev-month").addEventListener("click", weeklyPrevMonth);
  document.getElementById("weekly-next-month").addEventListener("click", weeklyNextMonth);
  document.getElementById("weekly-prev-week").addEventListener("click", weeklyPrevWeek);
  document.getElementById("weekly-next-week").addEventListener("click", weeklyNextWeek);

  document.getElementById("monthly-prev-year").addEventListener("click", monthlyPrevYear);
  document.getElementById("monthly-next-year").addEventListener("click", monthlyNextYear);
  document.getElementById("monthly-prev-month").addEventListener("click", monthlyPrevMonth);
  document.getElementById("monthly-next-month").addEventListener("click", monthlyNextMonth);

  // --- History Browser (read-only) ---
  var historyState = {
    tab: "day",
    year: 0, month: 0, day: 0,
    weekYear: 0, weekMonth: 0, weekNum: 0,
    monthYear: 0, monthMonth: 0,
  };

  var historyEls = {
    dialog: document.getElementById("history-dialog"),
    closeBtn: document.getElementById("history-close"),
    tabDay: document.getElementById("history-tab-day"),
    tabWeek: document.getElementById("history-tab-week"),
    tabMonth: document.getElementById("history-tab-month"),
    nav: document.getElementById("history-nav"),
    content: document.getElementById("history-content"),
  };
  let historyDaySnapshot = null;
  let historyWeekSnapshot = null;
  let historyMonthSnapshot = null;

  function getWeekday(year, month, day) { return new Date(year, month - 1, day).getDay(); }

  function historyDayPrevMonth() {
    historyState.month--; if (historyState.month < 1) { historyState.month = 12; historyState.year--; }
    historyState.day = Math.min(historyState.day, daysInMonth(historyState.year, historyState.month));
  }
  function historyDayNextMonth() {
    historyState.month++; if (historyState.month > 12) { historyState.month = 1; historyState.year++; }
    historyState.day = Math.min(historyState.day, daysInMonth(historyState.year, historyState.month));
    if (isFutureDay(historyState.year, historyState.month, historyState.day)) {
      historyState.month--; if (historyState.month < 1) { historyState.month = 12; historyState.year--; }
      historyState.day = Math.min(historyState.day, daysInMonth(historyState.year, historyState.month));
    }
  }
  function historyDayPrevDay() {
    historyState.day--; if (historyState.day < 1) { historyState.month--; if (historyState.month < 1) { historyState.month = 12; historyState.year--; } historyState.day = daysInMonth(historyState.year, historyState.month); }
  }
  function historyDayNextDay() {
    if (isFutureDay(historyState.year, historyState.month, historyState.day + 1)) return;
    historyState.day++; if (historyState.day > daysInMonth(historyState.year, historyState.month)) { historyState.day = 1; historyState.month++; if (historyState.month > 12) { historyState.month = 1; historyState.year++; } }
  }
  function historyWeekPrevMonth() {
    historyState.weekMonth--; if (historyState.weekMonth < 1) { historyState.weekMonth = 12; historyState.weekYear--; }
    historyState.weekNum = Math.min(historyState.weekNum, maxWeeksInMonth(historyState.weekYear, historyState.weekMonth));
  }
  function historyWeekNextMonth() {
    historyState.weekMonth++; if (historyState.weekMonth > 12) { historyState.weekMonth = 1; historyState.weekYear++; }
    historyState.weekNum = Math.min(historyState.weekNum, maxWeeksInMonth(historyState.weekYear, historyState.weekMonth));
    if (isFutureWeek(historyState.weekYear, historyState.weekMonth, historyState.weekNum)) {
      historyState.weekMonth--; if (historyState.weekMonth < 1) { historyState.weekMonth = 12; historyState.weekYear--; }
      historyState.weekNum = Math.min(historyState.weekNum, maxWeeksInMonth(historyState.weekYear, historyState.weekMonth));
    }
  }
  function historyWeekPrevWeek() {
    historyState.weekNum--; if (historyState.weekNum < 1) { historyState.weekMonth--; if (historyState.weekMonth < 1) { historyState.weekMonth = 12; historyState.weekYear--; } historyState.weekNum = maxWeeksInMonth(historyState.weekYear, historyState.weekMonth); }
  }
  function historyWeekNextWeek() {
    if (isFutureWeek(historyState.weekYear, historyState.weekMonth, historyState.weekNum + 1)) return;
    historyState.weekNum++; if (historyState.weekNum > maxWeeksInMonth(historyState.weekYear, historyState.weekMonth)) { historyState.weekNum = 1; historyState.weekMonth++; if (historyState.weekMonth > 12) { historyState.weekMonth = 1; historyState.weekYear++; } }
  }
  function historyMonthPrevYear() { historyState.monthYear--; }
  function historyMonthNextYear() {
    historyState.monthYear++; if (isFutureMonth(historyState.monthYear, historyState.monthMonth)) historyState.monthYear--;
  }
  function historyMonthPrevMonth() { historyState.monthMonth--; if (historyState.monthMonth < 1) { historyState.monthMonth = 12; historyState.monthYear--; } }
  function historyMonthNextMonth() {
    if (isFutureMonth(historyState.monthYear, historyState.monthMonth + 1)) return;
    historyState.monthMonth++; if (historyState.monthMonth > 12) { historyState.monthMonth = 1; historyState.monthYear++; }
  }

  function renderHistoryNav() {
    var h = "";
    if (historyState.tab === "day") {
      h += `<button class="history-nav-btn" onclick="window.__hDayPrevM()">◀</button>`;
      h += `<span class="history-nav-label">${historyState.month}<span class="history-nav-unit">月</span></span>`;
      h += `<button class="history-nav-btn" onclick="window.__hDayNextM()">▶</button>`;
      h += `<span style="width:8px;"></span>`;
      h += `<button class="history-nav-btn" onclick="window.__hDayPrevD()">◀</button>`;
      h += `<span class="history-nav-label">${historyState.day}<span class="history-nav-unit">日</span></span>`;
      h += `<button class="history-nav-btn" onclick="window.__hDayNextD()">▶</button>`;
      h += `<span class="history-nav-weekday">${WEEKDAY_NAMES[getWeekday(historyState.year, historyState.month, historyState.day)]} · ${formatFullDateLabel(historyState.year, historyState.month, historyState.day)}</span>`;
    } else if (historyState.tab === "week") {
      h += `<button class="history-nav-btn" onclick="window.__hWeekPrevM()">◀</button>`;
      h += `<span class="history-nav-label">${historyState.weekMonth}<span class="history-nav-unit">月</span></span>`;
      h += `<button class="history-nav-btn" onclick="window.__hWeekNextM()">▶</button>`;
      h += `<span style="width:8px;"></span>`;
      h += `<button class="history-nav-btn" onclick="window.__hWeekPrevW()">◀</button>`;
      h += `<span class="history-nav-label">${historyState.weekNum}<span class="history-nav-unit">周</span></span>`;
      h += `<button class="history-nav-btn" onclick="window.__hWeekNextW()">▶</button>`;
      h += `<span class="history-nav-weekday">${formatWeekRangeLabel(historyState.weekYear, historyState.weekMonth, historyState.weekNum)}</span>`;
    } else {
      h += `<button class="history-nav-btn" onclick="window.__hMonthPrevY()">◀</button>`;
      h += `<span class="history-nav-label">${historyState.monthYear}<span class="history-nav-unit">年</span></span>`;
      h += `<button class="history-nav-btn" onclick="window.__hMonthNextY()">▶</button>`;
      h += `<span style="width:8px;"></span>`;
      h += `<button class="history-nav-btn" onclick="window.__hMonthPrevM()">◀</button>`;
      h += `<span class="history-nav-label">${historyState.monthMonth}<span class="history-nav-unit">月</span></span>`;
      h += `<button class="history-nav-btn" onclick="window.__hMonthNextM()">▶</button>`;
    }
    historyEls.nav.innerHTML = h;
  }

  function renderHistoryDayContent() {
    var ds = `${historyState.year}-${String(historyState.month).padStart(2, "0")}-${String(historyState.day).padStart(2, "0")}`;
    var data = loadDonelistForDate(ds) || freshDonelist();
    historyDaySnapshot = data;
    var localDataJson = JSON.stringify(data);
    var mode = getReviewMode(data.mode);
    var h = '';
    h += `<p class="review-history-mode">当前模式：${getReviewModeLabel(mode)}</p>`;
    if (mode === "free") {
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">随记</h3>';
      h += '<p class="donelist-hint">这条记录会在复制时保留原文，并自动带上对应的 #日期 标签。</p>';
      h += `<textarea id="h-freeform" class="donelist-input review-freeform-input" placeholder="今天想怎么记都可以，随便写...">${escapeHtml(data.freeform || "")}</textarea></section>`;
    } else {
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">收获</h3>';
      h += `<textarea id="h-emotionKit" class="donelist-input" placeholder="今天收获了什么...">${escapeHtml(data.emotionKit || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">复盘</h3>';
      h += `<textarea id="h-review" class="donelist-input" placeholder="今天的收获和反思...">${escapeHtml(data.review || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">正向链接（生活中的美好）</h3>';
      h += `<textarea id="h-positive" class="donelist-input" placeholder="今天遇到的美好事物...">${escapeHtml(data.positive || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">具体事件</h3>';
      h += `<textarea id="h-events" class="donelist-input" placeholder="今天发生了什么...">${escapeHtml(data.events || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">感谢</h3>';
      h += `<textarea id="h-gratitude" class="donelist-input" placeholder="今天想感谢什么...">${escapeHtml(data.gratitude || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">夸夸自己</h3>';
      h += `<textarea id="h-selfPraise" class="donelist-input" placeholder="今天做得好的地方...">${escapeHtml(data.selfPraise || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">身体</h3>';
      h += `<textarea id="h-body" class="donelist-input" placeholder="身体状况、运动、睡眠...">${escapeHtml(data.body || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">情绪</h3>';
      h += `<textarea id="h-emotion" class="donelist-input" placeholder="今天情绪如何...">${escapeHtml(data.emotion || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">自由发泄区</h3>';
      h += `<textarea id="h-vent" class="donelist-input" placeholder="随便写点什么...">${escapeHtml(data.vent || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">明日计划</h3>';
      h += `<textarea id="h-tomorrowPlan" class="donelist-input" placeholder="明天的计划是什么...">${escapeHtml(data.tomorrowPlan || "")}</textarea></section>`;
    }
    h += renderScoreHistoryBlock(data.scoreEntries || []);
    historyEls.content.innerHTML = h;
    requestAnimationFrame(function () { refreshAutoResizeTextareas(historyEls.content); });
    void (async function () {
      const remote = await loadDonelistFromSupabase(ds);
      if (!remote || historyState.tab !== "day") return;
      var currentDs = `${historyState.year}-${String(historyState.month).padStart(2, "0")}-${String(historyState.day).padStart(2, "0")}`;
      if (currentDs !== ds) return;
      if (JSON.stringify(remote) === localDataJson) return;
      localStorage.setItem(donelistDateKey(ds), JSON.stringify(remote));
      renderHistoryDayContent();
    })();
  }

  function collectHistoryDayData() {
    var getVal = function (id) { var el = document.getElementById(id); return el ? el.value : ""; };
    var ds = `${historyState.year}-${String(historyState.month).padStart(2, "0")}-${String(historyState.day).padStart(2, "0")}`;
    var base = historyDaySnapshot || freshDonelist();
    var mode = getReviewMode(base.mode);
    return {
      ...base,
      date: ds,
      mode,
      freeform: mode === "free" ? getVal("h-freeform") : (base.freeform || ""),
      positive: mode === "free" ? (base.positive || "") : getVal("h-positive"),
      events: mode === "free" ? (base.events || "") : getVal("h-events"),
      gratitude: mode === "free" ? (base.gratitude || "") : getVal("h-gratitude"),
      selfPraise: mode === "free" ? (base.selfPraise || "") : getVal("h-selfPraise"),
      review: mode === "free" ? (base.review || "") : getVal("h-review"),
      body: mode === "free" ? (base.body || "") : getVal("h-body"),
      emotion: mode === "free" ? (base.emotion || "") : getVal("h-emotion"),
      emotionKit: mode === "free" ? (base.emotionKit || "") : getVal("h-emotionKit"),
      vent: mode === "free" ? (base.vent || "") : getVal("h-vent"),
      tomorrowPlan: mode === "free" ? (base.tomorrowPlan || "") : getVal("h-tomorrowPlan"),
      scoreEntries: normalizeScoreEntries(base.scoreEntries),
    };
  }

  function saveHistoryDay() {
    var data = collectHistoryDayData();
    var ds = `${historyState.year}-${String(historyState.month).padStart(2, "0")}-${String(historyState.day).padStart(2, "0")}`;
    localStorage.setItem(donelistDateKey(ds), JSON.stringify(data));
    syncTomorrowPlanToNextFrog(data);
    syncDonelistToSupabase(data);
  }

  function renderHistoryWeekContent() {
    var dk = `${historyState.weekYear}-${historyState.weekMonth}-${historyState.weekNum}`;
    var data = loadWeeklyReviewForKey(dk) || freshWeeklyReview();
    historyWeekSnapshot = data;
    var localDataJson = JSON.stringify(data);
    var mode = getReviewMode(data.mode);
    var h = '';
    h += `<p class="review-history-mode">当前模式：${getReviewModeLabel(mode)}</p>`;
    if (mode === "free") {
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">随记</h3>';
      h += '<p class="donelist-hint">这条记录会在复制时保留原文，并自动带上对应的 #日期 标签。</p>';
      h += `<textarea id="hw-freeform" class="donelist-input review-freeform-input" placeholder="这周想怎么复盘都可以，随便写...">${escapeHtml(data.freeform || "")}</textarea></section>`;
    } else {
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">本周事件</h3>';
      h += `<textarea id="hw-events" class="donelist-input" placeholder="这周发生了什么事情...">${escapeHtml(data.events || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">身体</h3>';
      h += `<textarea id="hw-body" class="donelist-input" placeholder="身体状况、运动、睡眠...">${escapeHtml(data.body || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">感恩的事情</h3>';
      h += `<textarea id="hw-gratitude" class="donelist-input" placeholder="这周想感恩什么...">${escapeHtml(data.gratitude || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">本周进步</h3>';
      h += `<textarea id="hw-progress" class="donelist-input" placeholder="这周进步了什么...">${escapeHtml(data.progress || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">本周收获知识</h3>';
      h += `<textarea id="hw-knowledge" class="donelist-input" placeholder="这周学到了什么新知识...">${escapeHtml(data.knowledge || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">本周反思</h3>';
      h += `<textarea id="hw-reflection" class="donelist-input" placeholder="这周的收获和反思...">${escapeHtml(data.reflection || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">下周计划</h3>';
      h += `<textarea id="hw-nextPlan" class="donelist-input" placeholder="下周的计划是什么...">${escapeHtml(data.nextPlan || "")}</textarea></section>`;
    }
    historyEls.content.innerHTML = h;
    requestAnimationFrame(function () { refreshAutoResizeTextareas(historyEls.content); });
    void (async function () {
      const remote = await loadWeeklyReviewFromSupabase(dk);
      if (!remote || historyState.tab !== "week") return;
      var currentDk = `${historyState.weekYear}-${historyState.weekMonth}-${historyState.weekNum}`;
      if (currentDk !== dk) return;
      if (JSON.stringify(remote) === localDataJson) return;
      localStorage.setItem(weeklyReviewStorageKey(dk), JSON.stringify(remote));
      renderHistoryWeekContent();
    })();
  }

  function collectHistoryWeekData() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value : ""; };
    var base = historyWeekSnapshot || freshWeeklyReview();
    var mode = getReviewMode(base.mode);
    return {
      ...base,
      dateKey: `${historyState.weekYear}-${historyState.weekMonth}-${historyState.weekNum}`,
      mode,
      freeform: mode === "free" ? g("hw-freeform") : (base.freeform || ""),
      events: mode === "free" ? (base.events || "") : g("hw-events"),
      body: mode === "free" ? (base.body || "") : g("hw-body"),
      gratitude: mode === "free" ? (base.gratitude || "") : g("hw-gratitude"),
      progress: mode === "free" ? (base.progress || "") : g("hw-progress"),
      knowledge: mode === "free" ? (base.knowledge || "") : g("hw-knowledge"),
      reflection: mode === "free" ? (base.reflection || "") : g("hw-reflection"),
      nextPlan: mode === "free" ? (base.nextPlan || "") : g("hw-nextPlan"),
    };
  }

  function saveHistoryWeek() {
    var data = collectHistoryWeekData();
    localStorage.setItem(weeklyReviewStorageKey(data.dateKey), JSON.stringify(data));
    syncWeeklyReviewToSupabase(data);
  }

  function renderHistoryMonthContent() {
    var dk = `${historyState.monthYear}-${historyState.monthMonth}`;
    var data = loadMonthlyReviewForKey(dk) || freshMonthlyReview();
    historyMonthSnapshot = data;
    var localDataJson = JSON.stringify(data);
    var mode = getReviewMode(data.mode);
    var h = '';
    h += `<p class="review-history-mode">当前模式：${getReviewModeLabel(mode)}</p>`;
    if (mode === "free") {
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">随记</h3>';
      h += '<p class="donelist-hint">这条记录会在复制时保留原文，并自动带上对应的 #日期 标签。</p>';
      h += `<textarea id="hm-freeform" class="donelist-input review-freeform-input" placeholder="这个月想怎么复盘都可以，随便写...">${escapeHtml(data.freeform || "")}</textarea></section>`;
    } else {
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">本月的关键词</h3>';
      h += `<textarea id="hm-keywords" class="donelist-input" placeholder="用几个关键词概括这个月...">${escapeHtml(data.keywords || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">本月事件</h3>';
      h += `<textarea id="hm-events" class="donelist-input" placeholder="这个月发生了什么事情...">${escapeHtml(data.events || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">身体</h3>';
      h += `<textarea id="hm-body" class="donelist-input" placeholder="身体状况、运动、睡眠...">${escapeHtml(data.body || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">感恩的事情</h3>';
      h += `<textarea id="hm-gratitude" class="donelist-input" placeholder="这个月想感恩什么...">${escapeHtml(data.gratitude || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">本月进步</h3>';
      h += `<textarea id="hm-progress" class="donelist-input" placeholder="这个月进步了什么...">${escapeHtml(data.progress || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">本月收获知识</h3>';
      h += `<textarea id="hm-knowledge" class="donelist-input" placeholder="这个月学到了什么新知识...">${escapeHtml(data.knowledge || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">本月反思</h3>';
      h += `<textarea id="hm-reflection" class="donelist-input" placeholder="这个月的收获和反思...">${escapeHtml(data.reflection || "")}</textarea></section>`;
      h += '<section class="panel donelist-section"><h3 class="donelist-period-title">下月计划</h3>';
      h += `<textarea id="hm-nextPlan" class="donelist-input" placeholder="下个月的计划是什么...">${escapeHtml(data.nextPlan || "")}</textarea></section>`;
    }
    historyEls.content.innerHTML = h;
    requestAnimationFrame(function () { refreshAutoResizeTextareas(historyEls.content); });
    void (async function () {
      const remote = await loadMonthlyReviewFromSupabase(dk);
      if (!remote || historyState.tab !== "month") return;
      var currentDk = `${historyState.monthYear}-${historyState.monthMonth}`;
      if (currentDk !== dk) return;
      if (JSON.stringify(remote) === localDataJson) return;
      localStorage.setItem(monthlyReviewStorageKey(dk), JSON.stringify(remote));
      renderHistoryMonthContent();
    })();
  }

  function collectHistoryMonthData() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value : ""; };
    var base = historyMonthSnapshot || freshMonthlyReview();
    var mode = getReviewMode(base.mode);
    return {
      ...base,
      dateKey: `${historyState.monthYear}-${historyState.monthMonth}`,
      mode,
      freeform: mode === "free" ? g("hm-freeform") : (base.freeform || ""),
      keywords: mode === "free" ? (base.keywords || "") : g("hm-keywords"),
      events: mode === "free" ? (base.events || "") : g("hm-events"),
      body: mode === "free" ? (base.body || "") : g("hm-body"),
      gratitude: mode === "free" ? (base.gratitude || "") : g("hm-gratitude"),
      progress: mode === "free" ? (base.progress || "") : g("hm-progress"),
      knowledge: mode === "free" ? (base.knowledge || "") : g("hm-knowledge"),
      reflection: mode === "free" ? (base.reflection || "") : g("hm-reflection"),
      nextPlan: mode === "free" ? (base.nextPlan || "") : g("hm-nextPlan"),
    };
  }

  function saveHistoryMonth() {
    var data = collectHistoryMonthData();
    localStorage.setItem(monthlyReviewStorageKey(data.dateKey), JSON.stringify(data));
    syncMonthlyReviewToSupabase(data);
  }

  // Auto-save before switching tabs or navigating in history
  function saveCurrentHistoryTab() {
    if (!historyContentRendered) return;
    if (historyState.tab === "day") saveHistoryDay();
    else if (historyState.tab === "week") saveHistoryWeek();
    else saveHistoryMonth();
  }

  function renderHistoryContent() {
    if (historyState.tab === "day") renderHistoryDayContent();
    else if (historyState.tab === "week") renderHistoryWeekContent();
    else renderHistoryMonthContent();
  }

  function refreshHistory() { renderHistoryNav(); renderHistoryContent(); }

  function switchHistoryTab(tab) {
    saveCurrentHistoryTab();
    historyState.tab = tab;
    var now = new Date();
    if (tab === "day") { historyState.year = now.getFullYear(); historyState.month = now.getMonth() + 1; historyState.day = now.getDate(); }
    else if (tab === "week") { historyState.weekYear = now.getFullYear(); historyState.weekMonth = now.getMonth() + 1; historyState.weekNum = getWeekOfMonth(now); }
    else { historyState.monthYear = now.getFullYear(); historyState.monthMonth = now.getMonth() + 1; }
    historyEls.tabDay.classList.toggle("is-active", tab === "day");
    historyEls.tabWeek.classList.toggle("is-active", tab === "week");
    historyEls.tabMonth.classList.toggle("is-active", tab === "month");
    refreshHistory();
  }

  // Expose nav functions
  function wrapHNav(fn) { return function () { saveCurrentHistoryTab(); fn(); refreshHistory(); }; }
  window.__hDayPrevM = wrapHNav(historyDayPrevMonth);
  window.__hDayNextM = wrapHNav(historyDayNextMonth);
  window.__hDayPrevD = wrapHNav(historyDayPrevDay);
  window.__hDayNextD = wrapHNav(historyDayNextDay);
  window.__hWeekPrevM = wrapHNav(historyWeekPrevMonth);
  window.__hWeekNextM = wrapHNav(historyWeekNextMonth);
  window.__hWeekPrevW = wrapHNav(historyWeekPrevWeek);
  window.__hWeekNextW = wrapHNav(historyWeekNextWeek);
  window.__hMonthPrevY = wrapHNav(historyMonthPrevYear);
  window.__hMonthNextY = wrapHNav(historyMonthNextYear);
  window.__hMonthPrevM = wrapHNav(historyMonthPrevMonth);
  window.__hMonthNextM = wrapHNav(historyMonthNextMonth);

  // "回顾" buttons inside each dialog
  var historyContentRendered = false;
  document.getElementById("donelist-goto-history").addEventListener("click", function () {
    historyState.year = donelistYear(); historyState.month = donelistMonth(); historyState.day = donelistDay();
    historyState.tab = "day";
    historyEls.tabDay.classList.add("is-active");
    historyEls.tabWeek.classList.remove("is-active");
    historyEls.tabMonth.classList.remove("is-active");
    if (!historyEls.dialog.open) historyEls.dialog.showModal();
    historyContentRendered = true;
    refreshHistory();
  });
  document.getElementById("weekly-review-goto-history").addEventListener("click", function () {
    var p = weeklyParseKey();
    historyState.weekYear = p.y; historyState.weekMonth = p.m; historyState.weekNum = p.w;
    historyState.tab = "week";
    historyEls.tabDay.classList.remove("is-active");
    historyEls.tabWeek.classList.add("is-active");
    historyEls.tabMonth.classList.remove("is-active");
    if (!historyEls.dialog.open) historyEls.dialog.showModal();
    historyContentRendered = true;
    refreshHistory();
  });
  document.getElementById("monthly-review-goto-history").addEventListener("click", function () {
    var p = monthlyParseKey();
    historyState.monthYear = p.y; historyState.monthMonth = p.m;
    historyState.tab = "month";
    historyEls.tabDay.classList.remove("is-active");
    historyEls.tabWeek.classList.remove("is-active");
    historyEls.tabMonth.classList.add("is-active");
    if (!historyEls.dialog.open) historyEls.dialog.showModal();
    historyContentRendered = true;
    refreshHistory();
  });

  historyEls.closeBtn.addEventListener("click", function () {
    saveCurrentHistoryTab();
    historyContentRendered = false;
    historyEls.dialog.close();
  });
  historyEls.tabDay.addEventListener("click", function () { switchHistoryTab("day"); });
  historyEls.tabWeek.addEventListener("click", function () { switchHistoryTab("week"); });
  historyEls.tabMonth.addEventListener("click", function () { switchHistoryTab("month"); });

  // --- Patch open functions to init nav ---
  var _origOpenDonelist = openDonelist;
  openDonelist = function () {
    donelistViewDate = TODAY();
    var data = loadDonelistForDate(TODAY());
    renderDonelist(data || freshDonelist());
    renderDonelistNav();
    if (!donelistEls.dialog.open) donelistEls.dialog.showModal();
    void hydrateDonelistFromSupabase(TODAY());
  };
  donelistEls.openBtn.removeEventListener("click", _origOpenDonelist);
  donelistEls.openBtn.addEventListener("click", openDonelist);

  var _origOpenWeeklyReview = openWeeklyReview;
  openWeeklyReview = function () {
    weeklyViewKey = weeklyReviewDateKey(new Date());
    var data = loadWeeklyReviewForKey(weeklyViewKey);
    renderWeeklyReview(data || freshWeeklyReview());
    renderWeeklyNav();
    if (!weeklyEls.dialog.open) weeklyEls.dialog.showModal();
    void hydrateWeeklyReviewFromSupabase(weeklyViewKey);
  };
  weeklyEls.openBtn.removeEventListener("click", _origOpenWeeklyReview);
  weeklyEls.openBtn.addEventListener("click", openWeeklyReview);

  var _origOpenMonthlyReview = openMonthlyReview;
  openMonthlyReview = function () {
    monthlyViewKey = monthlyReviewDateKey(new Date());
    var data = loadMonthlyReviewForKey(monthlyViewKey);
    renderMonthlyReview(data || freshMonthlyReview());
    renderMonthlyNav();
    if (!monthlyEls.dialog.open) monthlyEls.dialog.showModal();
    void hydrateMonthlyReviewFromSupabase(monthlyViewKey);
  };
  monthlyEls.openBtn.removeEventListener("click", _origOpenMonthlyReview);
  monthlyEls.openBtn.addEventListener("click", openMonthlyReview);
})();
