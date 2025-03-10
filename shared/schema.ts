import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mood Tracking Schema
export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mood: text("mood").notNull(), // 'great', 'good', 'okay', 'low', 'sad'
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exercises Schema
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'breathing', 'journal', 'cognitive', 'gratitude', 'mindfulness'
  durationMinutes: integer("duration_minutes").notNull(),
  xpReward: integer("xp_reward").notNull(),
  icon: text("icon").notNull(),
  iconBg: text("icon_bg").notNull(),
});

// User Exercise Completions Schema
export const exerciseCompletions = pgTable("exercise_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Achievements Schema
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  iconBg: text("icon_bg").notNull(),
  requirement: text("requirement").notNull(),
  xpReward: integer("xp_reward").notNull(),
});

// User Achievements Schema
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Journal Entries Schema
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Messages Schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  isUser: boolean("is_user").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Assessment Schema
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  answers: json("answers").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  level: true, 
  xp: true, 
  currentStreak: true, 
  lastActive: true,
  createdAt: true 
});

export const insertMoodSchema = createInsertSchema(moods).omit({ 
  id: true, 
  createdAt: true 
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({ 
  id: true 
});

export const insertExerciseCompletionSchema = createInsertSchema(exerciseCompletions).omit({ 
  id: true, 
  completedAt: true 
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({ 
  id: true 
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ 
  id: true, 
  unlockedAt: true 
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ 
  id: true, 
  createdAt: true 
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ 
  id: true, 
  timestamp: true 
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({ 
  id: true, 
  createdAt: true 
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Type Exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Mood = typeof moods.$inferSelect;
export type InsertMood = z.infer<typeof insertMoodSchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type ExerciseCompletion = typeof exerciseCompletions.$inferSelect;
export type InsertExerciseCompletion = z.infer<typeof insertExerciseCompletionSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Login = z.infer<typeof loginSchema>;
