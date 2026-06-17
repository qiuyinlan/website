/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Plus, Trash2, CalendarRange, Check, Edit2, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { InterestItem } from '../types';

interface InterestPoolSectionProps {
  interests: InterestItem[];
  setInterests: React.Dispatch<React.SetStateAction<InterestItem[]>>;
  onAddSpringDew?: (points: number) => void;
}

export default function InterestPoolSection({
  interests,
  setInterests,
  onAddSpringDew
}: InterestPoolSectionProps) {
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDate, setEditingDate] = useState('');

  // Get current date as M.D format
  const getTodayM_D = () => {
    const d = new Date();
    return `${d.getMonth() + 1}.${d.getDate()}`;
  };

  const handleAddInterest = () => {
    if (!newContent.trim()) return;

    const dateVal = newDate.trim() || getTodayM_D();

    const newItem: InterestItem = {
      id: `interest-${Date.now()}`,
      content: newContent.trim(),
      dateStr: dateVal,
      isExplored: false
    };

    setInterests(prev => [newItem, ...prev]);

    if (onAddSpringDew) {
      onAddSpringDew(5); // +5 spring dews when planting an interest seed!
    }

    setNewContent('');
    setNewDate('');
  };

  const handleToggleExplored = (id: string, currentlyExplored: boolean) => {
    setInterests(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextExplored = !item.isExplored;
          if (nextExplored && onAddSpringDew) {
            onAddSpringDew(15); // Large回血 reward! Marking a mind-interest explored yields +15 spring dews!
          }
          return { ...item, isExplored: nextExplored };
        }
        return item;
      })
    );
  };

  const handleStartEdit = (item: InterestItem) => {
    setEditingId(item.id);
    setEditingText(item.content);
    setEditingDate(item.dateStr || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editingText.trim()) return;

    setInterests(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, content: editingText, dateStr: editingDate.trim() || undefined }
          : item
      )
    );

    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setInterests(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="bg-gradient-to-br from-[#F3FAF5] via-[#EBF7EE] to-[#DCEDC8] rounded-[48px] border-4 border-white/70 p-7 sm:p-9 shadow-sm relative overflow-hidden">
      {/* Back decoration element */}
      <div className="absolute right-8 top-8 w-24 h-24 rounded-full bg-spring-green/20 mix-blend-multiply filter blur-xl pointer-events-none" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/30 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full bg-white/90 text-[#368456] text-[10px] font-black shadow-2xs">有趣探索</span>
            <h3 className="font-sans font-extrabold text-gray-800 text-base">思维兴趣池</h3>
          </div>
        </div>

        <div className="text-[10px] text-[#4F7325] font-extrabold bg-[#EBF7EE] px-3 py-1 rounded-full border border-white/80 shrink-0">
          已收获能量: {interests.filter(i => i.isExplored).length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Plant Interest Seed */}
        <div className="bg-white/95 border border-white shadow-xs p-5 rounded-3xl flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-[#368456] text-sm flex items-center gap-1.5">
              <Leaf className="w-4 h-4" /> 播种灵感
            </h4>
          </div>

          <div className="space-y-3 mt-4">
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddInterest();
              }}
              className="w-full text-xs text-gray-700 bg-gray-50/50 p-3 rounded-2xl border-2 border-gray-150 outline-none focus:border-[#368456]"
              placeholder="新增灵感，例如：纸质康奈尔笔记"
            />
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <CalendarRange className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder={`日期（可选，默认 ${getTodayM_D()}）`}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs text-gray-600 bg-gray-50/50 rounded-xl border border-gray-100 focus:border-[#368456] outline-none"
                />
              </div>
              <button
                onClick={handleAddInterest}
                className="bg-[#368456] hover:bg-[#2d6f48] text-white px-4 py-2.5 rounded-2xl text-xs font-black hover-jelly transition-all cursor-pointer shadow-sm"
              >
                播种
              </button>
            </div>
            <p className="text-[10px] text-gray-500 font-bold text-center">
              播种 +5 | 行动回血 +15 春露 💧
            </p>
          </div>
        </div>

        {/* Interests Fruit Board */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {interests.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-xs h-36 ${
                      item.isExplored
                        ? 'bg-[#EBF7EE]/40 border-[#CDECD7] text-gray-500'
                        : 'bg-[#FFFBE5]/40 border-[#FCEEAF] hover:bg-white text-gray-800'
                    }`}
                  >
                    <div className="flex-1 overflow-hidden">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full text-xs text-gray-700 bg-white p-1 rounded border border-gray-200 outline-none"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingDate}
                              onChange={(e) => setEditingDate(e.target.value)}
                              placeholder="日期"
                              className="text-[10px] text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200 outline-none w-14"
                            />
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="bg-[#368456] text-white px-2 py-0.5 text-[9px] rounded font-bold cursor-pointer"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDoubleClick={() => handleStartEdit(item)}
                          className="cursor-pointer select-none"
                          title="双击进行编辑"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {item.dateStr && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-[#B88100] border border-gray-100">
                                {item.dateStr}
                              </span>
                            )}
                            {item.isExplored && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EBF7EE] text-[#368456]">
                                已回血
                              </span>
                            )}
                          </div>
                          <p className={`text-xs leading-normal font-medium break-words clamp-2 ${item.isExplored ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {item.content}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Controls */}
                    <div className="flex items-center justify-between border-t border-gray-100/60 pt-2 shrink-0">
                      <button
                        onClick={() => handleToggleExplored(item.id, item.isExplored)}
                        className={`flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
                          item.isExplored ? 'text-[#368456]' : 'text-gray-400 hover:text-[#B88100]'
                        }`}
                      >
                        {item.isExplored ? (
                          <>
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            已收获回血
                          </>
                        ) : (
                          '开启行动回血'
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        {!isEditing && (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-white cursor-pointer"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded text-red-400 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
