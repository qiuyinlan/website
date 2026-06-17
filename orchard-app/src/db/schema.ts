import { pgTable, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

// 1. Projects table
export const projectsTable = pgTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  targetDate: text('target_date').notNull(),
  progress: integer('progress').notNull().default(0),
  themeColor: text('theme_color').notNull().default('pink'),
  tasks: jsonb('tasks').$type<{ id: string; text: string; completed: boolean }[]>().notNull().default([]),
});

// 2. Good states table
export const goodStatesTable = pgTable('good_states', {
  id: text('id').primaryKey(), // 'focus' | 'energy' | 'environment' | 'mindset'
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  entries: jsonb('entries').$type<{ id: string; content: string; dateStr?: string; themeColor?: string }[]>().notNull().default([]),
});

// 3. Interests table
export const interestsTable = pgTable('interests', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  dateStr: text('date_str'),
  isExplored: boolean('is_explored').notNull().default(false),
});

// 4. Must items table
export const mustItemsTable = pgTable('must_items', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  isDone: boolean('is_done').notNull().default(false),
  springDewValue: integer('spring_dew_value').notNull().default(10),
});

// 5. Prize items table
export const prizeItemsTable = pgTable('prize_items', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  springDewCost: integer('spring_dew_cost').notNull().default(10),
  isUnlocked: boolean('is_unlocked').notNull().default(false),
});

// 6. Function boards table
export const functionBoardsTable = pgTable('function_boards', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  type: text('type').notNull(), // 'states' | 'interests' | 'must' | 'custom'
  themeColor: text('theme_color').notNull().default('pink'),
  customItems: jsonb('custom_items').$type<{ id: string; text: string; completed: boolean }[]>().default([]),
  order: integer('order').notNull().default(0),
});

// 7. Settings / system config table (e.g. spring_dew_points)
export const settingsTable = pgTable('settings', {
  key: text('key').primaryKey(), // e.g. 'spring_dew_points'
  value: text('value').notNull(),
});
