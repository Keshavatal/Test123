import { 
  users, type User, type InsertUser,
  moods, type Mood, type InsertMood,
  exercises, type Exercise, type InsertExercise,
  exerciseCompletions, type ExerciseCompletion, type InsertExerciseCompletion,
  achievements, type Achievement, type InsertAchievement,
  userAchievements, type UserAchievement, type InsertUserAchievement,
  journalEntries, type JournalEntry, type InsertJournalEntry,
  chatMessages, type ChatMessage, type InsertChatMessage,
  assessments, type Assessment, type InsertAssessment
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Mood methods
  createMood(mood: InsertMood): Promise<Mood>;
  getMoodsByUserId(userId: number): Promise<Mood[]>;
  getLatestMoodByUserId(userId: number): Promise<Mood | undefined>;

  // Exercise methods
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getExercises(): Promise<Exercise[]>;
  getExerciseById(id: number): Promise<Exercise | undefined>;
  getExercisesByType(type: string): Promise<Exercise[]>;

  // Exercise Completion methods
  addExerciseCompletion(completion: InsertExerciseCompletion): Promise<ExerciseCompletion>;
  getExerciseCompletionsByUserId(userId: number): Promise<ExerciseCompletion[]>;
  getRecentExerciseCompletions(userId: number, days: number): Promise<ExerciseCompletion[]>;

  // Achievement methods
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  addUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;

  // Journal methods
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  getJournalEntryById(id: number): Promise<JournalEntry | undefined>;

  // Chat methods
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistoryByUserId(userId: number, limit?: number): Promise<ChatMessage[]>;

  // Assessment methods
  saveAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessmentsByUserId(userId: number): Promise<Assessment[]>;
  getLatestAssessmentByUserId(userId: number): Promise<Assessment | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moods: Map<number, Mood>;
  private exercises: Map<number, Exercise>;
  private exerciseCompletions: Map<number, ExerciseCompletion>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private journalEntries: Map<number, JournalEntry>;
  private chatMessages: Map<number, ChatMessage>;
  private assessments: Map<number, Assessment>;
  
  private currentIds: {
    users: number;
    moods: number;
    exercises: number;
    exerciseCompletions: number;
    achievements: number;
    userAchievements: number;
    journalEntries: number;
    chatMessages: number;
    assessments: number;
  };

  constructor() {
    this.users = new Map();
    this.moods = new Map();
    this.exercises = new Map();
    this.exerciseCompletions = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.journalEntries = new Map();
    this.chatMessages = new Map();
    this.assessments = new Map();
    
    this.currentIds = {
      users: 1,
      moods: 1,
      exercises: 1,
      exerciseCompletions: 1,
      achievements: 1,
      userAchievements: 1,
      journalEntries: 1,
      chatMessages: 1,
      assessments: 1
    };
    
    // Initialize with some default exercises
    this.initDefaultData();
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const id = this.currentIds.users++;
    const user: User = { 
      ...insertUser, 
      id,
      level: 1,
      xp: 0,
      currentStreak: 0,
      lastActive: now,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Mood methods
  async createMood(insertMood: InsertMood): Promise<Mood> {
    const id = this.currentIds.moods++;
    const now = new Date();
    const mood: Mood = { ...insertMood, id, createdAt: now };
    this.moods.set(id, mood);
    return mood;
  }
  
  async getMoodsByUserId(userId: number): Promise<Mood[]> {
    return Array.from(this.moods.values())
      .filter(mood => mood.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getLatestMoodByUserId(userId: number): Promise<Mood | undefined> {
    const userMoods = await this.getMoodsByUserId(userId);
    return userMoods.length > 0 ? userMoods[0] : undefined;
  }
  
  // Exercise methods
  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.currentIds.exercises++;
    const exercise: Exercise = { ...insertExercise, id };
    this.exercises.set(id, exercise);
    return exercise;
  }
  
  async getExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }
  
  async getExerciseById(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }
  
  async getExercisesByType(type: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.type === type);
  }
  
  // Exercise Completion methods
  async addExerciseCompletion(insertCompletion: InsertExerciseCompletion): Promise<ExerciseCompletion> {
    const id = this.currentIds.exerciseCompletions++;
    const now = new Date();
    const completion: ExerciseCompletion = { ...insertCompletion, id, completedAt: now };
    this.exerciseCompletions.set(id, completion);
    
    // Update user XP
    const exercise = await this.getExerciseById(insertCompletion.exerciseId);
    if (exercise) {
      const user = await this.getUser(insertCompletion.userId);
      if (user) {
        const updatedXP = user.xp + exercise.xpReward;
        // Check if level up is needed (100 XP per level)
        const newLevel = Math.floor(updatedXP / 100) + 1;
        await this.updateUser(user.id, { 
          xp: updatedXP,
          level: newLevel > user.level ? newLevel : user.level
        });
      }
    }
    
    return completion;
  }
  
  async getExerciseCompletionsByUserId(userId: number): Promise<ExerciseCompletion[]> {
    return Array.from(this.exerciseCompletions.values())
      .filter(completion => completion.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }
  
  async getRecentExerciseCompletions(userId: number, days: number): Promise<ExerciseCompletion[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return (await this.getExerciseCompletionsByUserId(userId))
      .filter(completion => completion.completedAt >= cutoffDate);
  }
  
  // Achievement methods
  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentIds.achievements++;
    const achievement: Achievement = { ...insertAchievement, id };
    this.achievements.set(id, achievement);
    return achievement;
  }
  
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId)
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
  }
  
  async addUserAchievement(insertUserAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = this.currentIds.userAchievements++;
    const now = new Date();
    const userAchievement: UserAchievement = { 
      ...insertUserAchievement, 
      id, 
      unlockedAt: now 
    };
    this.userAchievements.set(id, userAchievement);
    
    // Add XP reward to user
    const achievement = await this.achievements.get(insertUserAchievement.achievementId);
    if (achievement) {
      const user = await this.getUser(insertUserAchievement.userId);
      if (user) {
        const updatedXP = user.xp + achievement.xpReward;
        const newLevel = Math.floor(updatedXP / 100) + 1;
        await this.updateUser(user.id, { 
          xp: updatedXP, 
          level: newLevel > user.level ? newLevel : user.level
        });
      }
    }
    
    return userAchievement;
  }
  
  // Journal methods
  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.currentIds.journalEntries++;
    const now = new Date();
    const entry: JournalEntry = { ...insertEntry, id, createdAt: now };
    this.journalEntries.set(id, entry);
    return entry;
  }
  
  async getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getJournalEntryById(id: number): Promise<JournalEntry | undefined> {
    return this.journalEntries.get(id);
  }
  
  // Chat methods
  async saveChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentIds.chatMessages++;
    const now = new Date();
    const message: ChatMessage = { ...insertMessage, id, timestamp: now };
    this.chatMessages.set(id, message);
    return message;
  }
  
  async getChatHistoryByUserId(userId: number, limit?: number): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return limit ? messages.slice(-limit) : messages;
  }
  
  // Assessment methods
  async saveAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = this.currentIds.assessments++;
    const now = new Date();
    const assessment: Assessment = { ...insertAssessment, id, createdAt: now };
    this.assessments.set(id, assessment);
    return assessment;
  }
  
  async getAssessmentsByUserId(userId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values())
      .filter(assessment => assessment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getLatestAssessmentByUserId(userId: number): Promise<Assessment | undefined> {
    const userAssessments = await this.getAssessmentsByUserId(userId);
    return userAssessments.length > 0 ? userAssessments[0] : undefined;
  }
  
  // Initialize default data
  private async initDefaultData() {
    // Create default exercises
    await this.createExercise({
      title: "Cognitive Restructuring",
      description: "Challenge negative thought patterns and replace them with positive ones.",
      type: "cognitive",
      durationMinutes: 10,
      xpReward: 20,
      icon: "fa-brain",
      iconBg: "bg-primary bg-opacity-20"
    });
    
    await this.createExercise({
      title: "Breathing Exercise",
      description: "Practice deep breathing to reduce stress and improve focus.",
      type: "breathing",
      durationMinutes: 5,
      xpReward: 10,
      icon: "fa-wind",
      iconBg: "bg-secondary bg-opacity-20"
    });
    
    await this.createExercise({
      title: "Gratitude Journal",
      description: "Write down three things you're grateful for today.",
      type: "gratitude",
      durationMinutes: 7,
      xpReward: 15,
      icon: "fa-book-open",
      iconBg: "bg-accent bg-opacity-20"
    });
    
    await this.createExercise({
      title: "Mindfulness Meditation",
      description: "Practice being present and aware of your thoughts without judgment.",
      type: "mindfulness",
      durationMinutes: 8,
      xpReward: 15,
      icon: "fa-om",
      iconBg: "bg-purple-200"
    });
    
    await this.createExercise({
      title: "Thought Record",
      description: "Record and analyze your thoughts to identify patterns.",
      type: "cognitive",
      durationMinutes: 12,
      xpReward: 25,
      icon: "fa-clipboard-list",
      iconBg: "bg-blue-200"
    });
    
    // Create default achievements
    await this.createAchievement({
      title: "Consistency",
      description: "Complete exercises for 5 consecutive days",
      icon: "fa-medal",
      iconBg: "bg-primary bg-opacity-10",
      requirement: "streak:5",
      xpReward: 50
    });
    
    await this.createAchievement({
      title: "Journaling",
      description: "Create 10 journal entries",
      icon: "fa-star",
      iconBg: "bg-secondary bg-opacity-10",
      requirement: "journal:10",
      xpReward: 40
    });
    
    await this.createAchievement({
      title: "Mindfulness",
      description: "Complete 5 mindfulness exercises",
      icon: "fa-award",
      iconBg: "bg-purple-200",
      requirement: "exercise:mindfulness:5",
      xpReward: 30
    });
    
    await this.createAchievement({
      title: "Gratitude",
      description: "Complete 5 gratitude exercises",
      icon: "fa-trophy",
      iconBg: "bg-yellow-200",
      requirement: "exercise:gratitude:5",
      xpReward: 30
    });
  }
}

export const storage = new MemStorage();
