import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import {
  users, User, InsertUser,
  moods, Mood, InsertMood,
  exercises, Exercise, InsertExercise,
  journals, Journal, InsertJournal,
  achievements, Achievement, InsertAchievement,
  assessments, Assessment, InsertAssessment,
  chatMessages, ChatMessage, InsertChatMessage,
  goals, Goal, InsertGoal,
  affirmations, Affirmation, InsertAffirmation
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Mood operations
  getMoodsByUserId(userId: number): Promise<Mood[]>;
  createMood(mood: InsertMood): Promise<Mood>;

  // Exercise operations
  getExercisesByUserId(userId: number): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;

  // Journal operations
  getJournalsByUserId(userId: number): Promise<Journal[]>;
  getJournalById(id: number): Promise<Journal | undefined>;
  createJournal(journal: InsertJournal): Promise<Journal>;

  // Achievement operations
  getAchievementsByUserId(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // Assessment operations
  getAssessmentByUserId(userId: number): Promise<Assessment | undefined>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;

  // Chat operations
  getChatMessagesByUserId(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Goal operations
  getGoalsByUserId(userId: number): Promise<Goal[]>;
  getGoalById(id: number): Promise<Goal | null>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | null>;
  deleteGoal(id: number): Promise<boolean>;

  // Affirmation operations
  getAffirmationsByUserId(userId: number): Promise<Affirmation[]>;
  getAffirmationById(id: number): Promise<Affirmation | null>;
  createAffirmation(affirmation: InsertAffirmation): Promise<Affirmation>;
  updateAffirmation(id: number, updates: Partial<Affirmation>): Promise<Affirmation | null>;
  deleteAffirmation(id: number): Promise<boolean>;
}

export class FileStorage implements IStorage {
  private dataDir: string;
  private users: Map<number, User>;
  private moods: Map<number, Mood>;
  private exercises: Map<number, Exercise>;
  private journals: Map<number, Journal>;
  private achievements: Map<number, Achievement>;
  private assessments: Map<number, Assessment>;
  private chatMessages: Map<number, ChatMessage>;
  private goals: Map<number, Goal>;
  private affirmations: Map<number, Affirmation>;

  private currentUserId: number;
  private currentMoodId: number;
  private currentExerciseId: number;
  private currentJournalId: number;
  private currentAchievementId: number;
  private currentAssessmentId: number;
  private currentChatMessageId: number;
  private currentGoalId: number;
  private currentAffirmationId: number;

  private readFile = promisify(fs.readFile);
  private writeFile = promisify(fs.writeFile);


  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Initialize maps and load data
    this.users = new Map();
    this.moods = new Map();
    this.exercises = new Map();
    this.journals = new Map();
    this.achievements = new Map();
    this.assessments = new Map();
    this.chatMessages = new Map();
    this.goals = new Map();
    this.affirmations = new Map();

    this.loadData();

    // Set initial IDs
    this.currentUserId = this.getNextId(this.users);
    this.currentMoodId = this.getNextId(this.moods);
    this.currentExerciseId = this.getNextId(this.exercises);
    this.currentJournalId = this.getNextId(this.journals);
    this.currentAchievementId = this.getNextId(this.achievements);
    this.currentAssessmentId = this.getNextId(this.assessments);
    this.currentChatMessageId = this.getNextId(this.chatMessages);
    this.currentGoalId = this.getNextId(this.goals);
    this.currentAffirmationId = this.getNextId(this.affirmations);
  }

  private getNextId(map: Map<number, any>): number {
    if (map.size === 0) return 1;
    return Math.max(...Array.from(map.keys())) + 1;
  }

  private loadData(): void {
    this.loadCollection('users', this.users);
    this.loadCollection('moods', this.moods);
    this.loadCollection('exercises', this.exercises);
    this.loadCollection('journals', this.journals);
    this.loadCollection('achievements', this.achievements);
    this.loadCollection('assessments', this.assessments);
    this.loadCollection('chatMessages', this.chatMessages);
    this.loadCollection('goals', this.goals);
    this.loadCollection('affirmations', this.affirmations);
  }

  private async loadCollection(filename: string, map: Map<number, any>): Promise<void> {
    const filePath = path.join(this.dataDir, `${filename}.json`);

    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(await this.readFile(filePath, 'utf8'));

        for (const item of data) {
          if (item && typeof item.id === 'number') {
            map.set(item.id, item);
          }
        }
      } catch (error) {
        console.error(`Error loading ${filename}:`, error);
      }
    }
  }

  private async saveCollection(filename: string, map: Map<number, any>): Promise<void> {
    const filePath = path.join(this.dataDir, `${filename}.json`);

    try {
      const data = Array.from(map.values());
      await this.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error saving ${filename}:`, error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      xpPoints: 0,
      level: 1,
      streak: 0,
      lastActive: now,
      initialAssessmentCompleted: false
    };
    this.users.set(id, user);
    await this.saveCollection('users', this.users);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    await this.saveCollection('users', this.users);
    return updatedUser;
  }

  // Mood operations
  async getMoodsByUserId(userId: number): Promise<Mood[]> {
    return Array.from(this.moods.values())
      .filter(mood => mood.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createMood(insertMood: InsertMood): Promise<Mood> {
    const id = this.currentMoodId++;
    const mood: Mood = {
      ...insertMood,
      id,
      createdAt: new Date()
    };
    this.moods.set(id, mood);
    await this.saveCollection('moods', this.moods);
    return mood;
  }

  // Exercise operations
  async getExercisesByUserId(userId: number): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.currentExerciseId++;
    const exercise: Exercise = {
      ...insertExercise,
      id,
      completed: true,
      createdAt: new Date()
    };
    this.exercises.set(id, exercise);
    await this.saveCollection('exercises', this.exercises);
    return exercise;
  }

  // Journal operations
  async getJournalsByUserId(userId: number): Promise<Journal[]> {
    return Array.from(this.journals.values())
      .filter(journal => journal.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getJournalById(id: number): Promise<Journal | undefined> {
    return this.journals.get(id);
  }

  async createJournal(insertJournal: InsertJournal): Promise<Journal> {
    const id = this.currentJournalId++;
    const journal: Journal = {
      ...insertJournal,
      id,
      createdAt: new Date()
    };
    this.journals.set(id, journal);
    await this.saveCollection('journals', this.journals);
    return journal;
  }

  // Achievement operations
  async getAchievementsByUserId(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const achievement: Achievement = {
      ...insertAchievement,
      id,
      earnedAt: new Date()
    };
    this.achievements.set(id, achievement);
    await this.saveCollection('achievements', this.achievements);
    return achievement;
  }

  // Assessment operations
  async getAssessmentByUserId(userId: number): Promise<Assessment | undefined> {
    return Array.from(this.assessments.values())
      .find(assessment => assessment.userId === userId);
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = this.currentAssessmentId++;
    const assessment: Assessment = {
      ...insertAssessment,
      id,
      createdAt: new Date()
    };
    this.assessments.set(id, assessment);
    await this.saveCollection('assessments', this.assessments);
    return assessment;
  }

  // Chat operations
  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    this.chatMessages.set(id, message);
    await this.saveCollection('chatMessages', this.chatMessages);
    return message;
  }

  // Goals
  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    const goals = Array.from(this.goals.values());
    return goals.filter(goal => goal.userId === userId);
  }

  async getGoalById(id: number): Promise<Goal | null> {
    return this.goals.get(id) || null;
  }

  async createGoal(data: InsertGoal): Promise<Goal> {
    const id = this.currentGoalId++;
    const goal: Goal = {
      ...data,
      id,
      createdAt: new Date()
    };
    this.goals.set(id, goal);
    await this.saveCollection('goals', this.goals);
    return goal;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | null> {
    const goal = this.goals.get(id);
    if (!goal) return null;

    const updatedGoal = { ...goal, ...updates };
    this.goals.set(id, updatedGoal);
    await this.saveCollection('goals', this.goals);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const deleted = this.goals.delete(id);
    await this.saveCollection('goals', this.goals);
    return deleted;
  }


  // Affirmations
  async getAffirmationsByUserId(userId: number): Promise<Affirmation[]> {
    const affirmations = Array.from(this.affirmations.values());
    return affirmations.filter(affirmation => affirmation.userId === userId);
  }

  async getAffirmationById(id: number): Promise<Affirmation | null> {
    return this.affirmations.get(id) || null;
  }

  async createAffirmation(data: InsertAffirmation): Promise<Affirmation> {
    const id = this.currentAffirmationId++;
    const affirmation: Affirmation = {
      ...data,
      id,
      createdAt: new Date()
    };
    this.affirmations.set(id, affirmation);
    await this.saveCollection('affirmations', this.affirmations);
    return affirmation;
  }

  async updateAffirmation(id: number, updates: Partial<Affirmation>): Promise<Affirmation | null> {
    const affirmation = this.affirmations.get(id);
    if (!affirmation) return null;

    const updatedAffirmation = { ...affirmation, ...updates };
    this.affirmations.set(id, updatedAffirmation);
    await this.saveCollection('affirmations', this.affirmations);
    return updatedAffirmation;
  }

  async deleteAffirmation(id: number): Promise<boolean> {
    const deleted = this.affirmations.delete(id);
    await this.saveCollection('affirmations', this.affirmations);
    return deleted;
  }
}

// Change to use FileStorage
export const storage = new FileStorage();