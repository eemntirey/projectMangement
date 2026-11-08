import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { 
  extractMeetingActions, 
  generateStatusReport, 
  suggestPriorities, 
  generateProjectPlan, 
  generateEmbedding, 
  semanticSearchTasks, 
  dispatchWebhook 
} from './src/server/geminiService';

function flexiFlowApiPlugin(): Plugin {
  return {
    name: 'flexiflow-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlPath = req.url ? req.url.split('?')[0] : '';
        if (!urlPath.startsWith('/api/')) {
          return next();
        }

        // Read request body safely
        const getBody = (): Promise<any> => {
          if ((req as any).body) return Promise.resolve((req as any).body);
          if (req.readableEnded) return Promise.resolve({});
          return new Promise((resolve) => {
            const chunks: Buffer[] = [];
            req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            req.on('end', () => {
              try {
                const bodyStr = Buffer.concat(chunks).toString('utf-8');
                resolve(bodyStr ? JSON.parse(bodyStr) : {});
              } catch {
                resolve({});
              }
            });
            req.on('error', () => resolve({}));
          });
        };

        try {
          const body = await getBody();
          res.setHeader('Content-Type', 'application/json');

          // 1. Gemini Meeting extraction
          if (urlPath === '/api/gemini/extract-actions') {
            const { meetingText } = body;
            if (!meetingText) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Le texte de la réunion est requis.' }));
              return;
            }
            const result = await extractMeetingActions(meetingText);
            res.end(JSON.stringify(result));
            return;
          }

          // 2. Gemini Status report
          if (urlPath === '/api/gemini/status-report') {
            const { projectName, description, tasks } = body;
            const result = await generateStatusReport({ projectName, description, tasks: tasks || [] });
            res.end(JSON.stringify(result));
            return;
          }

          // 3. Gemini Priority suggestion
          if (urlPath === '/api/gemini/suggest-priorities') {
            const { tasks } = body;
            const result = await suggestPriorities(tasks || []);
            res.end(JSON.stringify(result));
            return;
          }

          // 4. Gemini Project Plan generation with Function Calling
          if (urlPath === '/api/gemini/generate-plan') {
            const { projectGoal, projectDescription, deadline, teamMembers, statuses } = body;
            if (!projectGoal) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'L\'objectif du projet est requis.' }));
              return;
            }
            const plan = await generateProjectPlan({
              projectGoal,
              projectDescription,
              deadline,
              teamMembers: teamMembers || [],
              statuses: statuses || []
            });
            res.end(JSON.stringify(plan));
            return;
          }

          // 5. Semantic Vector Search
          if (urlPath === '/api/gemini/semantic-search') {
            const { query, tasks } = body;
            if (!query) {
              res.end(JSON.stringify(tasks || []));
              return;
            }
            const ranked = await semanticSearchTasks(query, tasks || []);
            res.end(JSON.stringify(ranked));
            return;
          }

          // 6. Generate Single Embedding
          if (urlPath === '/api/gemini/embed') {
            const { text } = body;
            const embedding = await generateEmbedding(text || '');
            res.end(JSON.stringify({ embedding }));
            return;
          }

          // 7. Webhook Test & Dispatch
          if (urlPath === '/api/webhooks/test' || urlPath === '/api/webhooks/dispatch') {
            const { webhook, event, payload } = body;
            if (!webhook?.url) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'L\'URL du webhook est requise.' }));
              return;
            }
            const log = await dispatchWebhook(
              webhook,
              event || 'task.created',
              payload || { test: true, message: 'Ping de test FlexiFlow' }
            );
            res.end(JSON.stringify(log));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Endpoint non trouvé' }));
        } catch (error: any) {
          console.error('[FlexiFlow API Route Error]', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message || 'Erreur serveur FlexiFlow' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), flexiFlowApiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  }
});
