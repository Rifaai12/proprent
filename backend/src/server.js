import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import apiRoutes from './routes/apiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { AutomationService } from './services/automationService.js';
import { db } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Production & Local CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://proprent-xfl0.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser calls (like curl, mobile, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Public Health & Diagnostics Endpoints (Must be before authenticated routes)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Property Rent Automated Calling & Collection Engine',
    database_engine: db.isPostgres ? 'PostgreSQL' : 'Local File Fallback',
    time: new Date().toISOString()
  });
});

// Dedicated Database Health & Connectivity Endpoint
app.get('/api/health/db', async (req, res) => {
  try {
    const health = await db.checkHealth();
    res.json({ success: true, ...health });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Setup Automated Background Cron Scheduler (Runs every day at 9:00 AM)
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON SCHEDULER] Running daily automated rent reminder and caller ID rotation engine...');
  try {
    const results = await AutomationService.runAutomationCycle();
    console.log(`[CRON SCHEDULER] Daily cycle completed. Processed ${results.length} actions.`);
  } catch (err) {
    console.error('[CRON SCHEDULER] Error running automation cycle:', err);
  }
});

// Start Server with Database Initialization
async function startServer() {
  try {
    await db.init();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 Property Rent Backend running on http://0.0.0.0:${PORT}`);
      console.log(`🗄️ Database Engine: ${db.isPostgres ? 'PostgreSQL (Persistent)' : 'Local File Fallback'}`);
      console.log(`📞 Anti-Blocking Caller ID Pool & Voice Engine Ready`);
      console.log(`⏰ Daily Automation Scheduler Active (09:00 AM Cron)`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to start server due to database initialization error:', err);
    process.exit(1);
  }
}

startServer();
