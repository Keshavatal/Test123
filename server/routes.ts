import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, loginSchema, insertMoodSchema, insertJournalEntrySchema,
  insertExerciseCompletionSchema, insertAssessmentSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import { generateChatbotResponse } from "./chatbot";

// Middleware for checking if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "mindwell-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // AUTH ROUTES
  // Register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      
      // Set user session
      req.session.userId = newUser.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(loginData.username);
      
      if (!user || user.password !== loginData.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Logout user
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Successfully logged out" });
    });
  });
  
  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update last active timestamp
    await storage.updateUser(userId, { lastActive: new Date() });
    
    // Check and update streak
    const today = new Date();
    const lastActive = user.lastActive;
    const dayDifference = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    let updatedUser = user;
    
    if (dayDifference === 1) {
      // Consecutive day, increment streak
      updatedUser = await storage.updateUser(userId, { 
        currentStreak: user.currentStreak + 1 
      }) || user;
    } else if (dayDifference > 1) {
      // Streak broken, reset to 1 (today)
      updatedUser = await storage.updateUser(userId, { currentStreak: 1 }) || user;
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  });
  
  // MOOD ROUTES
  // Record user mood
  app.post("/api/moods", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const moodData = insertMoodSchema.parse({ ...req.body, userId });
      
      const newMood = await storage.createMood(moodData);
      res.status(201).json(newMood);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Get user moods
  app.get("/api/moods", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const moods = await storage.getMoodsByUserId(userId);
    res.json(moods);
  });
  
  // Get latest user mood
  app.get("/api/moods/latest", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const mood = await storage.getLatestMoodByUserId(userId);
    
    if (!mood) {
      return res.status(404).json({ message: "No mood entries found" });
    }
    
    res.json(mood);
  });
  
  // EXERCISE ROUTES
  // Get all exercises
  app.get("/api/exercises", requireAuth, async (_req, res) => {
    const exercises = await storage.getExercises();
    res.json(exercises);
  });
  
  // Get exercise by ID
  app.get("/api/exercises/:id", requireAuth, async (req, res) => {
    const exerciseId = parseInt(req.params.id);
    
    if (isNaN(exerciseId)) {
      return res.status(400).json({ message: "Invalid exercise ID" });
    }
    
    const exercise = await storage.getExerciseById(exerciseId);
    
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    
    res.json(exercise);
  });
  
  // Get exercises by type
  app.get("/api/exercises/type/:type", requireAuth, async (req, res) => {
    const type = req.params.type;
    const exercises = await storage.getExercisesByType(type);
    res.json(exercises);
  });
  
  // Record exercise completion
  app.post("/api/exercises/complete", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const completionData = insertExerciseCompletionSchema.parse({
        ...req.body,
        userId
      });
      
      const completion = await storage.addExerciseCompletion(completionData);
      
      // Get updated user with new XP
      const user = await storage.getUser(userId);
      
      res.status(201).json({
        completion,
        userXp: user?.xp,
        userLevel: user?.level
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Get user exercise completions
  app.get("/api/exercises/completions", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const completions = await storage.getExerciseCompletionsByUserId(userId);
    res.json(completions);
  });
  
  // Get recent exercise completions (default 7 days)
  app.get("/api/exercises/completions/recent", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const days = parseInt(req.query.days as string) || 7;
    
    const completions = await storage.getRecentExerciseCompletions(userId, days);
    res.json(completions);
  });
  
  // ACHIEVEMENT ROUTES
  // Get all achievements
  app.get("/api/achievements", requireAuth, async (_req, res) => {
    const achievements = await storage.getAchievements();
    res.json(achievements);
  });
  
  // Get user achievements
  app.get("/api/achievements/user", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const userAchievements = await storage.getUserAchievements(userId);
    
    // Get all achievements for reference
    const allAchievements = await storage.getAchievements();
    
    // Create a map of unlocked achievements
    const unlockedMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua])
    );
    
    // Return all achievements with an 'unlocked' property
    const achievementsWithStatus = allAchievements.map(achievement => ({
      ...achievement,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id)?.unlockedAt || null
    }));
    
    res.json(achievementsWithStatus);
  });
  
  // JOURNAL ROUTES
  // Create journal entry
  app.post("/api/journal", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const entryData = insertJournalEntrySchema.parse({
        ...req.body,
        userId
      });
      
      const entry = await storage.createJournalEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Get user journal entries
  app.get("/api/journal", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const entries = await storage.getJournalEntriesByUserId(userId);
    res.json(entries);
  });
  
  // Get journal entry by ID
  app.get("/api/journal/:id", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const entryId = parseInt(req.params.id);
    
    if (isNaN(entryId)) {
      return res.status(400).json({ message: "Invalid entry ID" });
    }
    
    const entry = await storage.getJournalEntryById(entryId);
    
    if (!entry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    
    // Check if the entry belongs to the user
    if (entry.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to access this entry" });
    }
    
    res.json(entry);
  });
  
  // CHATBOT ROUTES
  // Get chat history
  app.get("/api/chat", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const chatHistory = await storage.getChatHistoryByUserId(userId, limit);
    res.json(chatHistory);
  });
  
  // Send message to chatbot
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { message } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const response = await generateChatbotResponse(userId, message);
      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate response" });
    }
  });
  
  // ASSESSMENT ROUTES
  // Submit assessment
  app.post("/api/assessment", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        userId
      });
      
      const assessment = await storage.saveAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Get user assessments
  app.get("/api/assessment", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const assessments = await storage.getAssessmentsByUserId(userId);
    res.json(assessments);
  });
  
  // Get latest assessment
  app.get("/api/assessment/latest", requireAuth, async (req, res) => {
    const userId = req.session.userId as number;
    const assessment = await storage.getLatestAssessmentByUserId(userId);
    
    if (!assessment) {
      return res.status(404).json({ message: "No assessments found" });
    }
    
    res.json(assessment);
  });

  const httpServer = createServer(app);
  return httpServer;
}
