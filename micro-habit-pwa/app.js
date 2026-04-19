(function () {
  const STORAGE_KEY = "micro-habit-local-state-v1";
  const TODAY = () => new Date().toISOString().slice(0, 10);

  const state = {
    mode: "local",
    session: null,
    habits: [],
    completions: {},
    currentHabitId: null,
    skippedToday: [],
  };

  const els = {
    modeBadge: document.getElementById("mode-badge"),
    taskOrder: document.getElementById("task-order"),
    taskTitle: document.getElementById("task-title"),
    taskHint: document.getElementById("task-hint"),
    completeTask: document.getElementById("complete-task"),
    skipTask: document.getElementById("skip-task"),
    todayProgress: document.getElementById("today-progress"),
    todayList: document.getElementById("today-list"),
    settingsDialog: document.getElementById("settings-dialog"),
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
      }),
    );
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
    const nextHabit = computeNextHabit();

    if (!activeHabits.length) {
      els.taskOrder.textContent = "还没有习惯";
      els.taskTitle.textContent = "先添加一个微习惯";
      els.taskHint.textContent = "建议从最小动作开始，比如喝一口水。";
      els.completeTask.disabled = true;
      els.skipTask.disabled = true;
    } else if (!nextHabit) {
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
    renderTodayList(activeHabits, completed);
  }

  function renderTodayList(activeHabits, completed) {
    els.todayList.innerHTML = "";
    if (!activeHabits.length) {
      const li = document.createElement("li");
      li.className = "today-item";
      li.innerHTML = '<span class="today-title">暂无习惯</span>';
      els.todayList.appendChild(li);
      return;
    }
    activeHabits.forEach((habit) => {
      const li = document.createElement("li");
      li.className = `today-item${completed.has(habit.id) ? " done" : ""}`;
      li.innerHTML = `
        <span class="today-check"></span>
        <span class="today-title">${escapeHtml(habit.title)}</span>
        <span class="habit-row-meta">${completed.has(habit.id) ? "已完成" : "待完成"}</span>
      `;
      els.todayList.appendChild(li);
    });
  }

  function renderSettings() {
    els.habitList.innerHTML = "";
    const activeCount = getActiveHabits().length;
    els.syncStatus.textContent =
      state.mode === "supabase"
        ? `已连接 Supabase，同步账号：${state.session?.user?.email || "未知"}`
        : "未连接 Supabase，当前只保存在本机。";

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

  function skipCurrentHabit() {
    if (!state.currentHabitId) return;
    if (!state.skippedToday.includes(state.currentHabitId)) {
      state.skippedToday.push(state.currentHabitId);
    }
    renderMain();
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const localProvider = {
    async init() {
      const saved = loadLocalState();
      state.habits = saved.habits || [];
      state.completions = saved.completions || {};
      state.mode = "local";
      state.session = null;
    },
    async persist() {
      saveLocalState();
    },
    async signIn() {
      throw new Error("当前未配置 Supabase。");
    },
    async signUp() {
      throw new Error("当前未配置 Supabase。");
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

    async function getSessionOrNull() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    }

    async function fetchHabits() {
      const session = await getSessionOrNull();
      state.session = session;
      if (!session) {
        state.habits = [];
        state.completions = {};
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
        state.habits = loadLocalState().habits || [];
        state.completions = loadLocalState().completions || {};
      },
    };
  }

  let provider = localProvider;

  async function persistAll() {
    normalizeOrders();
    saveLocalState();
    await provider.persist();
    renderMain();
    renderSettings();
  }

  async function initProvider() {
    const config = window.APP_CONFIG || {};
    if (config.supabaseUrl && config.supabaseAnonKey && window.supabase) {
      provider = createSupabaseProvider(config);
    }
    await provider.init();
    renderMain();
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
      renderSettings();
    } catch (error) {
      alert(error.message || "认证失败");
    }
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  function wireEvents() {
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
  initProvider();
  registerServiceWorker();
})();
