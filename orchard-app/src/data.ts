/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MainProject, GoodStateCategory, InterestItem, TodayMustItem, GrandPrizeItem, FunctionBoard } from './types';

export const INITIAL_MAIN_PROJECTS: MainProject[] = [
  {
    id: '1',
    title: '算法项目',
    description: '攻克核心算法模型，搭建可视化算法演示版图，攻克 LeetCode 经典 150 题。',
    targetDate: '2026年期末',
    progress: 45,
    themeColor: 'pink',
    tasks: [
      { id: 't1-1', text: '整理基础数据结构（栈/队列/哈希表）常用模板', completed: true },
      { id: 't1-2', text: '攻克动态规划经典区间 DP 与背包问题', completed: false },
      { id: 't1-3', text: '设计主界面图论演练模块，支持 BFS/DFS 搜索路径动画', completed: false },
      { id: 't1-4', text: '完成 3 组中等难度模拟周赛复盘', completed: false }
    ]
  },
  {
    id: '2',
    title: '期末考备战',
    description: '构建个人知识自律成长系统，全面梳理专业课程，完成多维模拟测验。',
    targetDate: '2026年6月下半月',
    progress: 60,
    themeColor: 'yellow',
    tasks: [
      { id: 't2-1', text: '整理编译原理一至五章康奈尔笔记索引', completed: true },
      { id: 't2-2', text: '完成计算机网络核心协议层脑图整理', completed: true },
      { id: 't2-3', text: '刷完近三年各门专业课期末真题及详解', completed: false },
      { id: 't2-4', text: '开展 15 分钟冲刺冲关倒计时复习（刷重点课本习题）', completed: false }
    ]
  },
  {
    id: '3',
    title: '比赛项目',
    description: '打磨作品细节与交互美学，追求极致用户体验与高效架构设计，夺取终极荣誉。',
    targetDate: '2026年7月中旬',
    progress: 30,
    themeColor: 'green',
    tasks: [
      { id: 't3-1', text: '召开团队会议并确定最终项目架构细节设计', completed: true },
      { id: 't3-2', text: '梳理业务核心状态变化流程，完成模块边界隔离', completed: false },
      { id: 't3-3', text: '打磨前台交互：引入卡片悬浮果动的活力视觉体验', completed: false },
      { id: 't3-4', text: '配合后台 API 进行全流程模拟并优化响应首包时间', completed: false }
    ]
  }
];

export const INITIAL_GOOD_STATES: GoodStateCategory[] = [
  {
    id: 'focus',
    title: '专注与工具',
    subtitle: '定时目标 冲刺破局',
    entries: [
      { id: 'f-1', content: '倒计时就是专注最大的要素!!!!' },
      { id: 'f-2', content: '零散碎片时间看10次，不如倒计时五分钟。锁机很有用。' },
      { id: 'f-3', content: '手表开倒计时学习。', dateStr: '4.2' },
      { id: 'f-4', content: '学英语，任何事情都可以用uptimer记录。', dateStr: '4.4' },
      { id: 'f-5', content: '解决方法：定时目标法。定个15分钟目标（如两页题），打开计时器冲刺。', dateStr: '5.23' },
      { id: 'f-6', content: '飞书设置成一级标题，光看标题就是康奈尔的索引标志，讲解一键复制粘贴更高效。' }
    ]
  },
  {
    id: 'energy',
    title: '精力管理',
    subtitle: '张弛有度 高效回血',
    entries: [
      { id: 'e-1', content: '中午要睡觉，不然下午太困了，会影响晚上效率。', dateStr: '3.30' },
      { id: 'e-2', content: '中午最好吃点饭，借助晕碳顺带睡觉，否则下午再吃会晕碳，且饿得睡不着。', dateStr: '4.2' },
      { id: 'e-3', content: '看无聊做事文档，精力会在做事的时候回复。' },
      { id: 'e-4', content: '真心感觉，构建自己的系统，特别爽。' }
    ]
  },
  {
    id: 'environment',
    title: '环境与行动',
    subtitle: '破茧出门 即刻启动',
    entries: [
      { id: 'env-1', content: '外教课精力不集中（耳机带久了难受），应去外面公共地方。', dateStr: '3.24' },
      { id: 'env-2', content: '早起去图书馆，奠定了一天的好基调。', dateStr: '5.14' },
      { id: 'env-3', content: '出门真的很不一样。在地铁里（两块钱）很舒服，行动力拉满。', dateStr: '5.16' },
      { id: 'env-4', content: '上课前想好要做啥，就不会迷茫。先写出来能做啥，直接干。', dateStr: '4.10' },
      { id: 'env-5', content: '写了登记flomo，就启动了，状态变好。' }
    ]
  },
  {
    id: 'mindset',
    title: '心态与哲学',
    subtitle: '游戏人生 绝地杀出',
    entries: [
      { id: 'm-1', content: '看dankoe的游戏化人生，想开了。', dateStr: '5.17' },
      { id: 'm-2', content: '关于“杀出一条血路”：社会不是慈善机构，如果不比大众更努力、拥有大众没有的技能，必然处在不利环境。要么懒到底，要么杀出一条血路成为人上人。高不成低不就的样子最难看。' }
    ]
  }
];

export const INITIAL_INTERESTS: InterestItem[] = [
  { id: 'i-1', content: '纸质康奈尔笔记法探究：网格纸与三栏格式应用', dateStr: '4.6', isExplored: false },
  { id: 'i-2', content: 'UI设计研究：治愈系圆角网格系统与流体过渡动画', dateStr: '5.1', isExplored: true },
  { id: 'i-3', content: '植物标本手帐与春日果园微型规划图', dateStr: '5.20', isExplored: false },
  { id: 'i-4', content: '游戏化任务自洽架构：如何把自律过程设计成打怪升级', dateStr: '6.1', isExplored: false }
];

export const INITIAL_TODAY_MUST: TodayMustItem[] = [
  { id: 'm-1', content: '开启 15 分钟极速倒计时，刷掉两道经典题', isDone: false, springDewValue: 10 },
  { id: 'm-2', content: '在安静氛围（图书馆/地铁）看做事文档 10 分钟', isDone: true, springDewValue: 10 },
  { id: 'm-3', content: '手写登记今日状态卡（flomo 仪式点火）', isDone: false, springDewValue: 5 },
  { id: 'm-4', content: '整理编译原理索引卡片', isDone: false, springDewValue: 15 }
];

export const INITIAL_GRAND_PRIZES: GrandPrizeItem[] = [
  { id: 'p-1', content: '春日浆果甜点派对（犒劳舌尖，甜橙能量回血）', springDewCost: 30, isUnlocked: false },
  { id: 'p-2', content: '添置一本精美的果园主题纸质康奈尔本子', springDewCost: 50, isUnlocked: false },
  { id: 'p-3', content: '放假一整天，在阳光公共露台尽情阅读无功利闲书', springDewCost: 80, isUnlocked: false },
  { id: 'p-4', content: '解锁一套自己制作的「春天果园」手账皮肤大奖', springDewCost: 120, isUnlocked: false }
];

export const INITIAL_FUNCTION_BOARDS: FunctionBoard[] = [
  {
    id: 'states',
    title: '好状态积累库',
    subtitle: '心流经验与能量秘诀',
    type: 'states',
    themeColor: 'pink'
  },
  {
    id: 'interests',
    title: '思维兴趣池',
    subtitle: '奇思妙想与心头好探索',
    type: 'interests',
    themeColor: 'green'
  },
  {
    id: 'must',
    title: '愿望大奖池',
    subtitle: '用攒下的春露兑换激励奖励',
    type: 'must',
    themeColor: 'yellow'
  }
];

