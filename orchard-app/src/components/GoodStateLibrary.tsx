/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  Trash2,
  CalendarRange,
  Edit3,
  Check,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Undo2,
  GripVertical,
  Palette
} from 'lucide-react';
import { GoodStateCategory, GoodStateEntry } from '../types';

interface GoodStateLibraryProps {
  categories: GoodStateCategory[];
  setCategories: React.Dispatch<React.SetStateAction<GoodStateCategory[]>>;
  onAddSpringDew?: (points: number) => void;
}

const DEFAULT_COLORS = [
  'rose',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'cyan',
  'pink'
] as const;

const colorGradients: Record<string, string> = {
  pink: 'from-pink-100/90 via-[#FFF0F4]/95 to-rose-200/90 text-[#B04D65] border-pink-300/40 shadow-pink-100/20',
  yellow: 'from-[#FFFCE8]/95 via-[#FFFCDD]/95 to-[#FFEAA8]/90 text-[#8C7D1E] border-yellow-300/40 shadow-yellow-100/20',
  green: 'from-emerald-100/90 via-[#F3FAF0]/95 to-green-200/90 text-[#4F7325] border-green-300/40 shadow-green-100/20',
  blue: 'from-sky-100/90 via-[#EDF6FF]/95 to-blue-200/90 text-[#1D6FA5] border-blue-300/40 shadow-blue-100/20',
  purple: 'from-purple-100/90 via-[#F9F0FF]/95 to-fuchsia-200/90 text-[#6D3CA6] border-purple-300/40 shadow-purple-100/20',
  orange: 'from-orange-100/90 via-[#FFF5ED]/95 to-amber-200/90 text-[#B35900] border-orange-300/40 shadow-orange-100/20',
  cyan: 'from-cyan-100/90 via-[#E6FCFF]/95 to-teal-200/90 text-[#0C7369] border-cyan-300/40 shadow-cyan-100/20',
  rose: 'from-rose-100/90 via-[#FFF1F2]/95 to-pink-200/90 text-[#B8234D] border-rose-300/40 shadow-rose-100/20'
};

export default function GoodStateLibrary({ categories, setCategories, onAddSpringDew }: GoodStateLibraryProps) {
  const [isSettingMode, setIsSettingMode] = useState<boolean>(false);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [showPaletteDropdown, setShowPaletteDropdown] = useState<boolean>(false);

  // Editing entries states
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingDate, setEditingDate] = useState<string>('');

  // New entry states
  const [newContent, setNewContent] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');

  // Auto-migrate multi-categorized states into a single clean list of entries under the first item on load
  useEffect(() => {
    if (categories.length > 1) {
      const mergedEntries = categories.flatMap(cat => cat.entries);
      setCategories([
        {
          id: 'focus',
          title: '回能好状态',
          subtitle: '积累启发自己快充的神奇路径',
          entries: mergedEntries
        }
      ]);
    }
  }, [categories, setCategories]);

  // Extract a single stable list representing all entries
  const activeCategory = categories[0] || { id: 'focus', title: '好状态积累', subtitle: '', entries: [] };
  const entries = activeCategory.entries || [];
  const totalEntries = entries.length;

  // Safeguard index state
  const currentSlideIdx = totalEntries > 0 ? Math.min(slideIndex, totalEntries - 1) : 0;

  // Auto-get current date in format M.D (e.g. 6.11)
  const getTodayM_D = () => {
    const d = new Date();
    return `${d.getMonth() + 1}.${d.getDate()}`;
  };

  const handleStartEdit = (entry: GoodStateEntry) => {
    setEditingEntryId(entry.id);
    setEditingText(entry.content);
    setEditingDate(entry.dateStr || '');
  };

  const handleSaveEdit = (entryId: string) => {
    if (!editingText.trim()) return;

    setCategories(prev => {
      if (prev.length === 0) return prev;
      return [
        {
          ...prev[0],
          entries: prev[0].entries.map(e =>
            e.id === entryId
              ? { ...e, content: editingText, dateStr: editingDate.trim() || undefined }
              : e
          )
        }
      ];
    });

    setEditingEntryId(null);
  };

  const handleDeleteEntry = (entryId: string) => {
    setCategories(prev => {
      if (prev.length === 0) return prev;
      return [
        {
          ...prev[0],
          entries: prev[0].entries.filter(e => e.id !== entryId)
        }
      ];
    });
    
    // Decrement index if we deleted the last item
    if (slideIndex >= Math.max(1, totalEntries - 1)) {
      setSlideIndex(Math.max(0, totalEntries - 2));
    }
  };

  const handleAddEntry = () => {
    if (!newContent.trim()) return;

    const finalDate = newDate.trim() || getTodayM_D();
    const newEntry: GoodStateEntry = {
      id: `gse-${Date.now()}`,
      content: newContent.trim(),
      dateStr: finalDate
    };

    setCategories(prev => {
      const defaultCat = {
        id: 'focus',
        title: '回能好状态',
        subtitle: '积累启发自己快充的神奇路径',
        entries: []
      };
      
      const target = prev[0] || defaultCat;
      return [
        {
          ...target,
          entries: [...target.entries, newEntry]
        }
      ];
    });

    // Automatically focus slides on the new element
    setSlideIndex(entries.length);

    if (onAddSpringDew) {
      onAddSpringDew(5);
    }

    setNewContent('');
    setNewDate('');
  };

  // Drag-and-Drop sorting handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const updated = [...entries];
    const draggedItem = updated[draggedIdx];
    updated.splice(draggedIdx, 1);
    updated.splice(index, 0, draggedItem);

    setCategories(prev => {
      if (prev.length === 0) return prev;
      return [
        {
          ...prev[0],
          entries: updated
        }
      ];
    });

    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  return (
    <div className="rounded-[48px] border-4 p-7 sm:p-9 shadow-sm flex flex-col gap-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-[#FFF4F6] via-[#FFEBF0] to-[#FFDEE5] border-pink-200/50">
      {/* Visual geometry rotating element */}
      <div className="absolute right-6 top-6 w-20 h-20 rounded-full border-4 border-dashed border-white/30 pointer-events-none animate-spin-slow" />

      {/* Elegant minimalist header with NO unneeded words */}
      <div className="flex items-center justify-between border-b border-white/40 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
        </div>

        {/* Pure Icon layout setting button */}
        <button
          onClick={() => setIsSettingMode(prev => !prev)}
          className={`p-2.5 rounded-full border transition-all cursor-pointer shadow-3xs flex items-center justify-center shrink-0 ${
            isSettingMode 
              ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-700'
              : 'bg-rose-100/80 hover:bg-rose-200/80 border-rose-200/30 text-rose-800'
          }`}
          id="toggle-library-settings"
          title={isSettingMode ? "返回展示" : "管理状态卡"}
        >
          {isSettingMode ? (
            <Undo2 className="w-4.5 h-4.5" />
          ) : (
            <Settings className="w-4.5 h-4.5" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isSettingMode ? (
          /* Inspired Slideshow mode: Clean & Minimalist, with super colossal font sizing */
          <motion.div
            key="inspired-slideshow"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-between min-h-[300px] py-4 relative"
          >
            {/* Super massive design text display - ABSOLUTELY NO WHITE BACKGROUNDS */}
            <div className="w-full flex-1 flex flex-col items-center justify-center p-2 sm:p-4 text-center">
              <AnimatePresence mode="wait">
                {totalEntries === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center max-w-lg w-full p-8 border-4 border-dashed border-rose-200/60 bg-rose-100/30 rounded-[36px]"
                  >
                    <Sparkles className="w-10 h-10 text-rose-400 mb-4 animate-bounce" />
                    <h4 className="text-base font-extrabold text-rose-900 mb-1">
                      暂无好状态方案
                    </h4>
                    <p className="text-xs text-rose-800/70 mb-4">
                      这里还没有积累恢复专注或精力的神奇路径。点击右上角的齿轮设置图标来开始第一笔记录吧。
                    </p>
                    <button
                      onClick={() => setIsSettingMode(true)}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs hover-jelly cursor-pointer"
                    >
                      去新增
                    </button>
                  </motion.div>
                ) : (
                  (() => {
                    const currentEntry = entries[currentSlideIdx];

                    return (
                      <motion.div
                        key={currentEntry?.id}
                        initial={{ opacity: 0, scale: 0.96, rotate: -0.5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.96, rotate: 0.5 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative flex flex-col items-center justify-between p-8 sm:p-12 md:p-14 bg-white rounded-[44px] border border-rose-100/60 shadow-sm w-full max-w-4xl min-h-[240px]"
                      >
                        {/* Quotation mark graphics */}
                        <span className="absolute left-6 top-4 text-5xl sm:text-6xl text-rose-300 opacity-50 select-none font-serif font-black">“</span>
                        
                        <div className="my-auto">
                          <p className="text-2.5xl sm:text-3xl md:text-[36px] text-[#75263a] text-center font-extrabold leading-relaxed tracking-tight max-w-3xl whitespace-pre-line text-balance px-2 italic">
                            {currentEntry?.content}
                          </p>
                        </div>

                        {/* Meta info bottom pill - Clean white presentation style */}
                        {currentEntry?.dateStr && (
                          <div className="mt-8 flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-extrabold px-3 py-1 rounded-full font-mono tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-rose-400 opacity-70" />
                            发现于 {currentEntry?.dateStr}
                          </div>
                        )}

                        <span className="absolute right-6 bottom-4 text-5xl sm:text-6xl text-rose-300 opacity-50 select-none font-serif font-black">”</span>
                      </motion.div>
                    );
                  })()
                )}
              </AnimatePresence>
            </div>

            {/* Pagination & Next/Prev switcher controls - NO WHITE BACKGROUND */}
            {totalEntries > 0 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowPaletteDropdown(false);
                    setSlideIndex(prev => (prev - 1 + totalEntries) % totalEntries);
                  }}
                  className="p-3 rounded-full bg-rose-100/80 hover:bg-rose-200 border border-rose-200/30 text-rose-900 shadow-3xs cursor-pointer hover-jelly"
                  title="上一个"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Status indicator dots */}
                <div className="flex flex-col items-center justify-center min-w-[80px] shrink-0 select-none">
                  <span className="text-xs font-extrabold text-rose-900 font-mono">
                    {currentSlideIdx + 1} / {totalEntries}
                  </span>
                  <div className="flex gap-1 mt-1.5 justify-center">
                    {entries.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === currentSlideIdx ? 'w-4.5 bg-rose-600' : 'w-1.5 bg-rose-300/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowPaletteDropdown(false);
                    setSlideIndex(prev => (prev + 1) % totalEntries);
                  }}
                  className="p-3 rounded-full bg-rose-100/80 hover:bg-rose-200 border border-rose-200/30 text-rose-900 shadow-3xs cursor-pointer hover-jelly"
                  title="下一个"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Randomize button as a secondary discovery path */}
                <button
                  onClick={() => {
                    setShowPaletteDropdown(false);
                    if (totalEntries > 1) {
                      let nextIdx = currentSlideIdx;
                      while (nextIdx === currentSlideIdx) {
                        nextIdx = Math.floor(Math.random() * totalEntries);
                      }
                      setSlideIndex(nextIdx);
                    }
                  }}
                  className="p-3 rounded-full bg-rose-100/40 hover:bg-rose-200/60 text-rose-800 border border-transparent hover:border-rose-200/30 shadow-4xs cursor-pointer hover-jelly"
                  title="随机切换"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* Editor Control management panel - edit, add/delete, reorder (COMPLETELY MINIMALIST, NO WHITE BACKDROPS) */
          <motion.div
            key="management-panel"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2"
          >
            {/* Quick adding input card side - Warm pink/rose glass layout */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-rose-100/60 to-pink-100/50 p-5 sm:p-6 rounded-3xl border border-rose-200/30 shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-rose-200/40 border border-rose-300/20 text-rose-900">
                  能量方案记录
                </span>
              </div>

              {/* Form container - Styled non-white */}
              <div className="bg-rose-50/40 rounded-2xl p-4 border border-rose-200/30 mt-5 shadow-3xs space-y-3">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="写下灵感秘言，例如：离开课桌快步走 3 分钟，配合闭眼大口深吸气。"
                  className="w-full text-xs text-rose-950 bg-rose-50/50 p-3 rounded-xl border border-rose-200/50 focus:border-rose-450 focus:bg-rose-50/95 outline-none resize-none h-20 transition-all text-balance placeholder-rose-900/30"
                />

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <CalendarRange className="absolute left-3 top-2.5 w-3 h-3 text-rose-450" />
                    <input
                      type="text"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      placeholder={`日期（例 ${getTodayM_D()}）`}
                      className="w-full pl-8 pr-2.5 py-2 text-xs text-rose-950 bg-rose-50/50 focus:bg-rose-50/95 rounded-xl border border-rose-200/50 focus:border-rose-450 outline-none transition-all placeholder-rose-900/30"
                    />
                  </div>

                  <button
                    onClick={handleAddEntry}
                    className="bg-rose-600 hover:bg-rose-700 text-white p-2.5 rounded-xl flex items-center justify-center hover-jelly transition-colors cursor-pointer shrink-0 shadow-3xs"
                    title="添加"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* List and Drag-to-order settings side */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <h5 className="text-xs font-black text-rose-900/80 tracking-wider flex items-center justify-between px-1">
                <span>拖拽条目上下调整展现顺序 (共 {totalEntries} 条)</span>
              </h5>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {totalEntries === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16 text-rose-805 text-xs font-bold bg-rose-100/20 rounded-2xl border border-dashed border-rose-200/50"
                    >
                      尚未留存任何方案，快在左侧写一条吧。
                    </motion.div>
                  ) : (
                    entries.map((entry, idx) => {
                      const isEditing = editingEntryId === entry.id;
                      const isDragged = draggedIdx === idx;

                      return (
                        <motion.div
                          layout
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                          draggable={!isEditing}
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`group relative p-3.5 rounded-2xl border transition-all flex items-start gap-2.5 shadow-3xs select-none ${
                            isEditing 
                              ? 'bg-gradient-to-r from-pink-100 to-rose-200/80 border-rose-300' 
                              : isDragged
                                ? 'border-dashed border-rose-400 opacity-45 scale-95 shadow-md bg-rose-200/20'
                                : 'bg-gradient-to-r from-pink-50/80 to-rose-100/60 hover:from-pink-100/90 hover:to-rose-150/70 border-rose-200/40 hover:border-rose-300/70 cursor-grab active:cursor-grabbing text-rose-950'
                          }`}
                        >
                          {/* Rich Dnd Drag Handle Indicator - NO WHITE */}
                          {!isEditing && (
                            <div className="flex items-center self-stretch text-rose-450/60 group-hover:text-rose-600/80 cursor-grab transition-colors px-0.5">
                              <GripVertical className="w-4 h-4 shrink-0" />
                            </div>
                          )}

                          {/* Entry item body */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full text-xs text-rose-950 bg-rose-50/90 p-2 rounded-lg border border-rose-200 outline-none focus:bg-white text-balance focus:border-rose-450"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingDate}
                                    onChange={(e) => setEditingDate(e.target.value)}
                                    placeholder="格式: M.D (如 4.2)"
                                    className="text-[11px] text-rose-950 bg-rose-50/90 px-2.5 py-1.5 rounded-lg border border-rose-200 outline-none w-28 text-center focus:bg-white"
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(entry.id)}
                                    className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-rose-700 cursor-pointer shadow-3xs transition-all"
                                  >
                                    <Check className="w-3.5 h-3.5" /> 确认更改
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2 pt-0.5">
                                {entry.dateStr && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-200/60 border border-rose-300/30 text-rose-900 shrink-0 font-mono">
                                    {entry.dateStr}
                                  </span>
                                )}
                                <p className="text-xs text-rose-950 font-bold leading-relaxed break-words whitespace-pre-line text-balance pr-2 pointer-events-none">
                                  {entry.content}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action icons - Translucent hovers with NO pure whites */}
                          {!isEditing && (
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center md:self-stretch md:items-start md:pt-1">
                              <button
                                onClick={() => handleStartEdit(entry)}
                                className="p-1 rounded-lg text-rose-800 hover:text-rose-950 hover:bg-rose-200/50 hover-jelly cursor-pointer"
                                title="编辑文本"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="p-1 rounded-lg text-red-650 hover:text-red-800 hover:bg-red-200/30 hover-jelly cursor-pointer"
                                title="删除此方案"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
