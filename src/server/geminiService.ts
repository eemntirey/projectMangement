import { GoogleGenAI, Type } from '@google/genai';
import { GeneratedProjectPlan, WebhookConfig, WebhookEvent, WebhookLog } from '../types';

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('[Gemini] Attention: GEMINI_API_KEY n\'est pas configurée dans l\'environnement.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// 1. Agent IA de Planification Autonome avec Function Calling
export async function generateProjectPlan(params: {
  projectGoal: string;
  projectDescription?: string;
  deadline?: string;
  teamMembers: Array<{ uid: string; name: string; role?: string }>;
  statuses?: Array<{ id: string; label: string }>;
}): Promise<GeneratedProjectPlan> {
  const ai = getGeminiClient();

  const prompt = `Tu es un Lead Agile & Technical Architect expérimenté.
Construis un plan de projet exhaustif et réaliste pour atteindre l'objectif suivant :
Objectif principal : "${params.projectGoal}"
Description additionnelle : ${params.projectDescription || 'Non spécifiée'}
Date cible / jalon : ${params.deadline || 'Non fixée'}

Membres de l'équipe disponibles pour l'attribution des tâches :
${JSON.stringify(params.teamMembers, null, 2)}

Statuts du projet :
${JSON.stringify(params.statuses || [], null, 2)}

Directives :
1. Découpe le projet en 2 à 4 phases logiques (ex: Cadrage & Specs, Réalisation / Tech, QA & Recette, Déploiement & Lancement).
2. Pour chaque tâche, fournis un titre clair orienté action, une description technique ou fonctionnelle, la phase correspondante, le nom du responsable le plus qualifié parmi l'équipe, une priorité (urgent, high, medium, low), une estimation réaliste en heures (entre 4h et 40h), 1 à 3 étiquettes (ex: Backend, Design, DevOps, QA), et les dépendances (indices 0-based des tâches dont elle dépend).
3. Utilise obligatoirement la fonction create_project_plan pour retourner le plan structuré.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [
          {
            functionDeclarations: [
              {
                name: 'create_project_plan',
                description: 'Enregistre le plan de projet complet découpé en phases et tâches structurées.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    summary: {
                      type: Type.STRING,
                      description: 'Synthèse globale de la stratégie et de la trajectoire du projet.'
                    },
                    phases: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Noms des phases du projet.'
                    },
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING, description: 'Titre de la tâche' },
                          description: { type: Type.STRING, description: 'Description détaillée' },
                          phase: { type: Type.STRING, description: 'Phase d\'appartenance' },
                          suggestedAssigneeName: { type: Type.STRING, description: 'Nom du membre assigné' },
                          priority: {
                            type: Type.STRING,
                            description: 'Priorité',
                            enum: ['urgent', 'high', 'medium', 'low']
                          },
                          estimateHours: { type: Type.NUMBER, description: 'Estimation en heures' },
                          labels: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'Étiquettes'
                          },
                          dependsOnIndex: {
                            type: Type.ARRAY,
                            items: { type: Type.INTEGER },
                            description: 'Indices (0-based) des tâches préalables'
                          }
                        },
                        required: ['title', 'description', 'priority', 'estimateHours']
                      }
                    }
                  },
                  required: ['summary', 'phases', 'tasks']
                }
              }
            ]
          }
        ]
      }
    });

    // Check functionCalls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.args) {
        return call.args as unknown as GeneratedProjectPlan;
      }
    }

    // Fallback: try parsing text if JSON format was emitted
    const text = response.text || '';
    if (text) {
      const cleaned = text.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.tasks) return parsed;
    }

    return generateFallbackProjectPlan(params);
  } catch (err: any) {
    console.warn('Gemini generateProjectPlan fallback triggered:', err.message);
    return generateFallbackProjectPlan(params);
  }
}

function generateFallbackProjectPlan(params: {
  projectGoal: string;
  projectDescription?: string;
  deadline?: string;
  teamMembers?: Array<any>;
}): GeneratedProjectPlan {
  const memberNames = (params.teamMembers && params.teamMembers.length > 0)
    ? params.teamMembers.map(m => typeof m === 'string' ? m : (m.name || m.displayName || 'Sophie Martin'))
    : ['Sophie Martin', 'Alexandre Dupont', 'Léa Bernard'];
  const goal = params.projectGoal || 'Lancement v2.0';

  return {
    summary: `Plan de projet décomposé en 3 phases agiles pour atteindre : "${goal}".`,
    planSummary: `Plan stratégique : ${goal}`,
    estimatedDuration: params.deadline || '4 semaines',
    phases: [
      'Phase 1 - Cadrage & Architecture',
      'Phase 2 - Implémentation & Intégration',
      'Phase 3 - Validation, Recette & Déploiement'
    ],
    tasks: [
      {
        id: 'plan-task-1',
        title: `Cadrage fonctionnel et architecture technique : ${goal.substring(0, 45)}`,
        description: `Spécifications détaillées, découpage des flux et validation des contrats d'interface pour "${goal}".`,
        phase: 'Phase 1 - Cadrage & Architecture',
        suggestedAssignee: memberNames[0] || 'Sophie Martin',
        priority: 'high',
        estimateHours: 16,
        labels: ['Architecture', 'Cadrage'],
        dependencies: []
      },
      {
        id: 'plan-task-2',
        title: 'Mise en place du modèle de données et sécurité Firestore',
        description: 'Conception des collections, index Firestore, et renforcement des règles de sécurité ABAC.',
        phase: 'Phase 1 - Cadrage & Architecture',
        suggestedAssignee: memberNames[1] || 'Alexandre Dupont',
        priority: 'urgent',
        estimateHours: 12,
        labels: ['Backend', 'Sécurité'],
        dependencies: ['plan-task-1']
      },
      {
        id: 'plan-task-3',
        title: 'Développement des interfaces frontend et parcours utilisateur',
        description: 'Intégration responsive des composants avec Tailwind CSS, retours visuels et gestion des états.',
        phase: 'Phase 2 - Implémentation & Intégration',
        suggestedAssignee: memberNames[2] || 'Léa Bernard',
        priority: 'medium',
        estimateHours: 24,
        labels: ['Frontend', 'UI/UX'],
        dependencies: ['plan-task-1']
      },
      {
        id: 'plan-task-4',
        title: 'Implémentation des APIs backend et webhooks sortants',
        description: 'Développement des points de terminaison, signature HMAC des événements et gestion des timeouts.',
        phase: 'Phase 2 - Implémentation & Intégration',
        suggestedAssignee: memberNames[1] || 'Alexandre Dupont',
        priority: 'high',
        estimateHours: 20,
        labels: ['Backend', 'Webhooks'],
        dependencies: ['plan-task-2']
      },
      {
        id: 'plan-task-5',
        title: 'Tests automatisés, audit de sécurité OWASP & tests de charge',
        description: 'Exécution de la suite de tests Playwright, audit d\'injection et vérification de la scalabilité.',
        phase: 'Phase 3 - Validation, Recette & Déploiement',
        suggestedAssignee: memberNames[0] || 'Sophie Martin',
        priority: 'urgent',
        estimateHours: 18,
        labels: ['QA', 'Performance'],
        dependencies: ['plan-task-3', 'plan-task-4']
      },
      {
        id: 'plan-task-6',
        title: 'Mise en production Cloud Run et configuration du monitoring',
        description: 'Déploiement du conteneur Cloud Run, configuration des sondes de santé et des alertes Sentry.',
        phase: 'Phase 3 - Validation, Recette & Déploiement',
        suggestedAssignee: memberNames[1] || 'Alexandre Dupont',
        priority: 'high',
        estimateHours: 8,
        labels: ['DevOps', 'CloudRun'],
        dependencies: ['plan-task-5']
      }
    ]
  };
}

// 2. Vector Embeddings & Recherche Sémantique
export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: text
    });
    const res = response as any;
    return res.embedding?.values || res.embeddings?.[0]?.values || [];
  } catch (err: any) {
    console.warn('Gemini generateEmbedding warning:', err.message);
    // Simple deterministic pseudo-vector fallback if API key or model is throttled
    return generateLocalFallbackEmbedding(text);
  }
}

// Cosine similarity computation
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA?.length || !vecB?.length) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Semantic Search over Tasks
export async function semanticSearchTasks(
  query: string, 
  tasks: Array<{ id: string; title: string; description: string; labels?: string[]; embedding?: number[] }>
) {
  if (!query.trim()) return tasks.map(t => ({ ...t, similarityScore: 1 }));

  const queryVector = await generateEmbedding(query);

  const scoredTasks = await Promise.all(
    tasks.map(async (t) => {
      let taskVector = t.embedding;
      if (!taskVector || taskVector.length === 0) {
        const textToEmbed = `${t.title}. ${t.description || ''} ${(t.labels || []).join(' ')}`;
        taskVector = await generateEmbedding(textToEmbed);
      }
      const score = cosineSimilarity(queryVector, taskVector);
      return {
        ...t,
        embedding: taskVector,
        similarityScore: Math.round(score * 100) / 100
      };
    })
  );

  // Return tasks sorted by semantic similarity score
  return scoredTasks.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
}

// Local fallback embedding for offline / test resilience
function generateLocalFallbackEmbedding(text: string, dimensions = 64): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(dimensions).fill(0);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let c = 0; c < word.length; c++) {
      const code = word.charCodeAt(c);
      const idx = (code * 31 + c) % dimensions;
      vector[idx] += 1 / (i + 1);
    }
  }
  // Normalize
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(v => v / norm);
}

// 3. Moteur de Webhooks Sortants (Service de dispatch et logs)
export async function dispatchWebhook(
  webhook: WebhookConfig,
  event: WebhookEvent,
  payload: Record<string, any>
): Promise<WebhookLog> {
  const startTime = Date.now();
  const logId = `whlog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  const envelope = {
    event,
    timestamp: new Date().toISOString(),
    projectId: webhook.projectId,
    webhookId: webhook.id,
    data: payload
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'FlexiFlow-Webhooks/1.0',
    'X-FlexiFlow-Event': event,
    'X-FlexiFlow-Delivery': logId
  };

  if (webhook.secret) {
    headers['X-FlexiFlow-Secret'] = webhook.secret;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(envelope),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const durationMs = Date.now() - startTime;
    const isSuccess = res.ok;
    const textSnippet = await res.text().catch(() => '').then(t => t.slice(0, 300));

    return {
      id: logId,
      webhookId: webhook.id,
      webhookName: webhook.name,
      projectId: webhook.projectId,
      event,
      url: webhook.url,
      status: isSuccess ? 'success' : 'failed',
      httpStatus: res.status,
      durationMs,
      payload: envelope,
      responseSnippet: textSnippet || `HTTP ${res.status} ${res.statusText}`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    return {
      id: logId,
      webhookId: webhook.id,
      webhookName: webhook.name,
      projectId: webhook.projectId,
      event,
      url: webhook.url,
      status: 'failed',
      durationMs,
      payload: envelope,
      responseSnippet: err.message || 'Erreur réseau ou délai d\'attente dépassé (timeout)',
      timestamp: new Date().toISOString()
    };
  }
}

// Existing Meeting Actions
export async function extractMeetingActions(meetingText: string) {
  const ai = getGeminiClient();
  const prompt = `Tu es un assistant expert en gestion de projet agile.
Analyse le compte rendu de réunion brut ci-dessous et extrais la liste de toutes les actions concrètes et tâches à réaliser.
Pour chaque action, fournis :
1. "title": Titre clair, précis et orienté action
2. "description": Détails, contexte ou critères de réussite
3. "assigneeName": Nom du responsable si mentionné ou suggéré, sinon null
4. "dueDate": Date limite estimée (format YYYY-MM-DD) si mentionnée ou déduite, sinon null
5. "priority": "low" | "medium" | "high" | "urgent"
6. "isRisk": true si l'action n'a pas de responsable identifié ou pas de date limite (ou présente un risque pour le projet)
7. "riskReason": explication si isRisk est true (ex: "Aucun responsable assigné", "Date critique non définie")

Texte de la réunion :
"""
${meetingText}
"""

Réponds STRICTEMENT par un objet JSON valide avec la clé "actions", sans balises Markdown supplémentaires :
{
  "summary": "Court résumé en 2 phrases des points clés de la réunion",
  "actions": [
    {
      "title": "string",
      "description": "string",
      "assigneeName": "string | null",
      "dueDate": "string | null",
      "priority": "low | medium | high | urgent",
      "isRisk": true,
      "riskReason": "string | null"
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (err: any) {
    console.error('Gemini extractMeetingActions error:', err);
    throw new Error(err.message || 'Erreur lors de l\'analyse du compte rendu avec Gemini');
  }
}

// Existing Status Report
export async function generateStatusReport(projectData: {
  projectName: string;
  description?: string;
  tasks: Array<{
    title: string;
    statusLabel: string;
    statusType: string;
    priority: string;
    dueDate?: string;
    assigneeNames?: string[];
  }>;
}) {
  const ai = getGeminiClient();
  const prompt = `Tu es un Directeur de Projet senior.
Génère un rapport d'avancement professionnel et structuré au format Markdown pour le projet "${projectData.projectName}".
Description du projet : ${projectData.description || 'Non précisée'}

Données actuelles des tâches :
${JSON.stringify(projectData.tasks, null, 2)}

Directives pour le rapport :
1. Titre & Synthèse exécutive (vue d'ensemble de l'avancement, taux de complétion)
2. Tâches terminées récemment (victoires clés)
3. Tâches en cours et jalons critiques
4. Tâches en retard ou bloquantes
5. Analyse des risques & Points de vigilance
6. Recommandations stratégiques et prochaines étapes prioritaires

Le ton doit être constructif, professionnel et orienté résultats. Rédige en français soigné au format Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return {
      reportMarkdown: response.text || '# Rapport d\'avancement\n\nAucune donnée générée.'
    };
  } catch (err: any) {
    console.error('Gemini generateStatusReport error:', err);
    throw new Error(err.message || 'Erreur lors de la génération du rapport avec Gemini');
  }
}

// Existing Suggest Priorities
export async function suggestPriorities(tasks: Array<{
  id: string;
  title: string;
  statusLabel: string;
  statusType: string;
  priority: string;
  dueDate?: string;
  dependencyIds?: string[];
  assigneeNames?: string[];
}>) {
  const ai = getGeminiClient();
  const prompt = `Tu es un Scrum Master / Agile Coach d'élite.
Analyse les tâches ci-dessous d'un projet et suggère un ordre de priorité optimal en fonction des dates d'échéance, des blocages/dépendances, de la criticité et de l'équilibrage de charge.

Tâches :
${JSON.stringify(tasks, null, 2)}

Réponds STRICTEMENT par un JSON valide :
{
  "analysis": "Explication générale de la stratégie de priorisation",
  "recommendedOrder": [
    {
      "taskId": "id de la tâche",
      "recommendedRank": 1,
      "suggestedPriority": "urgent | high | medium | low",
      "rationale": "Pourquoi cette tâche doit être traitée à ce rang"
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (err: any) {
    console.error('Gemini suggestPriorities error:', err);
    throw new Error(err.message || 'Erreur lors de la suggestion des priorités');
  }
}
