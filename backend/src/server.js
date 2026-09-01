import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import apiRoutes from './routes/apiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { AutomationService } from './services/automationService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Property Rent Automated Calling & Collection Engine',
    time: new Date().toISOString()
  });
});

// Setup Automated Background Cron Scheduler (Runs every day at 9:00 AM)
// Also configured to run hourly checks in development mode
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON SCHEDULER] Running daily automated rent reminder and caller ID rotation engine...');
  try {
    const results = await AutomationService.runAutomationCycle();
    console.log(`[CRON SCHEDULER] Daily cycle completed. Processed ${results.length} actions.`);
  } catch (err) {
    console.error('[CRON SCHEDULER] Error running automation cycle:', err);
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Property Rent Backend API running on http://0.0.0.0:${PORT}`);
  console.log(`📞 Anti-Blocking Caller ID Pool & Voice Engine Ready`);
  console.log(`⏰ Daily Automation Scheduler Active (09:00 AM Cron)`);
  console.log(`====================================================`);
});
