/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CheckCircle2, Circle, ArrowLeft, ArrowRight, Palette } from 'lucide-react';
import { MainProject, Task } from '../types';

interface MainProjectsSectionProps {
  projects: MainProject[];
  setProjects: React.Dispatch<React.SetStateAction<MainProject[]>>;
  onAddSpringDew?: (points: number) => void;
}

export default function MainProjectsSection({
  projects,
  setProjects,
  onAddSpringDew
}: MainProjectsSectionProps) {
  // Track collapsed state per project ID. By default, projects are expanded.
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Record<string, boolean>>({});
  const [newTaskTexts, setNewTaskTexts] = useState<{ [key: string]: string }>({});
  const [openColorPickerId, setOpenColorPickerId] = useState<string | null>(null);

  // Helper colors matched to 'Geometric Balance' theme palette
  const colorMap = {
    pink: {
      bg: 'bg-spring-pink',
      border: 'border-white/50',
      text: 'text-[#B04D65]',
      accent: 'bg-[#B04D65]',
      accentSoft: 'bg-[#FFF1F5]',
      glow: 'shadow-pink-200/50',
      darkBg: 'bg-[#FFD1DC]',
      dateInput: 'bg-linear-to-r from-[#FFE3EC] via-[#FFF4F8] to-[#FFD7E5] text-[#9E3658] border-[#F6B7C8] focus:border-[#E06D84]',
      taskCard: 'bg-linear-to-r from-white/92 via-[#FFF4F8] to-[#FFE1EA]',
      taskBorder: 'border-[#F6CDD7]',
      taskInputFocus: 'focus:border-[#E06D84]'
    },
    yellow: {
      bg: 'bg-spring-yellow',
      border: 'border-white/50',
      text: 'text-[#8C7D1E]',
      accent: 'bg-[#8F7C16]',
      accentSoft: 'bg-[#FFF9E0]',
      glow: 'shadow-yellow-100/50',
      darkBg: 'bg-[#FFF9C4]',
      dateInput: 'bg-linear-to-r from-[#FFF2AE] via-[#FFF9D8] to-[#FFEFA0] text-[#7B6C10] border-[#E8D97A] focus:border-[#B59A1F]',
      taskCard: 'bg-linear-to-r from-white/92 via-[#FFFBE8] to-[#FFF1BE]',
      taskBorder: 'border-[#EAD98C]',
      taskInputFocus: 'focus:border-[#B59A1F]'
    },
    green: {
      bg: 'bg-spring-green',
      border: 'border-white/50',
      text: 'text-[#4F7325]',
      accent: 'bg-[#4F7325]',
      accentSoft: 'bg-[#EEF8E8]',
      glow: 'shadow-green-100/50',
      darkBg: 'bg-[#DCEDC8]',
      dateInput: 'bg-linear-to-r from-[#DFF4D3] via-[#F4FCEA] to-[#CDE9BD] text-[#40611B] border-[#B7DA99] focus:border-[#5F8A2D]',
      taskCard: 'bg-linear-to-r from-white/90 via-[#F2FBEA] to-[#DEF1CF]',
      taskBorder: 'border-[#C2E0AD]',
      taskInputFocus: 'focus:border-[#5F8A2D]'
    },
    blue: {
      bg: 'bg-[#D6F2FE]',
      border: 'border-white/50',
      text: 'text-[#1D6FA5]',
      accent: 'bg-[#1D6FA5]',
      accentSoft: 'bg-[#EAF8FE]',
      glow: 'shadow-blue-200/50',
      darkBg: 'bg-[#C1EBFE]',
      dateInput: 'bg-linear-to-r from-[#D5F0FF] via-[#F3FBFF] to-[#C6E8FF] text-[#125E91] border-[#A7D8F4] focus:border-[#2B88C5]',
      taskCard: 'bg-linear-to-r from-white/90 via-[#F1FAFF] to-[#D9F0FF]',
      taskBorder: 'border-[#B9DEF4]',
      taskInputFocus: 'focus:border-[#2B88C5]'
    },
    purple: {
      bg: 'bg-[#F2EDFD]',
      border: 'border-white/50',
      text: 'text-[#6D3CA6]',
      accent: 'bg-[#6D3CA6]',
      accentSoft: 'bg-[#F5F0FF]',
      glow: 'shadow-purple-200/50',
      darkBg: 'bg-[#E6DBFC]',
      dateInput: 'bg-linear-to-r from-[#EEE3FF] via-[#F8F4FF] to-[#E1D1FF] text-[#5C2793] border-[#D0B7F7] focus:border-[#8554C5]',
      taskCard: 'bg-linear-to-r from-white/90 via-[#F8F2FF] to-[#EBDDFF]',
      taskBorder: 'border-[#DCC7FA]',
      taskInputFocus: 'focus:border-[#8554C5]'
    },
    orange: {
      bg: 'bg-[#FFF2E0]',
      border: 'border-white/50',
      text: 'text-[#B35900]',
      accent: 'bg-[#B35900]',
      accentSoft: 'bg-[#FFF5E8]',
      glow: 'shadow-orange-200/50',
      darkBg: 'bg-[#FFE6CC]',
      dateInput: 'bg-linear-to-r from-[#FFE4BE] via-[#FFF6E8] to-[#FFD9A0] text-[#9D4B00] border-[#F1BD74] focus:border-[#CC7515]',
      taskCard: 'bg-linear-to-r from-white/90 via-[#FFF6EA] to-[#FFE6C9]',
      taskBorder: 'border-[#F0C996]',
      taskInputFocus: 'focus:border-[#CC7515]'
    },
    cyan: {
      bg: 'bg-[#E0F8F6]',
      border: 'border-white/50',
      text: 'text-[#0C7369]',
      accent: 'bg-[#0C7369]',
      accentSoft: 'bg-[#ECFCFA]',
      glow: 'shadow-teal-200/50',
      darkBg: 'bg-[#CDF2EE]',
      dateInput: 'bg-linear-to-r from-[#D6F7F3] via-[#F2FFFD] to-[#C0ECE5] text-[#075E56] border-[#9DDFD5] focus:border-[#169487]',
      taskCard: 'bg-linear-to-r from-white/90 via-[#F1FFFC] to-[#D7F6F1]',
      taskBorder: 'border-[#B6E8E0]',
      taskInputFocus: 'focus:border-[#169487]'
    },
    rose: {
      bg: 'bg-[#FFF0F4]',
      border: 'border-white/50',
      text: 'text-[#B8234D]',
      accent: 'bg-[#B8234D]',
      accentSoft: 'bg-[#FFF2F6]',
      glow: 'shadow-rose-200/50',
      darkBg: 'bg-[#FFE0EB]',
      dateInput: 'bg-linear-to-r from-[#FFE0EA] via-[#FFF4F7] to-[#FFD2E0] text-[#A61A43] border-[#F4B0C5] focus:border-[#D33E68]',
      taskCard: 'bg-linear-to-r from-white/92 via-[#FFF4F7] to-[#FFE0EA]',
      taskBorder: 'border-[#F4C5D4]',
      taskInputFocus: 'focus:border-[#D33E68]'
    }
  };

  const handleToggleTask = (projectId: string, taskId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const updatedTasks = p.tasks.map(t => {
          if (t.id === taskId) {
            const willBeCompleted = !t.completed;
            if (willBeCompleted && onAddSpringDew) {
              // Reward 5 points when completing a project step
              onAddSpringDew(5);
            }
            return { ...t, completed: willBeCompleted };
          }
          return t;
        });

        // Recompute progress
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const total = updatedTasks.length;
        const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);

        return { ...p, tasks: updatedTasks, progress };
      })
    );
  };

  const handleUpdateProjectProp = (id: string, prop: keyof MainProject, value: any) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, [prop]: value } : p)));
  };

  const handleAddTask = (projectId: string) => {
    const text = newTaskTexts[projectId]?.trim();
    if (!text) return;

    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const newTempTask: Task = {
          id: `t-${projectId}-${Date.now()}`,
          text,
          completed: false
        };
        const updatedTasks = [...p.tasks, newTempTask];
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const progress = updatedTasks.length === 0 ? 0 : Math.round((completedCount / updatedTasks.length) * 100);

        return { ...p, tasks: updatedTasks, progress };
      })
    );

    setNewTaskTexts(prev => ({ ...prev, [projectId]: '' }));
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const updatedTasks = p.tasks.filter(t => t.id !== taskId);
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const progress = updatedTasks.length === 0 ? 0 : Math.round((completedCount / updatedTasks.length) * 100);

        return { ...p, tasks: updatedTasks, progress };
      })
    );
  };

  const handleCreateProject = () => {
    const colors: ('pink' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'cyan' | 'rose')[] = [
      'pink', 'yellow', 'green', 'blue', 'purple', 'orange', 'cyan', 'rose'
    ];
    const nextColor = colors[projects.length % colors.length];
    const newProject: MainProject = {
      id: `p-${Date.now()}`,
      title: `新主线项目 ${projects.length + 1}`,
      description: '',
      targetDate: '2026年期末',
      progress: 0,
      themeColor: nextColor,
      tasks: []
    };
    setProjects(prev => [...prev, newProject]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleMoveProject = (idx: number, direction: 'left' | 'right') => {
    if (direction === 'left' && idx > 0) {
      const updated = [...projects];
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
      setProjects(updated);
    } else if (direction === 'right' && idx < projects.length - 1) {
      const updated = [...projects];
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      setProjects(updated);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-6 bg-gradient-to-r from-[#FFF0F2] to-[#FFF9FA] px-5 py-3 rounded-2xl border-2 border-white/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E06D84]" />
          <h3 className="font-sans font-black text-gray-800 text-sm">主线任务</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateProject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-black text-[10px] bg-rose-55 border border-[#FCD2D9] text-[#E06D84] transition-all hover-jelly shadow-3xs cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            <Plus className="w-3 h-3" />
            <span>新增主线</span>
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-[32px] bg-white border border-gray-100 shadow-3xs">
          <p className="text-gray-500 font-extrabold mb-2 text-sm">暂无自律主线</p>
          <p className="text-gray-400 text-xs">点击右上角“新增主线”开始添加吧。</p>
        </div>
      ) : (
        <div className="w-full relative">
          <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth snap-x snap-mandatory select-none scrollbar-thin">
            {projects.map((project, idx) => {
              const colors = colorMap[project.themeColor];
              const isExpanded = !collapsedProjectIds[project.id];

              return (
                <motion.div
                  layout
                  key={project.id}
                  className={`w-[88%] sm:w-[420px] md:w-[calc((100%-48px)/3)] shrink-0 snap-start rounded-[48px] border-4 p-7 shadow-sm transition-all flex flex-col justify-start ${colors.bg} relative overflow-hidden ${colors.border} hover:border-white`}
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {(project.themeColor === 'pink' || project.themeColor === 'rose') && (
                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full border-4 border-white/40 pointer-events-none" />
                  )}
                  {(project.themeColor === 'yellow' || project.themeColor === 'orange') && (
                    <div className="absolute bottom-4 right-4 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-white/50 rotate-[15deg] pointer-events-none" />
                  )}
                  {(project.themeColor === 'green' || project.themeColor === 'cyan') && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-white/30 rotate-45 pointer-events-none" />
                  )}
                  {(project.themeColor === 'blue' || project.themeColor === 'purple') && (
                    <div className="absolute -bottom-2 -left-2 w-10 h-10 border-2 border-white/30 rounded-lg -rotate-12 pointer-events-none" />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-white/90 shadow-xs ${colors.text}`}>
                        主线 {idx + 1}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 bg-white/75 p-0.5 rounded-lg border border-gray-100 shadow-3xs">
                          <button
                            type="button"
                            onClick={() => handleMoveProject(idx, 'left')}
                            disabled={idx === 0}
                            className={`p-1 rounded-md transition-all cursor-pointer ${
                              idx === 0 
                                ? 'text-gray-300 cursor-not-allowed opacity-30' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                            }`}
                            title="向左移一位"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProject(idx, 'right')}
                            disabled={idx === projects.length - 1}
                            className={`p-1 rounded-md transition-all cursor-pointer ${
                              idx === projects.length - 1 
                                ? 'text-gray-300 cursor-not-allowed opacity-30' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                            }`}
                            title="向右移一位"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setOpenColorPickerId(openColorPickerId === project.id ? null : project.id)}
                          className={`p-1 rounded-lg border shadow-3xs transition-all cursor-pointer bg-white/95 ${
                            openColorPickerId === project.id 
                              ? 'text-rose-600 border-rose-200 bg-rose-50' 
                              : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-100'
                          }`}
                          title="选择背景配色"
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 bg-white/95 rounded-lg border border-transparent hover:border-rose-100 shadow-3xs transition-all cursor-pointer"
                          title="删除该主线"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        value={project.title}
                        onChange={(e) => handleUpdateProjectProp(project.id, 'title', e.target.value)}
                        className={`w-full text-base font-bold text-gray-800 ${colors.accentSoft} px-3 py-2 rounded-2xl border border-white/80 focus:border-white outline-none shadow-3xs`}
                        placeholder="项目标题"
                      />
                      <div className={`rounded-2xl border px-3 py-2.5 shadow-3xs ${colors.dateInput}`}>
                        <label className="block text-[10px] font-black uppercase tracking-[0.18em] opacity-70 mb-1">
                          截止日期
                        </label>
                        <input
                          type="text"
                          value={project.targetDate}
                          onChange={(e) => handleUpdateProjectProp(project.id, 'targetDate', e.target.value)}
                          className="w-full text-sm font-bold bg-transparent outline-none placeholder:opacity-60"
                          placeholder="例如：2026年期末"
                        />
                      </div>

                      <AnimatePresence>
                        {openColorPickerId === project.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-col gap-1.5 mt-2 bg-white/45 p-2 rounded-[20px] border border-white/50 overflow-hidden"
                          >
                            <div className="grid grid-cols-4 gap-1.5">
                              {(['pink', 'yellow', 'green', 'blue', 'purple', 'orange', 'cyan', 'rose'] as const).map((color) => {
                                const meta = colorMap[color];
                                const labels = {
                                  pink: '甜樱粉',
                                  yellow: '晨露黄',
                                  green: '春草绿',
                                  blue: '晴空蓝',
                                  purple: '薰衣紫',
                                  orange: '蜜橘橙',
                                  cyan: '薄荷青',
                                  rose: '野蔷薇'
                                };
                                const isSelected = project.themeColor === color;
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => handleUpdateProjectProp(project.id, 'themeColor', color)}
                                    className={`flex flex-col items-center justify-center p-1 rounded-xl text-[9px] font-bold transition-all border ${
                                      isSelected 
                                        ? `${meta.darkBg} text-slate-800 border-white shadow-3xs scale-102` 
                                        : 'bg-white/90 text-gray-500 border-transparent hover:bg-white'
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <span className={`w-3 h-3 rounded-full ${meta.bg} border border-black/10`} />
                                    <span className="truncate max-w-full text-[8px] scale-90 mt-0.5">{labels[color]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-end text-xs font-semibold mb-1">
                        <span className={colors.text}>{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/80 overflow-hidden">
                        <motion.div
                          className={`h-full ${colors.accent}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-dashed border-gray-200/60">
                    <div className="flex items-center justify-between font-semibold text-xs text-gray-700 mb-2">
                      <span>路线步骤 ({project.tasks.length})</span>
                      <button
                        type="button"
                        onClick={() => setCollapsedProjectIds(prev => ({
                          ...prev,
                          [project.id]: !prev[project.id]
                        }))}
                        className="text-xs hover:underline cursor-pointer"
                        style={{ color: 'inherit' }}
                      >
                        {isExpanded ? '收起步骤' : '展开/查看'}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {project.tasks.map((task) => (
                            <div
                              key={task.id}
                              className={`flex items-start justify-between gap-2 p-3 rounded-2xl border shadow-3xs transition-shadow ${colors.taskCard} ${colors.taskBorder} hover:shadow-xs`}
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(project.id, task.id)}
                                  className="mt-0.5 text-gray-400 hover:text-pink-500 transition-colors shrink-0 outline-none cursor-pointer"
                                >
                                  {task.completed ? (
                                    <CheckCircle2 className={`w-4.5 h-4.5 ${colors.text}`} />
                                  ) : (
                                    <Circle className="w-4.5 h-4.5 text-gray-400" />
                                  )}
                                </button>
                                <input
                                  type="text"
                                  value={task.text}
                                  onChange={(e) => {
                                    const updatedTasks = project.tasks.map(t =>
                                      t.id === task.id ? { ...t, text: e.target.value } : t
                                    );
                                    handleUpdateProjectProp(project.id, 'tasks', updatedTasks);
                                  }}
                                  className={`w-full text-xs bg-transparent py-0.5 border-b border-white/70 outline-none ${colors.taskInputFocus} ${
                                    task.completed ? 'line-through text-gray-400 font-normal' : 'text-gray-700 font-medium'
                                  }`}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(project.id, task.id)}
                                className="text-red-400 hover:text-red-600 hover-jelly p-1 rounded-md cursor-pointer"
                                title="删除步骤"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          <div className="flex gap-2.5 mt-2">
                            <input
                              type="text"
                              value={newTaskTexts[project.id] || ''}
                              onChange={(e) =>
                                setNewTaskTexts(prev => ({ ...prev, [project.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTask(project.id);
                              }}
                              className={`flex-1 text-xs text-gray-700 ${colors.taskCard} px-3 py-2 rounded-2xl border ${colors.taskBorder} outline-none ${colors.taskInputFocus}`}
                              placeholder="新增路线步骤描述..."
                            />
                            <button
                              type="button"
                              onClick={() => handleAddTask(project.id)}
                              className={`p-2 rounded-xl flex items-center justify-center text-white hover-jelly ${colors.accent} shrink-0 cursor-pointer`}
                              title="新增步骤"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!isExpanded && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.tasks.length === 0 ? (
                          <span className="text-[10px] text-gray-400">暂无步骤记录</span>
                        ) : (
                          project.tasks.slice(0, 3).map((task) => (
                            <div
                              key={task.id}
                              className={`w-2 h-2 rounded-full ${
                                task.completed ? colors.accent : 'bg-white border border-gray-300'
                              }`}
                            />
                          ))
                        )}
                        {project.tasks.length > 3 && (
                          <span className="text-[9px] text-gray-400 leading-none pl-1">
                            +{project.tasks.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
          );
        })}
          </div>
        </div>
      )}
    </div>
  );
}
