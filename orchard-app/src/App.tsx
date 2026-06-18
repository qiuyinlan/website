/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  ArrowLeft,
  Settings,
  Flame,
  Star,
  Quote,
  Timer,
  Heart,
  Undo2,
  Compass,
  Sprout,
  Plus,
  Trash2,
  Check
} from 'lucide-react';

import { MainProject, GoodStateCategory, InterestItem, TodayMustItem, GrandPrizeItem, FunctionBoard } from './types';
import {
  INITIAL_MAIN_PROJECTS,
  INITIAL_GOOD_STATES,
  INITIAL_INTERESTS,
  INITIAL_TODAY_MUST,
  INITIAL_GRAND_PRIZES,
  INITIAL_FUNCTION_BOARDS
} from './data';

import MainProjectsSection from './components/MainProjectsSection';
import GoodStateLibrary from './components/GoodStateLibrary';
import InterestPoolSection from './components/InterestPoolSection';
import MustAndPrizeSection from './components/MustAndPrizeSection';

declare global {
  interface Window {
    APP_CONFIG?: {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
    };
    supabase?: {
      createClient: (url: string, key: string) => {
        auth: {
          getSession: () => Promise<{ data: { session: { user: { id: string } } | null }; error: { message?: string } | null }>;
          signInWithPassword: (args: { email: string; password: string }) => Promise<{ error: { message?: string } | null }>;
          signUp: (args: { email: string; password: string }) => Promise<{ error: { message?: string } | null }>;
          signOut: () => Promise<{ error: { message?: string } | null }>;
        };
        from: (table: string) => {
          select: (columns: string) => {
            maybeSingle: () => Promise<{ data: { content?: unknown } | null; error: { message?: string; code?: string } | null }>;
          };
          upsert: (
            value: Record<string, unknown>,
            options?: { onConflict?: string }
          ) => Promise<{ error: { message?: string; code?: string } | null }>;
        };
      };
    };
  }
}

type OrchardSnapshot = {
  projects: MainProject[];
  goodStates: GoodStateCategory[];
  interests: InterestItem[];
  mustItems: TodayMustItem[];
  prizeItems: GrandPrizeItem[];
  functionBoards: FunctionBoard[];
  springDewPoints: number;
};

export default function App() {
  const appHomeHref = '../';

  // Navigation State: 'home' | 'detail-states' | 'detail-interests' | 'detail-must' | string
  const [view, setView] = useState<string>('home');

  // Core App States
  const [projects, setProjects] = useState<MainProject[]>([]);
  const [goodStates, setGoodStates] = useState<GoodStateCategory[]>([]);
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [mustItems, setMustItems] = useState<TodayMustItem[]>([]);
  const [prizeItems, setPrizeItems] = useState<GrandPrizeItem[]>([]);
  const [functionBoards, setFunctionBoards] = useState<FunctionBoard[]>([]);
  const [springDewPoints, setSpringDewPoints] = useState<number>(20); // starts with comfortable 20 points!
  const [syncMode, setSyncMode] = useState<'local' | 'supabase'>('local');
  const [syncStatus, setSyncStatus] = useState<string>('本地保存');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [pendingRemoteSync, setPendingRemoteSync] = useState<boolean>(false);

  const [isBoardsConfigMode, setIsBoardsConfigMode] = useState<boolean>(false);

  // Collapsible state for Today's Must checklist
  const [isMustExpanded, setIsMustExpanded] = useState<boolean>(false);

  // Synchronized controllers for Today's Must checklist on the homepage
  const handleToggleMust = (id: string) => {
    setMustItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextState = !item.isDone;
          if (nextState) {
            setSpringDewPoints(pts => pts + item.springDewValue);
          } else {
            setSpringDewPoints(pts => Math.max(0, pts - item.springDewValue));
          }
          return { ...item, isDone: nextState };
        }
        return item;
      })
    );
  };

  const handleDeleteMust = (id: string) => {
    setMustItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddMustDirect = (text: string) => {
    if (!text.trim()) return;
    const newItem: TodayMustItem = {
      id: `must-${Date.now()}`,
      content: text.trim(),
      isDone: false,
      springDewValue: 10
    };
    setMustItems(prev => [...prev, newItem]);
  };

  // Board customization handlers
  const handleAddBoard = () => {
    const newBoard: FunctionBoard = {
      id: `custom-${Date.now()}`,
      title: `自定义板块-${functionBoards.length + 1}`,
      subtitle: '点击进入自定义备忘与打卡',
      type: 'custom',
      themeColor: 'purple',
      customItems: []
    };
    setFunctionBoards(prev => [...prev, newBoard]);
  };

  const handleDeleteBoard = (id: string) => {
    setFunctionBoards(prev => prev.filter(b => b.id !== id));
  };

  const handleUpdateBoardTitle = (id: string, text: string) => {
    setFunctionBoards(prev => prev.map(b => b.id === id ? { ...b, title: text } : b));
  };

  const handleUpdateBoardColor = (id: string, color: 'pink' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'cyan' | 'rose') => {
    setFunctionBoards(prev => prev.map(b => b.id === id ? { ...b, themeColor: color } : b));
  };

  const handleMoveBoard = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === functionBoards.length - 1) return;
    
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const updated = [...functionBoards];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    setFunctionBoards(updated);
  };

  const handleCustomItemAdd = (boardId: string, text: string) => {
    if (!text.trim()) return;
    setFunctionBoards(prev => prev.map(b => {
      if (b.id !== boardId) return b;
      const items = b.customItems || [];
      return {
        ...b,
        customItems: [...items, { id: `citem-${Date.now()}`, text: text.trim(), completed: false }]
      };
    }));
  };

  const handleCustomItemToggle = (boardId: string, itemId: string) => {
    setFunctionBoards(prev => prev.map(b => {
      if (b.id !== boardId) return b;
      const items = b.customItems || [];
      const updated = items.map(item => {
        if (item.id === itemId) {
          const nextState = !item.completed;
          if (nextState) {
            setSpringDewPoints(p => p + 2); // reward +2 points!
          } else {
            setSpringDewPoints(p => Math.max(0, p - 2)); 
          }
          return { ...item, completed: nextState };
        }
        return item;
      });
      return { ...b, customItems: updated };
    }));
  };

  const handleCustomItemDelete = (boardId: string, itemId: string) => {
    setFunctionBoards(prev => prev.map(b => {
      if (b.id !== boardId) return b;
      const items = b.customItems || [];
      return {
        ...b,
        customItems: items.filter(item => item.id !== itemId)
      };
    }));
  };

  // Quote State representing daily inspiration
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState<number>(0);
  const quotesList = [
    "零散碎片时间看10次，不如倒计时五分钟。锁机很有用。",
    "上课前想好要做啥，就不会迷茫。先写出来能做啥，直接干。",
    "早起去图书馆，奠定了一天的好基调。",
    "构建自己的自律果园系统，特别爽。"
  ];

  const getSupabaseClient = () => {
    const config = window.APP_CONFIG;
    if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
      return null;
    }
    if (typeof window.supabase?.createClient !== 'function') {
      return null;
    }
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  };

  const buildSnapshot = (): OrchardSnapshot => ({
    projects,
    goodStates,
    interests,
    mustItems,
    prizeItems,
    functionBoards,
    springDewPoints,
  });

  const applySnapshot = (snapshot: Partial<OrchardSnapshot>) => {
    setProjects(snapshot.projects && snapshot.projects.length > 0 ? snapshot.projects : INITIAL_MAIN_PROJECTS);
    setGoodStates(snapshot.goodStates && snapshot.goodStates.length > 0 ? snapshot.goodStates : INITIAL_GOOD_STATES);
    setInterests(snapshot.interests && snapshot.interests.length > 0 ? snapshot.interests : INITIAL_INTERESTS);
    setMustItems(snapshot.mustItems && snapshot.mustItems.length > 0 ? snapshot.mustItems : INITIAL_TODAY_MUST);
    setPrizeItems(snapshot.prizeItems && snapshot.prizeItems.length > 0 ? snapshot.prizeItems : INITIAL_GRAND_PRIZES);
    setFunctionBoards(snapshot.functionBoards && snapshot.functionBoards.length > 0 ? snapshot.functionBoards : INITIAL_FUNCTION_BOARDS);
    setSpringDewPoints(typeof snapshot.springDewPoints === 'number' ? snapshot.springDewPoints : 35);
  };

  const loadLocalSnapshot = () => {
    const storedProjects = localStorage.getItem("orchard_projects");
    const storedStates = localStorage.getItem("orchard_states");
    const storedInterests = localStorage.getItem("orchard_interests");
    const storedMust = localStorage.getItem("orchard_must_items");
    const storedPrizes = localStorage.getItem("orchard_prizes");
    const storedBoards = localStorage.getItem("orchard_function_boards");
    const storedPoints = localStorage.getItem("orchard_spring_dew_points");

    return {
      projects: storedProjects ? JSON.parse(storedProjects) : INITIAL_MAIN_PROJECTS,
      goodStates: storedStates ? JSON.parse(storedStates) : INITIAL_GOOD_STATES,
      interests: storedInterests ? JSON.parse(storedInterests) : INITIAL_INTERESTS,
      mustItems: storedMust ? JSON.parse(storedMust) : INITIAL_TODAY_MUST,
      prizeItems: storedPrizes ? JSON.parse(storedPrizes) : INITIAL_GRAND_PRIZES,
      functionBoards: storedBoards ? JSON.parse(storedBoards) : INITIAL_FUNCTION_BOARDS,
      springDewPoints: storedPoints ? Number(storedPoints) : 35,
    } satisfies OrchardSnapshot;
  };

  const saveLocalSnapshot = (snapshot: OrchardSnapshot) => {
    localStorage.setItem("orchard_projects", JSON.stringify(snapshot.projects));
    localStorage.setItem("orchard_states", JSON.stringify(snapshot.goodStates));
    localStorage.setItem("orchard_interests", JSON.stringify(snapshot.interests));
    localStorage.setItem("orchard_must_items", JSON.stringify(snapshot.mustItems));
    localStorage.setItem("orchard_prizes", JSON.stringify(snapshot.prizeItems));
    localStorage.setItem("orchard_function_boards", JSON.stringify(snapshot.functionBoards));
    localStorage.setItem("orchard_spring_dew_points", String(snapshot.springDewPoints));
  };

  const loadRemoteSnapshot = async () => {
    const client = getSupabaseClient();
    if (!client) {
      return null;
    }
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      throw new Error(sessionError.message || '读取 Supabase 会话失败');
    }
    const session = sessionData.session;
    setSessionUserId(session?.user.id || null);
    if (!session) {
      setSyncMode('local');
      setSyncStatus('未检测到微习惯系统登录，当前只保存在本地');
      return null;
    }

    const { data, error } = await client
      .from('user_orchard_state')
      .select('content')
      .maybeSingle();
    if (error) {
      const detail = `${error.code || ''} ${error.message || ''}`.toLowerCase();
      if (detail.includes('user_orchard_state') || error.code === 'PGRST205') {
        setSyncMode('supabase');
        setSyncStatus('Supabase 已连接，等待创建果园数据表');
        return null;
      }
      throw new Error(error.message || '读取果园云端数据失败');
    }

    setSyncMode('supabase');
    setSyncStatus('已复用微习惯系统登录，正在同步');
    return (data?.content as Partial<OrchardSnapshot> | undefined) || null;
  };

  const saveRemoteSnapshot = async (snapshot: OrchardSnapshot) => {
    const client = getSupabaseClient();
    if (!client || !sessionUserId) {
      return;
    }
    setPendingRemoteSync(true);
    setSyncStatus('正在后台同步到 Supabase...');
    const { error } = await client.from('user_orchard_state').upsert(
      {
        user_id: sessionUserId,
        content: snapshot,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) {
      setPendingRemoteSync(false);
      const detail = `${error.code || ''} ${error.message || ''}`.toLowerCase();
      if (detail.includes('user_orchard_state') || error.code === 'PGRST205') {
        setSyncStatus('Supabase 已连接，等待创建果园数据表');
        return;
      }
      setSyncStatus(`Supabase 保存失败：${error.message || '未知错误'}`);
      return;
    }
    setPendingRemoteSync(false);
    setSyncStatus('Supabase 已同步');
  };

  // Load from localStorage so the app works as a static subpage.
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      applySnapshot(loadLocalSnapshot());
    } catch (err) {
      console.error("Error loading orchard data from localStorage, using defaults.", err);
      applySnapshot({});
    } finally {
      setIsLoaded(true);
    }

    // Set simple rotation for quotes
    setCurrentQuoteIdx(Math.floor(Math.random() * quotesList.length));
  }, []);

  // Sync to localStorage for static hosting.
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let cancelled = false;

    const syncOnBoot = async () => {
      try {
        const remote = await loadRemoteSnapshot();
        if (cancelled || !remote) {
          return;
        }
        applySnapshot(remote);
        saveLocalSnapshot({
          projects: remote.projects && remote.projects.length > 0 ? remote.projects : INITIAL_MAIN_PROJECTS,
          goodStates: remote.goodStates && remote.goodStates.length > 0 ? remote.goodStates : INITIAL_GOOD_STATES,
          interests: remote.interests && remote.interests.length > 0 ? remote.interests : INITIAL_INTERESTS,
          mustItems: remote.mustItems && remote.mustItems.length > 0 ? remote.mustItems : INITIAL_TODAY_MUST,
          prizeItems: remote.prizeItems && remote.prizeItems.length > 0 ? remote.prizeItems : INITIAL_GRAND_PRIZES,
          functionBoards: remote.functionBoards && remote.functionBoards.length > 0 ? remote.functionBoards : INITIAL_FUNCTION_BOARDS,
          springDewPoints: typeof remote.springDewPoints === 'number' ? remote.springDewPoints : 35,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : '未知错误';
        setSyncMode('local');
        setSyncStatus(`Supabase 不可用，已用本地：${message}`);
      }
    };

    syncOnBoot();

    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

  useEffect(() => {
    const onFocus = () => {
      if (!isLoaded) return;
      void (async () => {
        try {
          const remote = await loadRemoteSnapshot();
          if (!remote) return;
          applySnapshot(remote);
          saveLocalSnapshot({
            projects: remote.projects && remote.projects.length > 0 ? remote.projects : INITIAL_MAIN_PROJECTS,
            goodStates: remote.goodStates && remote.goodStates.length > 0 ? remote.goodStates : INITIAL_GOOD_STATES,
            interests: remote.interests && remote.interests.length > 0 ? remote.interests : INITIAL_INTERESTS,
            mustItems: remote.mustItems && remote.mustItems.length > 0 ? remote.mustItems : INITIAL_TODAY_MUST,
            prizeItems: remote.prizeItems && remote.prizeItems.length > 0 ? remote.prizeItems : INITIAL_GRAND_PRIZES,
            functionBoards: remote.functionBoards && remote.functionBoards.length > 0 ? remote.functionBoards : INITIAL_FUNCTION_BOARDS,
            springDewPoints: typeof remote.springDewPoints === 'number' ? remote.springDewPoints : 35,
          });
        } catch {}
      })();
    };

    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      const snapshot = buildSnapshot();
      saveLocalSnapshot(snapshot);
      if (syncMode !== 'supabase' || !sessionUserId) {
        return;
      }

      setSyncStatus('本地已保存，等待同步...');
      const timer = window.setTimeout(() => {
        void saveRemoteSnapshot(snapshot);
      }, 900);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [
    projects,
    goodStates,
    interests,
    mustItems,
    prizeItems,
    functionBoards,
    springDewPoints,
    isLoaded,
    sessionUserId,
    syncMode,
  ]);

  // Helper point rewards from components
  const addSpringDewPoints = (pts: number) => {
    setSpringDewPoints(prev => prev + pts);
  };

  // Counting totals for metrics badges
  const totalStatesCount = goodStates.reduce((acc, cat) => acc + cat.entries.length, 0);
  const totalInterestsCount = interests.length;
  const totalDoneMusts = mustItems.filter(i => i.isDone).length;

  return (
    <div className="min-h-screen bg-spring-bg font-sans antialiased pb-16 px-4 sm:px-6 relative selection:bg-pink-105 selection:text-[#B04D65]">
      
      {/* Visual background decorations - Blob circles and outline shapes representing Geometric Balance */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-spring-yellow/30 rounded-full blur-3xl -z-10 custom-blob" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-spring-pink/30 rounded-full blur-3xl -z-10 custom-blob-alt" />
      <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-spring-green/20 rounded-full blur-3xl -z-10 custom-blob" />

      {/* Decorative clean outline geometry icons directly matching the aesthetics guideline */}
      <div className="absolute top-24 right-20 w-16 h-16 rounded-full border-4 border-dashed border-[#B04D65]/20 -z-10 animate-spin-slow" />
      <div className="absolute bottom-24 left-12 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[25px] border-b-[#8C7D1E]/20 rotate-[24deg] -z-10" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto pt-8">
        
        {/* Navigation / Brand Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 pb-6 border-b-2 border-white">
          
          {/* Custom vector Orchard Spirit / Sprite */}
          <div className="flex items-center gap-4">
            <motion.div
              className="w-16 h-16 bg-white border-4 border-white rounded-[28px] flex items-center justify-center p-1.5 relative shadow-sm hover-jelly cursor-pointer overflow-hidden"
              whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full h-full bg-spring-pink/30 rounded-full flex flex-col items-center justify-center relative overflow-hidden">
                {/* Seedling body using geometric paths */}
                <span className="w-4 h-4 bg-amber-300 rounded-full absolute bottom-2" />
                <span className="w-1 h-3 bg-emerald-600 absolute bottom-5" />
                <span className="w-3.5 h-1.5 bg-emerald-400 rounded-full absolute bottom-8 -rotate-12 left-3" />
                <span className="w-3 h-1.5 bg-emerald-400 rounded-full absolute bottom-7.5 rotate-12 right-3.5" />
                {/* Cute eyes */}
                <div className="absolute flex gap-1 bottom-4">
                  <span className="w-1 h-1 bg-gray-800 rounded-full" />
                  <span className="w-1 h-1 bg-gray-800 rounded-full" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4F7325] rounded-full border-2 border-white" />
            </motion.div>
          </div>

          {/* Micro interactive quote pill and stats - Overall Larger & Bold */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-[#FFF9FA] to-[#FFF3F5] p-4 sm:p-5 rounded-3xl border-2 border-white shadow-md max-w-lg w-full sm:w-auto">
            <span className="text-xs sm:text-sm font-black text-[#B04D65] uppercase bg-spring-pink/60 px-3 py-1.5 rounded-xl shrink-0">
              今日灵感气泡
            </span>
            <span className="text-sm text-gray-800 font-extrabold italic leading-relaxed flex-1">
              “{quotesList[currentQuoteIdx]}”
            </span>
            <button
              type="button"
              onClick={() => setCurrentQuoteIdx((prev) => (prev + 1) % quotesList.length)}
              className="p-2 sm:p-2.5 bg-white hover:bg-rose-50 rounded-xl text-gray-500 hover:text-gray-700 transition-colors cursor-pointer shadow-3xs shrink-0 border border-rose-100"
            >
              <Undo2 className="w-4.5 h-4.5" />
            </button>
          </div>

          <a
            href={appHomeHref}
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-extrabold text-emerald-800 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            返回微习惯系统
          </a>
        </header>

        <section className="mb-8 rounded-[32px] border-2 border-white/80 bg-white/75 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4F7325]">Orchard Sync</p>
              <p className="text-sm font-extrabold text-gray-800">
                {syncMode === 'supabase' ? 'Supabase 同步已启用' : '当前为本地保存模式'}
              </p>
              <p className="text-xs font-bold text-gray-500">
                {pendingRemoteSync ? '正在后台同步...' : syncStatus}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-gray-600">
              {sessionUserId
                ? '已自动复用微习惯系统登录态'
                : '请先在微习惯系统里登录，同步会自动生效'}
            </div>
          </div>
        </section>

        {/* Dynamic Route/View Switcher Container */}
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            /* ========================================================
               LANDING PAGE: Extremely Clean. Core tasks & boards keys.
               ======================================================== */
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {/* Part 1: Three Main Projects card container */}
              <section className="space-y-4">
                <MainProjectsSection
                  projects={projects}
                  setProjects={setProjects}
                  onAddSpringDew={addSpringDewPoints}
                />
              </section>

              {/* Part 1.5: Collapsible Today's Must Section on Homepage */}
              <div className="bg-gradient-to-br from-[#FFFCE8] via-[#FFFBD5] to-[#FFEAA8] rounded-3xl border-2 border-white/80 shadow-2xs overflow-hidden transition-all duration-300">
                <button
                  type="button"
                  onClick={() => setIsMustExpanded(!isMustExpanded)}
                  className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/20 transition-all font-black text-[#8C7D1E]"
                >
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <Sprout className="w-5 h-5 animate-bounce-slow" />
                    <span>今日备忘</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs transition-transform duration-300 transform" style={{ transform: isMustExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isMustExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-yellow-200/40 bg-white/40 p-5 md:p-6 space-y-4"
                    >
                      {mustItems.length === 0 ? (
                        <p className="text-center font-bold text-gray-500 text-xs py-2">暂无每日任务，快在下方快捷添加吧。</p>
                      ) : (
                        <div className="space-y-2">
                          {mustItems.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                item.isDone
                                  ? 'bg-[#EBF7EE]/60 border-[#CDECD7] text-gray-400 line-through'
                                  : 'bg-white border-yellow-100 text-gray-850 hover:border-yellow-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={item.isDone}
                                  onChange={() => handleToggleMust(item.id)}
                                  className="w-4 h-4 rounded-full accent-emerald-500 cursor-pointer"
                                />
                                <span className={`text-xs font-bold truncate ${item.isDone ? 'opacity-80' : ''}`}>{item.content}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${item.isDone ? 'bg-gray-100 text-gray-450' : 'bg-yellow-105 text-[#8C7D1E]'}`}>
                                  +{item.springDewValue} 💧
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMust(item.id)}
                                  className="text-gray-400 hover:text-red-400 font-extrabold text-xs transition-colors p-1"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Homepage must-item quick input form */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          id="homepage-must-input"
                          placeholder="快捷新增备忘任务..."
                          className="flex-1 bg-white border border-yellow-150 focus:border-[#8C7D1E] outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-gray-700 placeholder-gray-450 shadow-3xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                handleAddMustDirect(input.value.trim());
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('homepage-must-input') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              handleAddMustDirect(input.value.trim());
                              input.value = '';
                            }
                          }}
                          className="bg-[#8C7D1E] hover:bg-[#706416] text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer hover-jelly shadow-2xs"
                        >
                          添加
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Part 2: Dynamic and Customizable Function Boards Grid */}
              <section className="space-y-6">
                <div className="flex items-center justify-end border-t border-[#8C7D1E]/10 pt-6 mt-8">
                  {/* Settings toggle gear, matches the clean look of the project section config modes */}
                  <button
                    type="button"
                    onClick={() => setIsBoardsConfigMode(!isBoardsConfigMode)}
                    className={`p-2.5 rounded-full border transition-all cursor-pointer shadow-3xs flex items-center justify-center shrink-0 ${
                      isBoardsConfigMode 
                        ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                    }`}
                    title={isBoardsConfigMode ? "退出板块配置" : "设计配置能量板块"}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {(() => {
                  const boardColorMap = {
                    pink: {
                      bg: 'bg-spring-pink hover:bg-spring-pink/90 border-pink-300/30 text-[#B04D65]',
                      accentBg: 'bg-[#B04D65]',
                      text: 'text-[#B04D65]'
                    },
                    yellow: {
                      bg: 'bg-spring-yellow hover:bg-spring-yellow/90 border-yellow-300/30 text-[#8C7D1E]',
                      accentBg: 'bg-[#8C7D1E]',
                      text: 'text-[#8C7D1E]'
                    },
                    green: {
                      bg: 'bg-spring-green hover:bg-spring-green/90 border-green-300/30 text-[#4F7325]',
                      accentBg: 'bg-[#4F7325]',
                      text: 'text-[#4F7325]'
                    },
                    blue: {
                      bg: 'bg-[#D6F2FE] hover:bg-[#D6F2FE]/90 border-blue-300/30 text-[#1D6FA5]',
                      accentBg: 'bg-[#1D6FA5]',
                      text: 'text-[#1D6FA5]'
                    },
                    purple: {
                      bg: 'bg-[#F2EDFD] hover:bg-[#F2EDFD]/90 border-purple-300/30 text-[#6D3CA6]',
                      accentBg: 'bg-[#6D3CA6]',
                      text: 'text-[#6D3CA6]'
                    },
                    orange: {
                      bg: 'bg-[#FFF2E0] hover:bg-[#FFF2E0]/90 border-orange-300/30 text-[#B35900]',
                      accentBg: 'bg-[#B35900]',
                      text: 'text-[#B35900]'
                    },
                    cyan: {
                      bg: 'bg-[#E0F8F6] hover:bg-[#E0F8F6]/90 border-cyan-300/30 text-[#0C7369]',
                      accentBg: 'bg-[#0C7369]',
                      text: 'text-[#0C7369]'
                    },
                    rose: {
                      bg: 'bg-[#FFF0F4] hover:bg-[#FFF0F4]/90 border-rose-300/30 text-[#B8234D]',
                      accentBg: 'bg-[#B8234D]',
                      text: 'text-[#B8234D]'
                    }
                  };

                  const renderBoardIcon = (type: string) => {
                    if (type === 'states') return <BookOpen className="w-5 h-5" />;
                    if (type === 'interests') return <Compass className="w-5 h-5" />;
                    if (type === 'must') return <Sprout className="w-5 h-5" />;
                    return <Heart className="w-5 h-5" />;
                  };

                  if (!isBoardsConfigMode) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {functionBoards.map((board) => {
                          const styling = boardColorMap[board.themeColor] || boardColorMap.pink;
                          const path = board.type === 'states' ? 'detail-states' :
                                       board.type === 'interests' ? 'detail-interests' :
                                       board.type === 'must' ? 'detail-must' : 
                                       `detail-custom-${board.id}`;

                          return (
                            <motion.div
                              key={board.id}
                              onClick={() => setView(path)}
                              whileHover={{ scale: 1.03, y: -4 }}
                              className={`${styling.bg} border-4 border-transparent hover:border-white p-7 rounded-[48px] cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-44 hover-jelly relative overflow-hidden`}
                            >
                              <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/20 rounded-full -mr-6 -mb-6 pointer-events-none custom-blob" />
                              
                              <div className="space-y-2 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-white/50 shadow-xs">
                                  <span className={styling.text}>{renderBoardIcon(board.type)}</span>
                                </div>
                                <h3 className="font-extrabold text-gray-800 text-lg leading-snug">{board.title}</h3>
                              </div>

                              <div className="flex items-center justify-end border-t border-white/30 pt-3 relative z-10">
                                <div className={`w-7 h-7 rounded-full bg-white flex items-center justify-center ${styling.text} border border-white shadow-xs text-xs font-bold`}>
                                  →
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {functionBoards.map((board, index) => {
                        const styling = boardColorMap[board.themeColor] || boardColorMap.pink;

                        return (
                          <motion.div
                            key={board.id}
                            layout
                            className={`${styling.bg} border-4 border-dashed border-gray-400/30 p-6 rounded-[40px] shadow-xs flex flex-col justify-between min-h-[220px] transition-all relative overflow-hidden`}
                          >
                            <div className="space-y-4">
                              {/* Board Title Input */}
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black text-gray-500/80 tracking-widest">板块标题</label>
                                <input
                                  type="text"
                                  value={board.title}
                                  onChange={(e) => handleUpdateBoardTitle(board.id, e.target.value)}
                                  className="w-full bg-white/80 border border-gray-200/50 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-bold focus:outline-hidden"
                                />
                              </div>

                              {/* Board Subtitle Input */}
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black text-gray-500/80 tracking-widest">描述/提示语</label>
                                <input
                                  type="text"
                                  value={board.subtitle || ''}
                                  onChange={(e) => {
                                    setFunctionBoards(prev => prev.map(b => b.id === board.id ? { ...b, subtitle: e.target.value } : b));
                                  }}
                                  className="w-full bg-white/80 border border-gray-200/50 rounded-xl px-3 py-1.5 text-[11px] text-gray-750 font-semibold focus:outline-hidden"
                                  placeholder="副标题提示..."
                                />
                              </div>

                              {/* themeColor Picker */}
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black text-gray-500/80 tracking-widest block">配色主题</label>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {(['pink', 'yellow', 'green', 'blue', 'purple', 'orange', 'cyan', 'rose'] as const).map(color => (
                                    <button
                                      key={color}
                                      onClick={() => handleUpdateBoardColor(board.id, color)}
                                      className={`w-4 h-4 rounded-full border transition-all hover:scale-120 cursor-pointer ${
                                        color === 'pink' ? 'bg-[#FFB7CA]' :
                                        color === 'yellow' ? 'bg-[#FFE985]' :
                                        color === 'green' ? 'bg-[#A2DCA3]' :
                                        color === 'blue' ? 'bg-[#89CFF0]' :
                                        color === 'purple' ? 'bg-[#D2A4FF]' :
                                        color === 'orange' ? 'bg-[#FFCC80]' :
                                        color === 'cyan' ? 'bg-[#80DEEA]' :
                                        'bg-[#FF8A80]'
                                      } ${board.themeColor === color ? 'ring-2 ring-emerald-500 border-white' : 'border-black/5'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Move left/right and trash controls */}
                            <div className="flex items-center justify-between border-t border-black/5 pt-3 mt-4">
                              <div className="flex items-center gap-1.5">
                                {index > 0 && (
                                  <button
                                    onClick={() => handleMoveBoard(index, 'left')}
                                    className="p-1 px-2.5 rounded-lg bg-white/70 hover:bg-white text-gray-700 text-[10px] font-bold border border-gray-200 cursor-pointer hover-jelly"
                                  >
                                    ←
                                  </button>
                                )}
                                {index < functionBoards.length - 1 && (
                                  <button
                                    onClick={() => handleMoveBoard(index, 'right')}
                                    className="p-1 px-2.5 rounded-lg bg-white/70 hover:bg-white text-gray-700 text-[10px] font-bold border border-gray-200 cursor-pointer hover-jelly"
                                  >
                                    →
                                  </button>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteBoard(board.id)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-150 text-red-600 border border-red-100 cursor-pointer hover-jelly"
                                title="删除此板块"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Add New Board trigger */}
                      <motion.button
                        onClick={handleAddBoard}
                        whileHover={{ scale: 1.02 }}
                        className="border-4 border-dashed border-[#8C7D1E]/40 bg-emerald-50/20 text-emerald-850 rounded-[40px] p-6 hover:bg-emerald-50/40 transition-all flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover-jelly"
                      >
                        <Plus className="w-8 h-8 opacity-70 mb-2 animate-bounce" />
                        <span className="text-xs font-black">➕ 添加全新功能板块</span>
                        <span className="text-[10px] opacity-60 mt-1">创建日常追踪、备忘或大奖池</span>
                      </motion.button>
                    </div>
                  );
                })()}

              </section>
            </motion.div>
          ) : (
            /* ========================================================
               SUB VIEWS: Replacing layout, provides a grand Back Button
               ======================================================== */
            <motion.div
              key="sub-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Dynamic Custom Board View - Behaved as a fully functional rich memo editor */}
              {view.startsWith('detail-custom-') ? (() => {
                const activeCustomBoardId = view.replace('detail-custom-', '');
                const activeCustomBoard = functionBoards.find(b => b.id === activeCustomBoardId);
                if (!activeCustomBoard) return null;

                const styling = {
                  pink: {
                    bg: 'bg-spring-pink border-pink-300/30 text-[#B04D65]',
                    accentBg: 'bg-[#B04D65]',
                    text: 'text-[#B04D65]'
                  },
                  yellow: {
                    bg: 'bg-spring-yellow border-yellow-300/30 text-[#8C7D1E]',
                    accentBg: 'bg-[#8C7D1E]',
                    text: 'text-[#8C7D1E]'
                  },
                  green: {
                    bg: 'bg-spring-green border-green-300/30 text-[#4F7325]',
                    accentBg: 'bg-[#4F7325]',
                    text: 'text-[#4F7325]'
                  },
                  blue: {
                    bg: 'bg-[#D6F2FE] border-blue-300/30 text-[#1D6FA5]',
                    accentBg: 'bg-[#1D6FA5]',
                    text: 'text-[#1D6FA5]'
                  },
                  purple: {
                    bg: 'bg-[#F2EDFD] border-purple-300/30 text-[#6D3CA6]',
                    accentBg: 'bg-[#6D3CA6]',
                    text: 'text-[#6D3CA6]'
                  },
                  orange: {
                    bg: 'bg-[#FFF2E0] border-orange-300/30 text-[#B35900]',
                    accentBg: 'bg-[#B35900]',
                    text: 'text-[#B35900]'
                  },
                  cyan: {
                    bg: 'bg-[#E0F8F6] border-cyan-300/30 text-[#0C7369]',
                    accentBg: 'bg-[#0C7369]',
                    text: 'text-[#0C7369]'
                  },
                  rose: {
                    bg: 'bg-[#FFF0F4] border-rose-300/30 text-[#B8234D]',
                    accentBg: 'bg-[#B8234D]',
                    text: 'text-[#B8234D]'
                  }
                }[activeCustomBoard.themeColor] || {
                  bg: 'bg-spring-pink border-pink-300/30 text-[#B04D65]',
                  accentBg: 'bg-[#B04D65]',
                  text: 'text-[#B04D65]'
                };

                const itemsList = activeCustomBoard.customItems || [];

                return (
                  <div className="rounded-[48px] border-4 p-8 sm:p-10 shadow-xs relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-white/95 to-white/80 border-gray-200/50">
                    {/* Floating Geometries */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full border-4 border-dashed border-gray-200 pointer-events-none animate-spin-slow" />

                    <div className="flex flex-col gap-6 font-sans">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-5 border-gray-150 gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl ${styling.bg} flex items-center justify-center border text-current shadow-xs`}>
                             <Heart className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-2xl text-gray-800 leading-snug">{activeCustomBoard.title}</h3>
                            <p className="text-xs text-gray-500 font-bold mt-0.5">{activeCustomBoard.subtitle || '自定义日常备忘与打卡空间'}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setView('home')}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black font-extrabold text-xs transition-all cursor-pointer shadow-4xs border border-gray-200/40 hover-jelly shrink-0 self-start sm:self-center"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>返回果园</span>
                        </button>
                      </div>

                      {/* Add Custom Item form - matches core aesthetics */}
                      <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-150">
                        <input
                          id={`custom-item-input-${activeCustomBoard.id}`}
                          type="text"
                          placeholder="在此写下新事项、备忘笔记、守则或打卡目标，敲击 Enter 保存..."
                          className="flex-1 bg-transparent px-3 py-1.8 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-hidden"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                handleCustomItemAdd(activeCustomBoard.id, input.value.trim());
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`custom-item-input-${activeCustomBoard.id}`) as HTMLInputElement;
                            if (input && input.value.trim()) {
                              handleCustomItemAdd(activeCustomBoard.id, input.value.trim());
                              input.value = '';
                            }
                          }}
                          className={`px-4 py-2 ${styling.bg} text-current hover:opacity-90 rounded-xl text-xs font-black cursor-pointer hover-jelly`}
                        >
                          添加条目
                        </button>
                      </div>

                      {/* Items List */}
                      <div className="space-y-3 mt-2 min-h-[200px]">
                        {itemsList.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 border border-dashed rounded-3xl bg-gray-50/50">
                            <Star className="w-10 h-10 mb-2.5 opacity-40 animate-pulse text-amber-400" />
                            <p className="text-xs font-black text-gray-500">这里空空如也，立即在上方开始记录你的第一笔内容吧！</p>
                            <p className="text-[10px] opacity-75 mt-1">（每完成一项将累计奖励 +2 💧 滴春露！）</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {itemsList.map((item) => (
                              <motion.div
                                key={item.id}
                                layout
                                className={`flex items-center justify-between p-4.5 rounded-2xl border transition-all ${
                                  item.completed 
                                    ? 'bg-emerald-50/40 border-emerald-100 text-gray-400 line-through' 
                                    : 'bg-white border-gray-200/50 text-gray-700 shadow-5xs hover:shadow-4xs'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                                  <button
                                    onClick={() => handleCustomItemToggle(activeCustomBoard.id, item.id)}
                                    className="p-1 rounded-md text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer"
                                  >
                                    <div className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                      item.completed 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : 'border-gray-300 hover:border-emerald-400 bg-white'
                                    }`}>
                                      {item.completed && <Check className="w-3.5 h-3.5 font-bold" />}
                                    </div>
                                  </button>
                                  <span className="text-sm font-extrabold break-words">{item.text}</span>
                                </div>

                                <button
                                  onClick={() => handleCustomItemDelete(activeCustomBoard.id, item.id)}
                                  className="text-gray-300 hover:text-red-500 p-1 rounded-sm transition-colors cursor-pointer"
                                  title="选择删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <>
                  {/* Gorgeous integrated Chamber Header Banner replacing the plain white bar */}
                  <div 
                    className={`rounded-[48px] border-4 p-8 sm:p-10 shadow-sm relative overflow-hidden transition-all duration-300 bg-linear-to-br ${
                      view === 'detail-states' ? 'from-rose-100/75 via-pink-100/65 to-rose-200/70 border-white' : ''
                    } ${
                      view === 'detail-interests' ? 'from-emerald-100/70 via-green-100/65 to-emerald-200/60 border-white' : ''
                    } ${
                      view === 'detail-must' ? 'from-yellow-100/75 via-orange-100/65 to-yellow-200/70 border-white' : ''
                    }`}
                  >
                    {/* Floating Themed Geometries */}
                    {view === 'detail-states' && (
                      <>
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full border-4 border-dashed border-[#B04D65]/25 pointer-events-none animate-spin-slow" />
                        <div className="absolute bottom-4 right-16 w-12 h-12 rounded-full border-2 border-[#B04D65]/20 pointer-events-none" />
                      </>
                    )}
                    {view === 'detail-interests' && (
                      <>
                        <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-white/20 rotate-12 pointer-events-none rounded-[36px]" />
                        <div className="absolute top-4 right-12 w-8 h-8 bg-white/30 rotate-45 pointer-events-none" />
                      </>
                    )}
                    {view === 'detail-must' && (
                      <>
                        <div className="absolute -top-4 -right-4 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-white/40 rotate-[15deg] pointer-events-none" />
                        <div className="absolute bottom-6 right-12 w-6 h-6 bg-white/20 rotate-12 pointer-events-none" />
                      </>
                    )}

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 font-sans">
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setView('home')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-transparent hover:border-gray-150 hover:bg-white text-gray-700 hover:text-[#B04D65] font-extrabold text-[11px] transition-all cursor-pointer shadow-xs uppercase hover-jelly"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>返回果园主页 (Home)</span>
                          </button>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/70 px-2.5 py-1 rounded-full border border-white text-gray-500">
                            Chamber View
                          </span>
                        </div>

                        {view === 'detail-states' && (
                          <h2 className="text-2xl sm:text-3xl font-black text-[#B04D65] tracking-tight">
                            🌸 好状态积累库
                          </h2>
                        )}

                        {view === 'detail-interests' && (
                          <h2 className="text-2xl sm:text-3xl font-black text-[#4F7325] tracking-tight">
                            🌿 思维兴趣池
                          </h2>
                        )}

                        {view === 'detail-must' && (
                          <h2 className="text-2xl sm:text-3xl font-black text-[#8C7D1E] tracking-tight">
                            🌟 愿望大奖池
                          </h2>
                        )}
                      </div>

                      {/* Micro chamber status badge */}
                      <div className="shrink-0 bg-white/90 backdrop-blur-xs px-5 py-4 rounded-3xl border border-white shadow-xs text-center md:text-right min-w-[130px]">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400 block mb-1">果园春华状态</span>
                        <div className="flex items-baseline justify-center md:justify-end gap-1">
                          {view === 'detail-states' && (
                            <>
                              <span className="text-xl font-extrabold text-[#B04D65]">{totalStatesCount}</span>
                              <span className="text-[10px] text-gray-500 font-bold">个好状态</span>
                            </>
                          )}
                          {view === 'detail-interests' && (
                            <>
                              <span className="text-xl font-extrabold text-[#4F7325]">{totalInterestsCount}</span>
                              <span className="text-[10px] text-gray-500 font-bold">项奇思萌芽</span>
                            </>
                          )}
                          {view === 'detail-must' && (
                            <>
                              <span className="text-xl font-extrabold text-[#8C7D1E]">{springDewPoints}</span>
                              <span className="text-[10px] text-gray-500 font-bold">滴春露饱满</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* View Components mapping */}
                  {view === 'detail-states' && (
                    <GoodStateLibrary
                      categories={goodStates}
                      setCategories={setGoodStates}
                      onAddSpringDew={addSpringDewPoints}
                    />
                  )}

                  {view === 'detail-interests' && (
                    <InterestPoolSection
                      interests={interests}
                      setInterests={setInterests}
                      onAddSpringDew={addSpringDewPoints}
                    />
                  )}

                  {view === 'detail-must' && (
                    <MustAndPrizeSection
                      mustItems={mustItems}
                      setMustItems={setMustItems}
                      prizeItems={prizeItems}
                      setPrizeItems={setPrizeItems}
                      springDewPoints={springDewPoints}
                      setSpringDewPoints={setSpringDewPoints}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-16 text-center text-[11px] text-gray-400 space-y-1">
          <p>© 一起加油，天天开心 </p>
        </footer>

      </div>
    </div>
  );
}
