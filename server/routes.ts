import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertMoodSchema, 
  insertExerciseSchema, 
  insertJournalSchema, 
  insertAssessmentSchema,
  insertChatMessageSchema,
  insertAchievementSchema,
  insertGoalSchema,
  insertAffirmationSchema
} from "@shared/schema";
import { fromZodError, ValidationError } from "zod-validation-error";
import { GoogleGenerativeAI } from "@google/generative-ai";
import session from "express-session";
import MemoryStore from "memorystore";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication middleware
  const authenticate = async (req: Request, res: Response, next: Function) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = user;
    next();
  };

  // Session setup
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "mindful-path-secret",
    })
  );

  // Auth routes
  app.post('/api/register', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username is taken
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email is taken
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser(validatedData);
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      
      // Set session
      req.session.userId = user.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Don't send password back to client
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/me', authenticate, async (req, res) => {
    // Password is already removed by authenticate middleware
    res.json(req.user);
  });

  // Assessment routes
  app.post('/api/assessment', authenticate, async (req, res) => {
    try {
      const validatedData = insertAssessmentSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const assessment = await storage.createAssessment(validatedData);
      
      // Update user's initialAssessmentCompleted status
      await storage.updateUser(req.user.id, { initialAssessmentCompleted: true });
      
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error during assessment submission" });
    }
  });

  app.get('/api/assessment', authenticate, async (req, res) => {
    try {
      const assessment = await storage.getAssessmentByUserId(req.user.id);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching assessment" });
    }
  });

  // Mood routes
  app.post('/api/moods', authenticate, async (req, res) => {
    try {
      const validatedData = insertMoodSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const mood = await storage.createMood(validatedData);
      
      // Add XP for tracking mood
      const user = await storage.getUser(req.user.id);
      if (user) {
        await storage.updateUser(user.id, { 
          xpPoints: user.xpPoints + 10,
          lastActive: new Date()
        });
      }
      
      res.status(201).json(mood);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error during mood submission" });
    }
  });

  app.get('/api/moods', authenticate, async (req, res) => {
    try {
      const moods = await storage.getMoodsByUserId(req.user.id);
      res.json(moods);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching moods" });
    }
  });

  // Exercise routes
  app.post('/api/exercises', authenticate, async (req, res) => {
    try {
      const validatedData = insertExerciseSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const exercise = await storage.createExercise(validatedData);
      
      // Add XP for completing exercise
      const xpPoints = validatedData.xpEarned || Math.round(validatedData.duration / 60 * 10); // 10 XP per minute
      
      const user = await storage.getUser(req.user.id);
      if (user) {
        // Update streak if this is a new day
        const today = new Date().toDateString();
        const lastActiveDay = user.lastActive ? new Date(user.lastActive).toDateString() : '';
        
        let streak = user.streak;
        if (lastActiveDay !== today) {
          streak += 1;
        }
        
        await storage.updateUser(user.id, { 
          xpPoints: user.xpPoints + xpPoints,
          streak,
          lastActive: new Date()
        });
        
        // Check if user should level up (100 XP per level)
        const newTotalXP = user.xpPoints + xpPoints;
        const newLevel = Math.floor(newTotalXP / 100) + 1;
        
        if (newLevel > user.level) {
          await storage.updateUser(user.id, { level: newLevel });
        }
      }
      
      res.status(201).json(exercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error during exercise submission" });
    }
  });

  app.get('/api/exercises', authenticate, async (req, res) => {
    try {
      const exercises = await storage.getExercisesByUserId(req.user.id);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching exercises" });
    }
  });

  // Journal routes
  app.post('/api/journals', authenticate, async (req, res) => {
    try {
      const validatedData = insertJournalSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const journal = await storage.createJournal(validatedData);
      
      // Add XP for journaling
      const user = await storage.getUser(req.user.id);
      if (user) {
        await storage.updateUser(user.id, { 
          xpPoints: user.xpPoints + 15,
          lastActive: new Date()
        });
      }
      
      res.status(201).json(journal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error during journal submission" });
    }
  });

  app.get('/api/journals', authenticate, async (req, res) => {
    try {
      const journals = await storage.getJournalsByUserId(req.user.id);
      res.json(journals);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching journals" });
    }
  });

  app.get('/api/journals/:id', authenticate, async (req, res) => {
    try {
      const journal = await storage.getJournalById(Number(req.params.id));
      
      if (!journal) {
        return res.status(404).json({ message: "Journal not found" });
      }
      
      if (journal.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to access this journal" });
      }
      
      res.json(journal);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching journal" });
    }
  });

  // Achievement routes
  app.get('/api/achievements', authenticate, async (req, res) => {
    try {
      const achievements = await storage.getAchievementsByUserId(req.user.id);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching achievements" });
    }
  });

  app.post('/api/achievements', authenticate, async (req, res) => {
    try {
      const validatedData = insertAchievementSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const achievement = await storage.createAchievement(validatedData);
      
      // Add XP for achievement
      const user = await storage.getUser(req.user.id);
      if (user) {
        await storage.updateUser(user.id, { 
          xpPoints: user.xpPoints + 25,
          lastActive: new Date()
        });
      }
      
      res.status(201).json(achievement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error during achievement submission" });
    }
  });

  // Chat routes
  app.get('/api/chat', authenticate, async (req, res) => {
    try {
      const messages = await storage.getChatMessagesByUserId(req.user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching chat messages" });
    }
  });

  app.post('/api/chat', authenticate, async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        userId: req.user.id,
        isUserMessage: true
      });
      
      const message = await storage.createChatMessage(validatedData);
      
      // Generate AI response using Gemini
      try {
        const messages = await storage.getChatMessagesByUserId(req.user.id);
        
        // Format chat history correctly - first message must be from user
        // Create a proper history array that starts with a user message
        let chatHistory = [];
        
        // Add a dummy user message first if needed
        if (messages.length > 0) {
          // Find the first user message to use
          const firstUserMsg = messages.find(msg => msg.isUserMessage);
          if (firstUserMsg) {
            // Start with this user message
            chatHistory.push({
              role: "user",
              parts: [{ text: firstUserMsg.content }]
            });
            
            // Then add a system response to set the tone
            chatHistory.push({
              role: "model",
              parts: [{ text: "I am MindBot, a CBT-focused wellness assistant. I provide supportive, empathetic guidance using cognitive behavioral therapy techniques to help users manage their mental health. I can suggest exercises like deep breathing, cognitive restructuring, gratitude practice, and mindfulness meditation. I'll avoid giving medical advice and focus on evidence-based CBT techniques while maintaining a calm, supportive tone." }]
            });
            
            // Then add the rest of the conversation, skipping the first user message we already added
            const remainingMessages = messages.filter(msg => msg !== firstUserMsg);
            for (const msg of remainingMessages) {
              chatHistory.push({
                role: msg.isUserMessage ? "user" : "model",
                parts: [{ text: msg.content }]
              });
            }
          }
        }
        
        // If we don't have a valid history yet, create a minimal valid one
        if (chatHistory.length === 0) {
          chatHistory = [
            {
              role: "user",
              parts: [{ text: message.content }]
            }
          ];
        }
        
        // Create chat session
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        });
        
        // Generate response to the user's message
        const result = await chat.sendMessage(message.content);
        const aiResponse = result.response.text();
        
        // Store AI response
        const aiMessage = await storage.createChatMessage({
          userId: req.user.id,
          content: aiResponse,
          isUserMessage: false
        });
        
        res.status(201).json([message, aiMessage]);
      } catch (genAiError) {
        console.error("Error generating AI response:", genAiError);
        
        // Still return the user message even if AI response fails
        res.status(201).json(message);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error during message submission" });
    }
  });

  // Goals routes
  app.get('/api/goals', authenticate, async (req, res) => {
    try {
      const goals = await storage.getGoalsByUserId(req.user.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching goals" });
    }
  });

  app.post('/api/goals', authenticate, async (req, res) => {
    try {
      const validatedData = insertGoalSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const goal = await storage.createGoal(validatedData);
      
      // Add XP for setting a goal
      const user = await storage.getUser(req.user.id);
      if (user) {
        await storage.updateUser(user.id, { 
          xpPoints: user.xpPoints + 15,
          lastActive: new Date()
        });
      }
      
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error during goal creation" });
    }
  });

  app.put('/api/goals/:id', authenticate, async (req, res) => {
    try {
      const goalId = Number(req.params.id);
      const goal = await storage.getGoalById(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this goal" });
      }
      
      const updatedGoal = await storage.updateGoal(goalId, req.body);
      
      // If goal was just completed, add XP
      if (req.body.completed && !goal.completed) {
        const user = await storage.getUser(req.user.id);
        if (user) {
          await storage.updateUser(user.id, { 
            xpPoints: user.xpPoints + 30,
            lastActive: new Date()
          });
        }
      }
      
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Server error updating goal" });
    }
  });

  app.delete('/api/goals/:id', authenticate, async (req, res) => {
    try {
      const goalId = Number(req.params.id);
      const goal = await storage.getGoalById(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this goal" });
      }
      
      const success = await storage.deleteGoal(goalId);
      
      if (success) {
        res.json({ message: "Goal deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete goal" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error deleting goal" });
    }
  });

  // Affirmations routes
  app.get('/api/affirmations', authenticate, async (req, res) => {
    try {
      const affirmations = await storage.getAffirmationsByUserId(req.user.id);
      res.json(affirmations);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching affirmations" });
    }
  });

  app.post('/api/affirmations', authenticate, async (req, res) => {
    try {
      const validatedData = insertAffirmationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const affirmation = await storage.createAffirmation(validatedData);
      
      // Add XP for creating an affirmation
      const user = await storage.getUser(req.user.id);
      if (user) {
        await storage.updateUser(user.id, { 
          xpPoints: user.xpPoints + 10,
          lastActive: new Date()
        });
      }
      
      res.status(201).json(affirmation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error during affirmation creation" });
    }
  });
  
  // Generate AI affirmation
  app.post('/api/affirmations/generate', authenticate, async (req, res) => {
    try {
      const { challenge, focus } = req.body;
      
      if (!challenge || !focus) {
        return res.status(400).json({ message: "Challenge and focus are required" });
      }
      
      try {
        // Create chat session for affirmation generation
        const chat = model.startChat({
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        });
        
        // Generate affirmation based on user's challenge and focus
        const prompt = `Generate a short, positive affirmation for someone dealing with ${challenge} who wants to focus on ${focus}. The affirmation should be empowering, uplifting, and based on cognitive behavioral therapy principles. Keep it concise (under 150 characters) and in first person. Don't include any explanation, just the affirmation.`;
        
        const result = await chat.sendMessage(prompt);
        const affirmationText = result.response.text().trim();
        
        // Create the affirmation in storage
        const affirmation = await storage.createAffirmation({
          userId: req.user.id,
          content: affirmationText,
          category: focus,
          favorite: false
        });
        
        // Add XP for generating an affirmation
        const user = await storage.getUser(req.user.id);
        if (user) {
          await storage.updateUser(user.id, { 
            xpPoints: user.xpPoints + 15,
            lastActive: new Date()
          });
        }
        
        res.status(201).json(affirmation);
      } catch (genAiError) {
        console.error("Error generating affirmation:", genAiError);
        res.status(500).json({ message: "Error generating affirmation" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error during affirmation generation" });
    }
  });

  app.put('/api/affirmations/:id', authenticate, async (req, res) => {
    try {
      const affirmationId = Number(req.params.id);
      const affirmation = await storage.getAffirmationById(affirmationId);
      
      if (!affirmation) {
        return res.status(404).json({ message: "Affirmation not found" });
      }
      
      if (affirmation.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this affirmation" });
      }
      
      const updatedAffirmation = await storage.updateAffirmation(affirmationId, req.body);
      res.json(updatedAffirmation);
    } catch (error) {
      res.status(500).json({ message: "Server error updating affirmation" });
    }
  });

  app.delete('/api/affirmations/:id', authenticate, async (req, res) => {
    try {
      const affirmationId = Number(req.params.id);
      const affirmation = await storage.getAffirmationById(affirmationId);
      
      if (!affirmation) {
        return res.status(404).json({ message: "Affirmation not found" });
      }
      
      if (affirmation.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this affirmation" });
      }
      
      const success = await storage.deleteAffirmation(affirmationId);
      
      if (success) {
        res.json({ message: "Affirmation deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete affirmation" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error deleting affirmation" });
    }
  });

  // Weekly Mental Health Report
  app.get('/api/reports/weekly', authenticate, async (req, res) => {
    try {
      // Get user's data from the past week
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get moods for the week
      const allMoods = await storage.getMoodsByUserId(req.user.id);
      const weekMoods = allMoods.filter(mood => 
        new Date(mood.createdAt) >= oneWeekAgo
      );
      
      // Get exercises for the week
      const allExercises = await storage.getExercisesByUserId(req.user.id);
      const weekExercises = allExercises.filter(exercise => 
        new Date(exercise.createdAt) >= oneWeekAgo
      );
      
      // Get journals for the week
      const allJournals = await storage.getJournalsByUserId(req.user.id);
      const weekJournals = allJournals.filter(journal => 
        new Date(journal.createdAt) >= oneWeekAgo
      );
      
      // Get goals
      const goals = await storage.getGoalsByUserId(req.user.id);
      
      // Calculate metrics
      const moodAverage = weekMoods.length > 0 
        ? weekMoods.reduce((sum, mood) => sum + mood.intensity, 0) / weekMoods.length 
        : null;
      
      const totalExerciseMinutes = weekExercises.reduce((sum, ex) => sum + ex.duration / 60, 0);
      
      const exercisesByType = weekExercises.reduce((acc, ex) => {
        acc[ex.type] = (acc[ex.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Generate insights
      let insights = [];
      
      if (weekMoods.length === 0) {
        insights.push("You haven't tracked your mood this week. Regular tracking helps identify patterns.");
      } else if (moodAverage !== null) {
        if (moodAverage > 3.5) {
          insights.push("Your mood has been generally positive this week. Great job!");
        } else if (moodAverage < 2.5) {
          insights.push("Your mood has been lower than usual. Consider trying more self-care activities.");
        } else {
          insights.push("Your mood has been neutral overall this week.");
        }
      }
      
      if (weekExercises.length === 0) {
        insights.push("You haven't logged any wellness exercises this week. Even short sessions can be beneficial.");
      } else if (weekExercises.length >= 3) {
        insights.push(`You've completed ${weekExercises.length} exercises this week - excellent consistency!`);
      }
      
      if (weekJournals.length === 0) {
        insights.push("Try journaling to process your thoughts and feelings.");
      } else {
        insights.push(`You've written ${weekJournals.length} journal entries this week.`);
      }
      
      if (goals.length > 0) {
        const completedGoals = goals.filter(goal => goal.completed).length;
        if (completedGoals > 0) {
          insights.push(`You've completed ${completedGoals} goals. Well done!`);
        }
      }
      
      // Compile report
      const report = {
        period: {
          start: oneWeekAgo.toISOString(),
          end: now.toISOString()
        },
        moodData: {
          entries: weekMoods.length,
          average: moodAverage,
          trend: weekMoods.length >= 2 ? 
            (weekMoods[weekMoods.length-1].intensity > weekMoods[0].intensity ? 'improving' : 
             weekMoods[weekMoods.length-1].intensity < weekMoods[0].intensity ? 'declining' : 'stable') : 'not enough data'
        },
        exerciseData: {
          count: weekExercises.length,
          totalMinutes: totalExerciseMinutes,
          byType: exercisesByType
        },
        journalData: {
          count: weekJournals.length
        },
        goalData: {
          total: goals.length,
          completed: goals.filter(goal => goal.completed).length,
          inProgress: goals.filter(goal => !goal.completed).length
        },
        insights: insights
      };
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Server error generating weekly report" });
    }
  });

  return httpServer;
}
