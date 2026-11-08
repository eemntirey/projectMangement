import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  extractMeetingActions, 
  generateStatusReport, 
  suggestPriorities, 
  generateProjectPlan, 
  generateEmbedding, 
  semanticSearchTasks, 
  dispatchWebhook 
} from './src/server/geminiService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Gemini extract actions
app.post('/api/gemini/extract-actions', async (req, res) => {
  try {
    const { meetingText } = req.body;
    if (!meetingText) {
      return res.status(400).json({ error: 'Le texte de la réunion est requis.' });
    }
    const result = await extractMeetingActions(meetingText);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/gemini/extract-actions:', error);
    return res.status(500).json({ error: error.message || 'Erreur Gemini' });
  }
});

// 2. Gemini status report
app.post('/api/gemini/status-report', async (req, res) => {
  try {
    const { projectName, description, tasks } = req.body;
    const result = await generateStatusReport({ projectName, description, tasks: tasks || [] });
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/gemini/status-report:', error);
    return res.status(500).json({ error: error.message || 'Erreur Gemini' });
  }
});

// 3. Gemini suggest priorities
app.post('/api/gemini/suggest-priorities', async (req, res) => {
  try {
    const { tasks } = req.body;
    const result = await suggestPriorities(tasks || []);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/gemini/suggest-priorities:', error);
    return res.status(500).json({ error: error.message || 'Erreur Gemini' });
  }
});

// 4. Gemini Project Plan generator with Function Calling
app.post('/api/gemini/generate-plan', async (req, res) => {
  try {
    const { projectGoal, projectDescription, deadline, teamMembers, statuses } = req.body;
    if (!projectGoal) {
      return res.status(400).json({ error: 'L\'objectif du projet est requis.' });
    }
    const plan = await generateProjectPlan({
      projectGoal,
      projectDescription,
      deadline,
      teamMembers: teamMembers || [],
      statuses: statuses || []
    });
    return res.json(plan);
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-plan:', error);
    return res.status(500).json({ error: error.message || 'Erreur Gemini' });
  }
});

// 5. Semantic Vector Search
app.post('/api/gemini/semantic-search', async (req, res) => {
  try {
    const { query, tasks } = req.body;
    if (!query) {
      return res.json(tasks || []);
    }
    const ranked = await semanticSearchTasks(query, tasks || []);
    return res.json(ranked);
  } catch (error: any) {
    console.error('Error in /api/gemini/semantic-search:', error);
    return res.status(500).json({ error: error.message || 'Erreur Gemini' });
  }
});

// 6. Embed Content
app.post('/api/gemini/embed', async (req, res) => {
  try {
    const { text } = req.body;
    const embedding = await generateEmbedding(text || '');
    return res.json({ embedding });
  } catch (error: any) {
    console.error('Error in /api/gemini/embed:', error);
    return res.status(500).json({ error: error.message || 'Erreur Gemini' });
  }
});

// 7. Webhooks test & dispatch
app.post('/api/webhooks/test', async (req, res) => {
  try {
    const { webhook, event, payload } = req.body;
    if (!webhook?.url) {
      return res.status(400).json({ error: 'L\'URL du webhook est requise.' });
    }
    const log = await dispatchWebhook(
      webhook,
      event || 'task.created',
      payload || { test: true, message: 'Ping de test FlexiFlow' }
    );
    return res.json(log);
  } catch (error: any) {
    console.error('Error in /api/webhooks/test:', error);
    return res.status(500).json({ error: error.message || 'Erreur Webhook' });
  }
});

app.post('/api/webhooks/dispatch', async (req, res) => {
  try {
    const { webhook, event, payload } = req.body;
    if (!webhook?.url) {
      return res.status(400).json({ error: 'L\'URL du webhook est requise.' });
    }
    const log = await dispatchWebhook(webhook, event, payload);
    return res.json(log);
  } catch (error: any) {
    console.error('Error in /api/webhooks/dispatch:', error);
    return res.status(500).json({ error: error.message || 'Erreur Webhook' });
  }
});

// Serve frontend static build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FlexiFlow production server running on port ${PORT}`);
});
