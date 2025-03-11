import { GoogleGenerativeAI } from "@google/generative-ai";
import { InsertChatMessage } from "@shared/schema";
import { storage } from "./storage";

// Initialize the Google Generative AI SDK with the API key from environment variables
const apiKey = process.env.GEMINI_API_KEY || "";
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("GEMINI_API_KEY is not set. Chatbot will use fallback responses.");
}

// Define the system message that describes the chatbot's role and capabilities
const systemMessage = `
You are a mental health AI assistant specialized in Cognitive Behavioral Therapy (CBT). Your role is to help users improve their mental wellbeing through evidence-based techniques.

Your capabilities include:
1. Providing personalized CBT exercises including cognitive restructuring, thought records, and behavioral activation
2. Guiding breathing and mindfulness exercises in an interactive way
3. Helping users with journaling prompts
4. Teaching gratitude practices
5. Supporting users through stressful situations with a compassionate approach
6. Leading users through guided exercises in a step-by-step format

### Interactive Exercise Guidance
When users want to try an exercise, guide them through it step-by-step. Use numbered steps and ask for input after each step when appropriate. Add emojis and encouraging feedback throughout the exercise.

Exercise Types You Can Guide:
- Breathing exercises: Guide with timed inhalations, holds, and exhalations. Use visualizations.
- Progressive muscle relaxation: Walk through tensing and relaxing different muscle groups.
- Cognitive restructuring: Help identify negative thoughts and challenge them with evidence.
- Gratitude practice: Guide listing things to be grateful for with reflective questions.
- Mindfulness meditation: Lead timed focus exercises on breath, body sensations, or surroundings.
- Thought records: Help analyze thoughts, emotions and create alternative perspectives.

For all exercises, adopt a friendly coaching voice and provide encouragement. When completed, congratulate the user and suggest applying what they learned in daily life.

Keep responses concise (max 3 paragraphs) and focus on actionable guidance. Approach users with warmth, empathy, and professionalism.

Never diagnose medical conditions, and recommend seeking professional help for serious mental health concerns.
`;

// Fallback responses in case API key is missing or API fails
const fallbackResponses = [
  "I understand how you're feeling. One CBT technique you might find helpful is to challenge negative thoughts by asking: What evidence supports this thought? What evidence contradicts it? Is there another way to look at this situation?",
  "Deep breathing can help reduce anxiety in the moment. Try breathing in slowly for 4 counts, hold for 2, then exhale for 6. Repeat this 5 times and notice how your body feels.",
  "Journaling about your feelings can provide clarity. Try writing about what triggered your emotions, what thoughts came up, and how your body felt. This awareness is the first step to positive change.",
  "Practicing gratitude, even during difficult times, can help shift your perspective. Could you think of three small things you're grateful for today?",
  "It sounds like you're going through a challenging time. Remember that your thoughts aren't always facts, and this moment will pass. What's one small self-care activity you could do today?",
  "Mindfulness helps us stay present rather than worrying about the future. Try focusing on your five senses right now: What can you see, hear, feel, smell, and taste?",
];

/**
 * Generate a response from the AI chatbot using the Gemini API
 * @param userId The user ID
 * @param userMessage The message from the user
 * @returns The chatbot's response
 */
export async function generateChatbotResponse(userId: number, userMessage: string): Promise<string> {
  try {
    // Save the user message to the database
    await storage.createChatMessage({
      userId,
      isUserMessage: true,
      content: userMessage
    });

    // Get the chat history to provide context (limit to last 10 messages)
    const chatHistory = await storage.getChatMessagesByUserId(userId);
    // Only use the last 10 messages for context
    const recentMessages = chatHistory.slice(-10);
    
    let response: string;
    
    // If the API key is available, use the Gemini API
    if (genAI) {
      // Create a generative model
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Start chat session with appropriate configuration
      const chat = model.startChat({
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      });
      
      // Send the system message first if there's no history
      if (recentMessages.length === 0) {
        // First send a message as the user to set context
        await chat.sendMessage("You are my AI mental health assistant. Please confirm your role.");
        
        // Then prime the model with the system message
        await chat.sendMessage(systemMessage);
      } else {
        // Include existing history
        for (const msg of recentMessages) {
          if (msg.isUserMessage) {
            await chat.sendMessage(msg.content);
          }
        }
      }
      
      // Generate a response to the latest message
      const result = await chat.sendMessage(userMessage);
      
      response = result.response.text();
    } else {
      // Use a fallback response if the API key is not available
      const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
      response = fallbackResponses[randomIndex];
    }
    
    // Save the AI response to the database
    await storage.createChatMessage({
      userId,
      isUserMessage: false,
      content: response
    });
    
    return response;
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    
    // Use a fallback response in case of an error
    const fallbackResponse = "I'm having trouble connecting right now. Let's try a simple breathing exercise: breathe in for 4 counts, hold for 2, then exhale for 6. How does that feel?";
    
    // Save the fallback response to the database
    await storage.createChatMessage({
      userId,
      isUserMessage: false,
      content: fallbackResponse
    });
    
    return fallbackResponse;
  }
}
