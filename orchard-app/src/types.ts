/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface MainProject {
  id: string; // "1", "2", "3"
  title: string;
  description: string;
  targetDate: string; // e.g. "2026年期末"
  progress: number; // 0 - 100
  tasks: Task[];
  themeColor: 'pink' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'cyan' | 'rose';
}

export interface GoodStateEntry {
  id: string;
  content: string;
  dateStr?: string; // e.g., "4.4", "5.23"
  themeColor?: 'pink' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'cyan' | 'rose';
}

export interface GoodStateCategory {
  id: 'focus' | 'energy' | 'environment' | 'mindset';
  title: string;
  subtitle: string;
  entries: GoodStateEntry[];
}

export interface InterestItem {
  id: string;
  content: string;
  dateStr?: string; // e.g., "4.6"
  isExplored: boolean; // instead of complete, whether actioned or explored
}

export interface TodayMustItem {
  id: string;
  content: string;
  isDone: boolean;
  springDewValue: number; // custom point reward
}

export interface GrandPrizeItem {
  id: string;
  content: string;
  springDewCost: number; // custom points to unlock index
  isUnlocked: boolean;
}

export interface CustomBoardItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface FunctionBoard {
  id: string; // 'states', 'interests', 'must', or dynamic IDs for 'custom'
  title: string;
  subtitle?: string;
  type: 'states' | 'interests' | 'must' | 'custom';
  themeColor: 'pink' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'cyan' | 'rose';
  customItems?: CustomBoardItem[];
}
