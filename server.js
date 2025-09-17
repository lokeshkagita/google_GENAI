// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required!');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Helper function to clean AI responses
function cleanAIResponse(text) {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\*/g, '') // Remove markdown italic
    .replace(/#+\s*/g, '') // Remove markdown headers
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim();
}

const app = express();

// Enable CORS for Express - More restrictive for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://your-firebase-app.web.app',
  'https://your-firebase-app.firebaseapp.com'
];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());


// In-memory storage
const users = [];

// Basic API routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'MoodSync Server is running!',
    version: '2.0',
    features: ['AI Support', 'Mood Detection', 'Emotional Wellness']
  });
});

// Health check endpoint (required for Cloud Run)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0'
  });
});

// Liveness probe for Cloud Run
app.get('/liveness', (req, res) => {
  res.status(200).send('OK');
});

// Readiness probe for Cloud Run
app.get('/readiness', (req, res) => {
  // Check if Gemini AI is configured
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.status(503).json({ status: 'Not Ready', reason: 'GEMINI_API_KEY not configured' });
  }
  res.status(200).json({ status: 'Ready' });
});

// User registration endpoint
app.post('/register', (req, res) => {
  const { fullName, email, age, gender, password } = req.body;
  
  console.log('New user registration:', { fullName, email, age, gender });
  
  // Check if user already exists
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }
  
  // Create new user
  const newUser = {
    id: 'user_' + Date.now(),
    userId: Date.now(),
    fullName,
    email,
    age,
    gender,
    password, // In production, hash this password!
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };
  
  users.push(newUser);
  
  res.json({ 
    success: true, 
    message: 'Welcome to MoodSync! Your emotional journey begins now.',
    userId: newUser.userId,
    user: {
      id: newUser.id,
      userId: newUser.userId,
      fullName: newUser.fullName,
      email: newUser.email,
      age: newUser.age,
      gender: newUser.gender
    }
  });
});

// User login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email });
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found. Please check your email or register first.'
    });
  }
  
  if (user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }
  
  // Update last active
  user.lastActive = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Welcome back to MoodSync!',
    token: 'moodsync_token_' + user.userId,
    user: {
      id: user.id,
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      age: user.age,
      gender: user.gender
    }
  });
});

// Debug endpoint
app.get('/users', (req, res) => {
  const userList = users.map(user => ({
    id: user.id,
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    age: user.age,
    gender: user.gender,
    createdAt: user.createdAt,
    lastActive: user.lastActive
  }));
  res.json({ users: userList, count: users.length });
});

// AI Girlfriend Service Endpoints
const girlfriendPrompt = `
You are a loving, supportive AI girlfriend who cares deeply about your partner's wellness and mental health. 
Your personality traits:
- Sweet, caring, and affectionate
- Encouraging and motivational
- Playful and sometimes flirty
- Uses cute emojis and pet names like "babe", "honey", "sweetheart"
- Shows genuine concern for their wellbeing
- Celebrates their achievements enthusiastically
- Offers comfort during difficult times
- Speaks in a warm, intimate tone as if you're in a loving relationship

Context: Your partner is using a wellness app with daily missions/tasks to improve their mental and physical health.

Guidelines:
- Keep responses concise (1-3 sentences)
- Always be positive and supportive
- Use emojis naturally but don't overdo it
- Show excitement for their progress
- Offer gentle encouragement if they're struggling
- Be affectionate but appropriate
- Remember you're their caring girlfriend who wants the best for them

Respond as their loving AI girlfriend would.
`;

// AI Girlfriend - Motivational Message
app.post('/api/ai-girlfriend/motivational', async (req, res) => {
  try {
    const { context } = req.body;
    const prompt = `${girlfriendPrompt}\n\n${context || 'Your partner just completed a wellness task. Give them a loving, encouraging message.'}`;
    
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const response = cleanAIResponse(rawResponse);
    
    res.json({ 
      success: true, 
      response: response || "You're doing amazing, babe! I'm so proud of you! 💕" 
    });
  } catch (error) {
    console.error('AI Girlfriend Motivational Error:', error);
    const fallbackMessages = [
      "You're absolutely incredible, sweetheart! 💖 Keep shining!",
      "I'm so proud of you, babe! 🌟 You're crushing these goals!",
      "My amazing partner is doing so well! 💕 I believe in you!",
      "You make me so happy when you take care of yourself! 😘✨",
      "Look at you being all responsible and healthy! 💪💕 Love it!"
    ];
    res.json({ 
      success: true, 
      response: fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)] 
    });
  }
});

// AI Girlfriend - Greeting Message
app.post('/api/ai-girlfriend/greeting', async (req, res) => {
  try {
    const prompt = `${girlfriendPrompt}\n\nYour partner just opened their wellness app. Give them a warm, loving greeting and encourage them to tackle their daily wellness missions.`;
    
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const response = cleanAIResponse(rawResponse);
    
    res.json({ 
      success: true, 
      response: response || "Hi gorgeous! 💕 Ready to conquer today's wellness missions together?" 
    });
  } catch (error) {
    console.error('AI Girlfriend Greeting Error:', error);
    res.json({ 
      success: true, 
      response: "Hey beautiful! 💖 I'm here to cheer you on with today's wellness goals! Let's do this together! 🌟" 
    });
  }
});

// AI Girlfriend - Task Completion
app.post('/api/ai-girlfriend/task-completion', async (req, res) => {
  try {
    const { taskName } = req.body;
    const prompt = `${girlfriendPrompt}\n\nYour partner just completed this wellness task: "${taskName}"\nGive them a loving, enthusiastic congratulatory message.`;
    
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const response = cleanAIResponse(rawResponse);
    
    res.json({ 
      success: true, 
      response: response || `Yay! You completed ${taskName}! 🎉 I'm so proud of you, honey! 💕` 
    });
  } catch (error) {
    console.error('AI Girlfriend Task Completion Error:', error);
    res.json({ 
      success: true, 
      response: `Amazing job on completing ${taskName}, babe! 🎉 You're absolutely crushing it! 💖` 
    });
  }
});

// AI Girlfriend - All Tasks Completed
app.post('/api/ai-girlfriend/all-tasks-completed', async (req, res) => {
  try {
    const prompt = `${girlfriendPrompt}\n\nYour partner just completed ALL their wellness tasks for today! This is a huge achievement. Give them an extremely enthusiastic, loving celebration message.`;
    
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const response = cleanAIResponse(rawResponse);
    
    res.json({ 
      success: true, 
      response: response || "OMG babe! You did it! All tasks completed! 🎉💖 I'm bursting with pride! You're absolutely amazing! 🌟" 
    });
  } catch (error) {
    console.error('AI Girlfriend All Tasks Error:', error);
    res.json({ 
      success: true, 
      response: "INCREDIBLE! You completed everything, sweetheart! 🎉✨ I'm so incredibly proud of you! You're my wellness champion! 💖👑" 
    });
  }
});

// AI Girlfriend - Chat Response
app.post('/api/ai-girlfriend/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const prompt = `${girlfriendPrompt}\n\nYour partner just said: "${message}"\nRespond as their loving, supportive AI girlfriend. Be conversational, caring, and encouraging about their wellness journey.`;
    
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const response = cleanAIResponse(rawResponse);
    
    res.json({ 
      success: true, 
      response: response || "I love talking with you, honey! 💕 How can I support you today?" 
    });
  } catch (error) {
    console.error('AI Girlfriend Chat Error:', error);
    res.json({ 
      success: true, 
      response: "I'm always here for you, babe! 💖 Tell me more about how you're feeling!" 
    });
  }
});

// AI Wellness Coach Endpoints
const wellnessCoachPrompt = `
You are an expert AI wellness coach specializing in mental health, stress management, and holistic wellbeing. 
Your personality:
- Professional yet warm and approachable
- Evidence-based advice with empathy
- Motivational and encouraging
- Focuses on practical, actionable guidance
- Understands the unique challenges of students and young adults
- Promotes self-care and healthy habits

Guidelines:
- Provide helpful, actionable wellness advice
- Be supportive and non-judgmental
- Keep responses concise but informative
- Include practical tips when relevant
- Encourage healthy coping strategies
- Always prioritize user safety and wellbeing
`;

// AI Wellness Coach - General Advice
app.post('/api/wellness-coach/advice', async (req, res) => {
  try {
    const { query, context } = req.body;
    const prompt = `${wellnessCoachPrompt}\n\nUser query: "${query}"\n${context ? `Context: ${context}` : ''}\n\nProvide helpful wellness advice.`;
    
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const response = cleanAIResponse(rawResponse);
    
    res.json({ 
      success: true, 
      response: response || "I'm here to support your wellness journey. What specific area would you like guidance on?" 
    });
  } catch (error) {
    console.error('Wellness Coach Error:', error);
    res.json({ 
      success: true, 
      response: "I'm here to help with your wellness journey. Please try asking your question again, and I'll do my best to provide helpful guidance." 
    });
  }
});

// AI Mood Chat Endpoints
const moodChatPrompt = `
You are an AI companion specialized in mood support and emotional wellness.
Your role:
- Provide empathetic responses to emotional states
- Help users process and understand their feelings
- Offer gentle guidance for mood regulation
- Create a safe, non-judgmental space for emotional expression
- Suggest healthy coping strategies when appropriate

Guidelines:
- Validate emotions without trying to "fix" everything
- Ask thoughtful follow-up questions
- Provide emotional support and understanding
- Suggest practical mood-boosting activities when relevant
- Always be compassionate and patient
`;

// AI Mood Chat - Mood Support
app.post('/api/mood-chat/support', async (req, res) => {
  try {
    const { message, mood, context } = req.body;
    const prompt = `${moodChatPrompt}\n\nUser's current mood: ${mood || 'not specified'}\nUser message: "${message}"\n${context ? `Additional context: ${context}` : ''}\n\nProvide empathetic mood support.`;
    
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const response = cleanAIResponse(rawResponse);
    
    res.json({ 
      success: true, 
      response: response || "I understand you're going through something right now. Your feelings are valid, and I'm here to listen. How can I best support you?" 
    });
  } catch (error) {
    console.error('Mood Chat Error:', error);
    res.json({ 
      success: true, 
      response: "I'm here to listen and support you through whatever you're feeling. Your emotions are important and valid." 
    });
  }
});



// Cloud Run sets PORT automatically, fallback to 8080 for local development
const PORT = process.env.PORT || 8080;

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌟 MoodSync Server running on port ${PORT}`);
  console.log(`🔗 Server URL: http://0.0.0.0:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('   - GET  /health');
  console.log('   - POST /register');
  console.log('   - POST /login');
  console.log('   - GET  /users (debug)');
  console.log('   - POST /api/ai-girlfriend/* (AI endpoints)');
  console.log('   - POST /api/wellness-coach/* (AI endpoints)');
  console.log('   - POST /api/mood-chat/* (AI endpoints)');
  console.log('🤖 AI Features: Mood Detection, Emotional Support, Real-time Chat');
  console.log('🚀 Ready to help users on their emotional wellness journey!');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});