
import { storage } from './storage';

export async function setupDefaultUser() {
  try {
    // Check if default user exists
    const existingUser = await storage.getUserByUsername('demo');
    
    if (!existingUser) {
      console.log('Creating default demo user...');
      
      // Create a default user
      const user = await storage.createUser({
        username: 'demo',
        password: 'password123',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@example.com',
        initialAssessmentCompleted: true
      });
      
      // Create default assessment
      await storage.createAssessment({
        userId: user.id,
        responses: {
          anxietyLevel: 3,
          depressionLevel: 2,
          sleepQuality: 4,
          stressLevel: 3,
          selfEsteem: 4,
          goals: ['reduce stress', 'improve mood']
        },
        score: 65
      });
      
      // Create some initial data
      await storage.createMood({
        userId: user.id, 
        mood: 'Happy',
        intensity: 4,
        notes: 'Feeling good today'
      });
      
      await storage.createExercise({
        userId: user.id,
        type: 'Meditation',
        duration: 600, // 10 minutes
        notes: 'Morning meditation session'
      });
      
      await storage.createJournal({
        userId: user.id,
        title: 'First day',
        content: 'This is my first journal entry in the app. Looking forward to tracking my progress!',
        mood: 'Hopeful'
      });
      
      await storage.createAchievement({
        userId: user.id,
        badgeId: 'first-login'
      });
      
      console.log('Default user created with ID:', user.id);
    } else {
      console.log('Default user already exists with ID:', existingUser.id);
    }
  } catch (error) {
    console.error('Error setting up default user:', error);
  }
}
