(function () {
  const STORAGE_KEY = "micro-habit-local-state-v1";
  const DEFAULT_APP_VERSION = "2026.04.27-mainlines";
  const TODAY = () => new Date().toISOString().slice(0, 10);

  const state = {
    mode: "local",
    session: null,
    habits: [],
    completions: {},
    mainlines: [],
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
      }),
    );
  }

  function hydrateStateFromSavedState(saved = loadLocalState()) {
    state.habits = Array.isArray(saved.habits) ? saved.habits : [];
    state.completions =
      saved.completions && typeof saved.completions === "object" ? saved.completions : {};
    state.mainlines = parseMainlinesContent(saved.mainlines, saved.mainline);
    selectedMainlineId = state.mainlines[0]?.id || null;
  }

  function getErrorMessage(error, fallback = "发生了未知错误。") {
    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message.trim();
    }
    return fallback;
  }

  function isMissingMainlineSchemaError(error) {
    const detail = [
      error?.code,
      error?.message,
      error?.details,
      error?.hint,
    ]
      .filter((value) => typeof value === "string" && value.trim())
      .join(" ")
      .toLowerCase();

    return detail.includes("user_mainlines") || error?.code === "PGRST205";
  }

  function getMainlineSchemaNotice() {
    return "当前 Supabase 还是旧版表结构：习惯同步可继续使用，但“主线”同步需要重新执行最新的 supabase/schema.sql。";
  }

  function createMainline(partial = {}) {
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
    };
  }

  function createLegacyMainline(content) {
    const title = typeof content === "string" ? content.trim() : "";
    return title ? [createMainline({ title })] : [];
  }

  function normalizeMainlineCollection(items) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        if (typeof item === "string") {
          return createMainline({ title: item });
        }
        if (!item || typeof item !== "object") return null;
        return createMainline(item);
      })
      .filter(Boolean);
  }

  function parseMainlinesContent(savedMainlines, legacyMainline = "") {
    const normalizedMainlines = normalizeMainlineCollection(savedMainlines);
    if (normalizedMainlines.length) {
      return normalizedMainlines;
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
      version: 2,
      items: state.mainlines.map((mainline) => ({
        id: mainline.id,
        title: mainline.title,
        why: mainline.why,
        outcome: mainline.outcome,
        firstStep: mainline.firstStep,
        howWhere: mainline.howWhere,
        costOfNotDoing: mainline.costOfNotDoing,
        createdAt: mainline.createdAt,
        updatedAt: mainline.updatedAt,
      })),
    });
  }

  function ensureSelectedMainline() {
    if (!state.mainlines.length) {
      selectedMainlineId = null;
      return null;
    }

    const selected =
      state.mainlines.find((mainline) => mainline.id === selectedMainlineId) || state.mainlines[0];
    selectedMainlineId = selected.id;
    return selected;
  }

  function getSelectedMainline() {
    return ensureSelectedMainline();
  }

  function getMainlineListLabel(mainline, index) {
    const title = typeof mainline?.title === "string" ? mainline.title.trim() : "";
    if (title) return title;
    return `未命名主线 ${index + 1}`;
  }

  function getTodayCompletions() {
    return state.completions[TODAY()] || [];
  }

  function setTodayCompletions(ids) {
    state.completions[TODAY()] = ids;
  }

  function getActiveHabits() {
    return state.habits
      .filter((habit) => habit.active !== false)
      .sort((a, b) => a.order - b.order);
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
      const currentIndex = activeHabits.findIndex((h) => h.id === nextHabit.id);
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
      li.innerHTML = `
        <span class="today-check"></span>
        <span class="today-title">${escapeHtml(habit.title)}</span>
      `;
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

    state.habits
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((habit, index) => {
        const li = document.createElement("li");
        li.className = "habit-item";
        li.innerHTML = `
          <div>
            <div class="habit-row-title">${escapeHtml(habit.title)}</div>
            <div class="habit-row-meta">${habit.active === false ? "已停用" : "启用中"} · 排序 ${index + 1}</div>
          </div>
          <button class="small-button move-up" type="button" aria-label="上移">↑</button>
          <button class="small-button toggle-active" type="button" aria-label="切换启用">${habit.active === false ? "启用" : "停用"}</button>
          <button class="small-button danger delete-habit" type="button" aria-label="删除">删</button>
        `;
        li.querySelector(".move-up").addEventListener("click", () => moveHabit(habit.id, -1));
        li.querySelector(".toggle-active").addEventListener("click", () => toggleHabit(habit.id));
        li.querySelector(".delete-habit").addEventListener("click", () => deleteHabit(habit.id));
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
    const hasMainlines = state.mainlines.length > 0;

    els.mainlineCount.textContent = `${state.mainlines.length} 条`;
    els.mainlineEmpty.hidden = hasMainlines;
    els.mainlineList.hidden = !hasMainlines;
    els.mainlineList.innerHTML = "";

    state.mainlines.forEach((mainline, index) => {
      const li = document.createElement("li");
      li.className = "mainline-list-item";

      const button = document.createElement("button");
      button.type = "button";
      button.className = `mainline-list-button${mainline.id === selected?.id ? " is-active" : ""}`;
      button.innerHTML = `
        <span class="mainline-list-title">${escapeHtml(getMainlineListLabel(mainline, index))}</span>
        <span class="mainline-list-meta">${escapeHtml(mainline.why || "还没填写“为什么做”")}</span>
      `;
      button.addEventListener("click", () => selectMainline(mainline.id));

      li.appendChild(button);
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
  }

  function focusMainlineTitleInput() {
    requestAnimationFrame(() => {
      if (els.mainlineForm.hidden) return;
      els.mainlineTitleInput.focus();
      const value = els.mainlineTitleInput.value;
      els.mainlineTitleInput.setSelectionRange(value.length, value.length);
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

  function selectMainline(id) {
    updateSelectedMainlineFromForm();
    selectedMainlineId = id;
    renderMainlineDialog();
  }

  async function addMainline() {
    updateSelectedMainlineFromForm();
    const nextNumber = state.mainlines.length + 1;
    const mainline = createMainline({
      title: `新的主线 ${nextNumber}`,
    });
    state.mainlines.push(mainline);
    selectedMainlineId = mainline.id;
    await persistAll();
    focusMainlineTitleInput();
  }

  async function deleteSelectedMainline() {
    const selected = getSelectedMainline();
    if (!selected) return;
    const selectedIndex = state.mainlines.findIndex((mainline) => mainline.id === selected.id);
    if (!confirm(`确定删除“${getMainlineListLabel(selected, Math.max(selectedIndex, 0))}”吗？`)) {
      return;
    }

    state.mainlines = state.mainlines.filter((mainline) => mainline.id !== selected.id);
    selectedMainlineId = state.mainlines[0]?.id || null;
    await persistAll();
  }

  function normalizeOrders() {
    state.habits
      .sort((a, b) => a.order - b.order)
      .forEach((habit, index) => {
        habit.order = index;
      });
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

  async function moveHabit(id, delta) {
    const sorted = state.habits.slice().sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((habit) => habit.id === id);
    if (index < 0) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= sorted.length) return;
    [sorted[index], sorted[nextIndex]] = [sorted[nextIndex], sorted[index]];
    sorted.forEach((habit, idx) => {
      const target = state.habits.find((item) => item.id === habit.id);
      if (target) target.order = idx;
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

  async function completeCurrentHabit() {
    if (!state.currentHabitId) return;
    const completed = new Set(getTodayCompletions());
    completed.add(state.currentHabitId);
    setTodayCompletions(Array.from(completed));
    state.skippedToday = state.skippedToday.filter((id) => id !== state.currentHabitId);
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

    async function syncMainlineOrWarn(userId) {
      const mainlinesPayload = serializeMainlinesPayload();

      try {
        if (mainlinesPayload) {
          const { error } = await client.from("user_mainlines").upsert(
            {
              user_id: userId,
              content: mainlinesPayload,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
          if (error) throw error;
        } else {
          const { error } = await client.from("user_mainlines").delete().eq("user_id", userId);
          if (error) throw error;
        }
        state.supabaseNotice = "";
      } catch (error) {
        if (isMissingMainlineSchemaError(error)) {
          state.supabaseNotice = getMainlineSchemaNotice();
          return;
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

      const { data: mainlineRow, error: mainlineError } = await client
        .from("user_mainlines")
        .select("content")
        .maybeSingle();

      if (mainlineError) {
        if (isMissingMainlineSchemaError(mainlineError)) {
          state.mainlines = parseMainlinesContent(savedState.mainlines, savedState.mainline);
          selectedMainlineId = state.mainlines[0]?.id || null;
          state.supabaseNotice = getMainlineSchemaNotice();
        } else {
          throw mainlineError;
        }
      } else {
        state.mainlines = parseMainlinesPayload(mainlineRow?.content);
        selectedMainlineId = state.mainlines[0]?.id || null;
        state.supabaseNotice = "";
      }

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

        await syncMainlineOrWarn(userId);
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
    renderSettings();
  }

  async function initProvider() {
    const setupStatus = getSupabaseSetupStatus();
    if (setupStatus.ready) {
      const config = window.APP_CONFIG || {};
      provider = createSupabaseProvider(config);
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
        renderSettings();
      } catch (error) {
        alert(error.message || "退出失败");
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
})();
