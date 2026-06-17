/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckSquare, Plus, Trash2, Sprout, Star, Sparkles, Check, Gift } from 'lucide-react';
import { TodayMustItem, GrandPrizeItem } from '../types';

interface MustAndPrizeSectionProps {
  mustItems: TodayMustItem[];
  setMustItems: React.Dispatch<React.SetStateAction<TodayMustItem[]>>;
  prizeItems: GrandPrizeItem[];
  setPrizeItems: React.Dispatch<React.SetStateAction<GrandPrizeItem[]>>;
  springDewPoints: number;
  setSpringDewPoints: React.Dispatch<React.SetStateAction<number>>;
}

export default function MustAndPrizeSection({
  mustItems,
  setMustItems,
  prizeItems,
  setPrizeItems,
  springDewPoints,
  setSpringDewPoints
}: MustAndPrizeSectionProps) {
  // Input states
  const [newMustText, setNewMustText] = useState('');
  const [newPrizeText, setNewPrizeText] = useState('');
  const [newPrizeCost, setNewPrizeCost] = useState('30');

  // Triggering visual feedback on unlock
  const [unlockedCelebration, setUnlockedCelebration] = useState<string | null>(null);

  const handleAddMust = () => {
    if (!newMustText.trim()) return;
    const newItem: TodayMustItem = {
      id: `must-${Date.now()}`,
      content: newMustText.trim(),
      isDone: false,
      springDewValue: 10 // defaults to 10 drops of Spring Dew
    };
    setMustItems(prev => [...prev, newItem]);
    setNewMustText('');
  };

  const handleToggleMust = (id: string, isCurrentlyDone: boolean) => {
    setMustItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextState = !item.isDone;
          // Reward or deduct points
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

  const handleAddPrize = () => {
    if (!newPrizeText.trim()) return;
    const costNum = parseInt(newPrizeCost) || 30;
    const newItem: GrandPrizeItem = {
      id: `prize-${Date.now()}`,
      content: newPrizeText.trim(),
      springDewCost: costNum,
      isUnlocked: false
    };
    setPrizeItems(prev => [...prev, newItem]);
    setNewPrizeText('');
    setNewPrizeCost('30');
  };

  const handleUnlockPrize = (id: string, cost: number) => {
    if (springDewPoints < cost) return;

    setSpringDewPoints(pts => pts - cost);
    setPrizeItems(prev =>
      prev.map(item => (item.id === id ? { ...item, isUnlocked: true } : item))
    );

    const match = prizeItems.find(p => p.id === id);
    if (match) {
      setUnlockedCelebration(match.content);
      setTimeout(() => {
        setUnlockedCelebration(null);
      }, 4000);
    }
  };

  const handleDeletePrize = (id: string) => {
    setPrizeItems(prev => prev.filter(item => item.id !== id));
  };

  // Reset done states to start a new day
  const handleResetDay = () => {
    setMustItems(prev => prev.map(item => ({ ...item, isDone: false })));
  };

  const completedCount = mustItems.filter(i => i.isDone).length;
  const percentage = mustItems.length === 0 ? 0 : Math.round((completedCount / mustItems.length) * 100);

  return (
    <div className="space-y-6">
      {/* Unlocked Announcement Notification Banner */}
      <AnimatePresence>
        {unlockedCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-100 via-pink-100 to-emerald-100 border-2 border-amber-300 p-5 rounded-2xl shadow-xl flex items-center gap-4 max-w-sm sm:max-w-md"
          >
            <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center shrink-0 shadow-md">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h5 className="font-sans font-bold text-gray-800 text-sm">果园成熟，收获甜蜜！</h5>
              <p className="text-gray-600 text-xs mt-1 leading-normal">
                你成功用汗水浇灌的春露点数兑换了：<br />
                <strong className="text-[#368456]">{unlockedCelebration}</strong>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spring Dew Points Showcase dashboard */}
      <div className="bg-gradient-to-br from-[#FFF9FA] via-[#FFE5E8] to-[#FFF0F2] rounded-[48px] p-7 border-4 border-white/70 shadow-sm relative overflow-hidden">
        {/* Decorative circle overlays */}
        <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full border-4 border-dashed border-white/30 pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-spring-yellow/30 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-white/50 flex items-center justify-center shadow-xs text-[#B04D65]">
              <Sprout className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-sans font-black text-gray-800 text-lg">春日果园能量池</h4>
              </div>
            </div>
          </div>

          <div className="text-center sm:text-right bg-white/90 px-6 py-3 rounded-2xl border border-white/50 shrink-0 min-w-[125px] shadow-xs">
            <span className="text-[10px] text-gray-400 font-extrabold block uppercase">当前春露</span>
            <div className="flex items-baseline justify-center sm:justify-end gap-1 mt-0.5">
              <span className="font-black text-[#B04D65] text-3xl">{springDewPoints}</span>
              <span className="text-xs text-gray-500 font-bold">滴 💧</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#FFF9FA] to-[#FFF0F2] rounded-[48px] border-4 border-white/70 p-7 sm:p-9 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md">
        {/* Playful background peach outline circle */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full border-2 border-[#B04D65]/10 pointer-events-none" />
        <div className="absolute bottom-6 right-16 w-8 h-8 rounded-full border border-dashed border-[#B04D65]/15 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between border-b-2 border-[#B04D65]/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/80 border border-[#B04D65]/20 flex items-center justify-center text-[#B04D65] shadow-2xs">
                <Gift className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-extrabold text-gray-800 text-sm tracking-tight font-sans">终极奖池愿望单 (Grand Prize)</h4>
            </div>
            <span className="text-[10px] text-pink-700 font-extrabold bg-[#FFD1DC]/40 px-2.5 py-1 rounded-full border border-white/50 font-sans">
              已解锁: {prizeItems.filter(p => p.isUnlocked).length}
            </span>
          </div>

          {/* Prize list scrollbar */}
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            <AnimatePresence initial={false} mode="popLayout">
              {prizeItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs font-semibold bg-white/40 rounded-3xl border border-dashed border-[#B04D65]/20">
                  当前暂无愿望大奖。添加一些犒劳自己的礼物点子吧！
                </div>
              ) : (
                prizeItems.map((prize) => {
                  const canAfford = springDewPoints >= prize.springDewCost;

                  return (
                    <motion.div
                      key={prize.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.015 }}
                      className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                        prize.isUnlocked
                          ? 'bg-[#EBF7EE]/40 border-transparent text-gray-500 shadow-2xs'
                          : 'bg-white border-[#B04D65]/10 text-gray-850 hover:border-spring-pink/60 shadow-2xs'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-1">
                        <p className={`text-xs font-bold leading-relaxed truncate ${prize.isUnlocked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {prize.content}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 font-sans">
                          <span className="text-[9px] font-black text-[#B04D65] uppercase bg-[#FFF0F2] px-2 py-0.5 rounded-full border border-[#FFD1DC]">
                            需要: {prize.springDewCost} 滴春露 💧
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {prize.isUnlocked ? (
                          <span className="text-[10px] font-extrabold text-[#4F7325] bg-[#DCEDC8] border-2 border-white px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1 font-sans">
                            <Star className="w-3 h-3 fill-current animate-pulse" />
                            <span>已兑换成功</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUnlockPrize(prize.id, prize.springDewCost)}
                            disabled={!canAfford}
                            className={`text-[10px] font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                              canAfford
                                ? 'bg-[#B04D65] text-white hover-jelly shadow-xs hover:scale-105 active:scale-95'
                                : 'bg-gray-100 text-gray-400 border-gray-205 cursor-not-allowed'
                            }`}
                          >
                            兑换大礼
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePrize(prize.id)}
                          className="text-gray-300 hover:text-red-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick item insertion */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-5 pt-4 border-t border-gray-150 relative z-10">
          <input
            type="text"
            value={newPrizeText}
            onChange={(e) => setNewPrizeText(e.target.value)}
            className="flex-1 text-xs font-bold text-slate-800 bg-white px-4 py-3 rounded-2xl border-2 border-gray-150 outline-none focus:border-spring-pink"
            placeholder="新增犒劳大奖（例如：草莓下午茶）"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={newPrizeCost}
              onChange={(e) => setNewPrizeCost(e.target.value)}
              className="w-18 text-xs font-bold text-center text-slate-800 bg-white py-3 rounded-2xl border-2 border-gray-150 outline-none focus:border-spring-pink"
              placeholder="点数"
              min="5"
            />
            <button
              type="button"
              onClick={handleAddPrize}
              className="bg-[#B04D65] hover:bg-[#8F3E52] text-white px-4 py-3 rounded-2xl flex items-center justify-center hover-jelly transition-all cursor-pointer shrink-0 text-xs font-black shadow-sm font-sans"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
