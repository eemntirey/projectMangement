import { Project, Workflow, CustomFieldDefinition, Task, Automation, UserProfile, Organization, Comment } from '../types';

export const DEMO_USERS: UserProfile[] = [
  {
    uid: 'user-sophie',
    email: 'sophie.martin@flexiflow.app',
    displayName: 'Sophie Martin',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'user-alex',
    email: 'alexandre.dupont@flexiflow.app',
    displayName: 'Alexandre Dupont',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'manager',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'user-lea',
    email: 'lea.bernard@flexiflow.app',
    displayName: 'Léa Bernard',
    photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    role: 'member',
    createdAt: new Date().toISOString()
  }
];

export const DEMO_ORG: Organization = {
  id: 'org-flexiflow-inc',
  name: 'Acme & Co Innovation',
  ownerId: 'user-sophie',
  createdAt: new Date().toISOString()
};

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-product-launch',
    orgId: 'org-flexiflow-inc',
    name: '🚀 Lancement Produit v2.0',
    description: 'Organisation globale du lancement commercial et technique de notre nouvelle plateforme SaaS.',
    color: '#6366f1',
    status: 'active',
    priority: 'urgent',
    startDate: '2026-11-01',
    endDate: '2026-12-15',
    createdBy: 'user-sophie',
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-08T10:00:00Z',
    templateId: 'scrum',
    memberIds: ['user-sophie', 'user-alex', 'user-lea']
  },
  {
    id: 'proj-client-website',
    orgId: 'org-flexiflow-inc',
    name: '🎨 Refonte Site Web Client Horizon',
    description: 'Projet d\'agence avec workflow de validation client étape par étape et livrables créatifs.',
    color: '#0ea5e9',
    status: 'active',
    priority: 'high',
    startDate: '2026-11-05',
    endDate: '2026-12-20',
    createdBy: 'user-alex',
    createdAt: '2026-11-05T08:30:00Z',
    updatedAt: '2026-11-08T09:15:00Z',
    templateId: 'client-agency',
    memberIds: ['user-sophie', 'user-alex', 'user-lea']
  }
];

export const DEMO_WORKFLOWS: Record<string, Workflow> = {
  'proj-product-launch': {
    id: 'wf-product-launch',
    projectId: 'proj-product-launch',
    name: 'Workflow Produit SaaS',
    statuses: [
      { id: 'st-backlog', label: 'À faire', color: '#94a3b8', type: 'not_started', order: 0 },
      { id: 'st-progress', label: 'En cours', color: '#3b82f6', type: 'in_progress', order: 1 },
      { id: 'st-review', label: 'En revue', color: '#f59e0b', type: 'in_progress', order: 2 },
      { id: 'st-blocked', label: 'Bloqué', color: '#ef4444', type: 'blocked', order: 3 },
      { id: 'st-done', label: 'Terminé', color: '#10b981', type: 'completed', order: 4 }
    ]
  },
  'proj-client-website': {
    id: 'wf-client-website',
    projectId: 'proj-client-website',
    name: 'Workflow Agence Client',
    statuses: [
      { id: 'st-brief', label: 'Brief & Cadrage', color: '#8b5cf6', type: 'not_started', order: 0 },
      { id: 'st-design', label: 'Maquettes Figma', color: '#ec4899', type: 'in_progress', order: 1 },
      { id: 'st-client-val', label: 'Validation Client', color: '#f97316', type: 'in_progress', order: 2 },
      { id: 'st-dev', label: 'Développement', color: '#06b6d4', type: 'in_progress', order: 3 },
      { id: 'st-delivered', label: 'Recette & Livré', color: '#10b981', type: 'completed', order: 4 }
    ]
  }
};

export const DEMO_CUSTOM_FIELDS: Record<string, CustomFieldDefinition[]> = {
  'proj-product-launch': [
    {
      id: 'cf-environment',
      projectId: 'proj-product-launch',
      name: 'Environnement Cible',
      type: 'select',
      options: ['Production', 'Staging', 'Sandbox', 'Tous'],
      required: true,
      order: 0
    },
    {
      id: 'cf-impact',
      projectId: 'proj-product-launch',
      name: 'Impact Business',
      type: 'select',
      options: ['Faible', 'Moyen', 'Majeur', 'Critique'],
      required: false,
      order: 1
    },
    {
      id: 'cf-demo-url',
      projectId: 'proj-product-launch',
      name: 'Lien Démo / PR',
      type: 'url',
      required: false,
      order: 2
    }
  ],
  'proj-client-website': [
    {
      id: 'cf-deliverable',
      projectId: 'proj-client-website',
      name: 'Livrable Requis',
      type: 'text',
      required: true,
      order: 0
    },
    {
      id: 'cf-approved',
      projectId: 'proj-client-website',
      name: 'Approbation Client Reçue',
      type: 'checkbox',
      required: false,
      order: 1
    }
  ]
};

export const DEMO_TASKS: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-product-launch',
    orgId: 'org-flexiflow-inc',
    title: 'Finaliser l\'intégration du paiement Stripe et gestion des abonnements',
    description: 'Vérifier les webhooks pour le renouvellement automatique, les échecs de paiement et les factures PDF.',
    statusId: 'st-progress',
    priority: 'urgent',
    assigneeIds: ['user-alex'],
    creatorId: 'user-sophie',
    dueDate: '2026-11-14',
    startDate: '2026-11-06',
    labels: ['Billing', 'Sécurité', 'Backend'],
    dependencyIds: [],
    customFields: {
      'cf-environment': 'Production',
      'cf-impact': 'Critique',
      'cf-demo-url': 'https://github.com/org/flexiflow/pull/42'
    },
    subtasks: [
      { id: 'sub-1', title: 'Tester les webhooks en sandbox', completed: true },
      { id: 'sub-2', title: 'Générer les templates d\'emails d\'échec', completed: false },
      { id: 'sub-3', title: 'Valider la conformité 3D Secure v2', completed: true }
    ],
    estimateHours: 16,
    createdAt: '2026-11-06T10:00:00Z',
    updatedAt: '2026-11-08T08:30:00Z'
  },
  {
    id: 'task-2',
    projectId: 'proj-product-launch',
    orgId: 'org-flexiflow-inc',
    title: 'Audit de sécurité & tests de pénétration OWASP',
    description: 'Vérifier les règles Firestore, l\'isolation des données multitenant et la protection contre les injections.',
    statusId: 'st-review',
    priority: 'high',
    assigneeIds: ['user-sophie'],
    creatorId: 'user-alex',
    dueDate: '2026-11-16',
    startDate: '2026-11-07',
    labels: ['Sécurité', 'Audit', 'DevOps'],
    dependencyIds: ['task-1'],
    customFields: {
      'cf-environment': 'Staging',
      'cf-impact': 'Critique'
    },
    subtasks: [
      { id: 'sub-4', title: 'Revue des Firestore security rules', completed: true },
      { id: 'sub-5', title: 'Scan automatisé des dépendances npm', completed: true },
      { id: 'sub-6', title: 'Rapport d\'audit rédigé', completed: false }
    ],
    estimateHours: 12,
    createdAt: '2026-11-06T11:00:00Z',
    updatedAt: '2026-11-08T09:00:00Z'
  },
  {
    id: 'task-3',
    projectId: 'proj-product-launch',
    orgId: 'org-flexiflow-inc',
    title: 'Conception de la campagne d\'emailing pour les 5 000 bêta-testeurs',
    description: 'Rédiger la séquence de 3 emails d\'annonce, préparer le code promo de lancement et configurer Brevo.',
    statusId: 'st-backlog',
    priority: 'medium',
    assigneeIds: ['user-lea'],
    creatorId: 'user-sophie',
    dueDate: '2026-11-20',
    labels: ['Marketing', 'Copywriting'],
    dependencyIds: [],
    customFields: {
      'cf-impact': 'Moyen'
    },
    subtasks: [
      { id: 'sub-7', title: 'Draft email 1 : Teaser fonctionnalités', completed: false },
      { id: 'sub-8', title: 'Draft email 2 : Offre early adopter', completed: false }
    ],
    estimateHours: 8,
    createdAt: '2026-11-07T08:00:00Z',
    updatedAt: '2026-11-07T08:00:00Z'
  },
  {
    id: 'task-4',
    projectId: 'proj-product-launch',
    orgId: 'org-flexiflow-inc',
    title: 'API Gateway : Résoudre la latence anormale sur le endpoint /analytics',
    description: 'Un goulot d\'étranglement a été détecté lors des tests de charge au-delà de 200 req/s.',
    statusId: 'st-blocked',
    priority: 'urgent',
    assigneeIds: ['user-alex', 'user-sophie'],
    creatorId: 'user-alex',
    dueDate: '2026-11-10',
    labels: ['Performance', 'Bug', 'Backend'],
    dependencyIds: [],
    customFields: {
      'cf-environment': 'Production',
      'cf-impact': 'Majeur'
    },
    subtasks: [
      { id: 'sub-9', title: 'Profiler les requêtes Firestore', completed: true },
      { id: 'sub-10', title: 'Mettre en cache Redis les compteurs', completed: false }
    ],
    estimateHours: 14,
    createdAt: '2026-11-07T14:30:00Z',
    updatedAt: '2026-11-08T07:45:00Z'
  },
  {
    id: 'task-5',
    projectId: 'proj-product-launch',
    orgId: 'org-flexiflow-inc',
    title: 'Mise en place de la documentation API publique (Swagger / OpenAPI)',
    description: 'Documentation exhaustive des endpoints pour permettre l\'intégration par nos partenaires clés.',
    statusId: 'st-done',
    priority: 'medium',
    assigneeIds: ['user-lea'],
    creatorId: 'user-sophie',
    dueDate: '2026-11-05',
    labels: ['Docs', 'API'],
    dependencyIds: [],
    customFields: {
      'cf-environment': 'Tous',
      'cf-impact': 'Moyen',
      'cf-demo-url': 'https://api.flexiflow.app/docs'
    },
    subtasks: [
      { id: 'sub-11', title: 'Générer le fichier openapi.json', completed: true },
      { id: 'sub-12', title: 'Déployer le portail de documentation', completed: true }
    ],
    estimateHours: 10,
    createdAt: '2026-11-02T10:00:00Z',
    updatedAt: '2026-11-05T17:00:00Z'
  },
  {
    id: 'task-6',
    projectId: 'proj-product-launch',
    orgId: 'org-flexiflow-inc',
    title: 'Optimisation du responsive design sur tablettes et mobiles',
    description: 'Ajuster les vues Kanban et Liste pour un défilement horizontal fluide et gestes tactiles.',
    statusId: 'st-progress',
    priority: 'high',
    assigneeIds: ['user-lea'],
    creatorId: 'user-alex',
    dueDate: '2026-11-18',
    labels: ['Frontend', 'UI/UX', 'Mobile'],
    dependencyIds: [],
    customFields: {
      'cf-environment': 'Staging',
      'cf-impact': 'Moyen'
    },
    subtasks: [
      { id: 'sub-13', title: 'Touch gestures sur colonnes Kanban', completed: true },
      { id: 'sub-14', title: 'Menu tiroir mobile', completed: false }
    ],
    estimateHours: 8,
    createdAt: '2026-11-07T16:00:00Z',
    updatedAt: '2026-11-08T08:10:00Z'
  },
  {
    id: 'task-7',
    projectId: 'proj-product-launch',
    orgId: 'org-flexiflow-inc',
    title: 'Tournage de la vidéo démo produit pour Product Hunt & LinkedIn',
    description: 'Vidéo dynamique de 90 secondes avec motion design et voix off présentant la flexibilité des workflows.',
    statusId: 'st-backlog',
    priority: 'medium',
    assigneeIds: ['user-sophie', 'user-lea'],
    creatorId: 'user-sophie',
    dueDate: '2026-11-25',
    labels: ['Marketing', 'Vidéo'],
    dependencyIds: ['task-6'],
    customFields: {
      'cf-impact': 'Majeur'
    },
    subtasks: [],
    estimateHours: 20,
    createdAt: '2026-11-08T06:00:00Z',
    updatedAt: '2026-11-08T06:00:00Z'
  },
  {
    id: 'task-8',
    projectId: 'proj-product-launch',
    orgId: 'org-flexiflow-inc',
    title: 'Configuration du monitoring temps réel (Sentry & Datadog)',
    description: 'Alerting automatisé sur Slack en cas d\'erreur 5xx ou de hausse anormale du temps de réponse.',
    statusId: 'st-done',
    priority: 'high',
    assigneeIds: ['user-alex'],
    creatorId: 'user-sophie',
    dueDate: '2026-11-04',
    labels: ['DevOps', 'Monitoring'],
    dependencyIds: [],
    customFields: {
      'cf-environment': 'Production',
      'cf-impact': 'Majeur'
    },
    subtasks: [
      { id: 'sub-15', title: 'SDK Sentry branché dans le frontend', completed: true },
      { id: 'sub-16', title: 'Canal #alerts-prod configuré', completed: true }
    ],
    estimateHours: 6,
    createdAt: '2026-11-01T14:00:00Z',
    updatedAt: '2026-11-04T16:30:00Z'
  },
  // Tasks for Client Website Project
  {
    id: 'task-cw-1',
    projectId: 'proj-client-website',
    orgId: 'org-flexiflow-inc',
    title: 'Atelier Wireframing et Architecture de l\'Information',
    description: 'Définir l\'arborescence du site, les parcours utilisateurs et les wireframes basse fidélité.',
    statusId: 'st-delivered',
    priority: 'high',
    assigneeIds: ['user-alex'],
    creatorId: 'user-alex',
    dueDate: '2026-11-07',
    labels: ['UX', 'Atelier'],
    dependencyIds: [],
    customFields: {
      'cf-deliverable': 'Figma Wireframes + Arborescence PDF',
      'cf-approved': true
    },
    createdAt: '2026-11-05T09:00:00Z',
    updatedAt: '2026-11-07T17:00:00Z'
  },
  {
    id: 'task-cw-2',
    projectId: 'proj-client-website',
    orgId: 'org-flexiflow-inc',
    title: 'Design System & Maquettes Haute-Fidélité Desktop/Mobile',
    description: 'Création des composants UI, typographie, palette chromatique et déclinaison des 8 pages clés.',
    statusId: 'st-design',
    priority: 'urgent',
    assigneeIds: ['user-lea'],
    creatorId: 'user-alex',
    dueDate: '2026-11-15',
    labels: ['UI Design', 'Figma'],
    dependencyIds: ['task-cw-1'],
    customFields: {
      'cf-deliverable': 'Fichier Figma complet avec prototypes interactifs',
      'cf-approved': false
    },
    createdAt: '2026-11-06T10:00:00Z',
    updatedAt: '2026-11-08T09:30:00Z'
  },
  {
    id: 'task-cw-3',
    projectId: 'proj-client-website',
    orgId: 'org-flexiflow-inc',
    title: 'Revue de validation avec le comité de direction client',
    description: 'Présentation des maquettes interactives pour recueil des feedbacks et validation formelle.',
    statusId: 'st-client-val',
    priority: 'high',
    assigneeIds: ['user-sophie', 'user-alex'],
    creatorId: 'user-alex',
    dueDate: '2026-11-19',
    labels: ['Client', 'Réunion'],
    dependencyIds: ['task-cw-2'],
    customFields: {
      'cf-deliverable': 'Compte-rendu d\'arbitrage signé',
      'cf-approved': false
    },
    createdAt: '2026-11-07T11:00:00Z',
    updatedAt: '2026-11-07T11:00:00Z'
  }
];

export const DEMO_AUTOMATIONS: Automation[] = [
  {
    id: 'auto-1',
    projectId: 'proj-product-launch',
    name: 'Quand une tâche passe en "En revue", notifier Sophie Martin',
    enabled: true,
    trigger: {
      type: 'status_changed',
      value: 'st-review'
    },
    conditions: [],
    actions: [
      {
        type: 'send_notification',
        targetValue: 'user-sophie',
        extraValue: 'Une nouvelle tâche requiert votre revue avant validation.'
      }
    ],
    createdBy: 'user-sophie',
    lastExecutedAt: '2026-11-08T09:00:00Z',
    executionCount: 7
  },
  {
    id: 'auto-2',
    projectId: 'proj-product-launch',
    name: 'Quand la priorité est "Urgent", ajouter le tag #Critique et assigner Alexandre',
    enabled: true,
    trigger: {
      type: 'priority_changed',
      value: 'urgent'
    },
    conditions: [],
    actions: [
      {
        type: 'add_label',
        targetValue: 'Critique'
      },
      {
        type: 'assign_user',
        targetValue: 'user-alex'
      }
    ],
    createdBy: 'user-alex',
    lastExecutedAt: '2026-11-07T14:30:00Z',
    executionCount: 4
  }
];

export const DEMO_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    taskId: 'task-1',
    projectId: 'proj-product-launch',
    userId: 'user-alex',
    userDisplayName: 'Alexandre Dupont',
    userPhotoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    content: 'J\'ai testé avec succès les cas de cartes expirées et les refus 3D Secure. Les logs dans Stripe Dashboard sont impeccables.',
    createdAt: '2026-11-07T15:20:00Z'
  },
  {
    id: 'comm-2',
    taskId: 'task-1',
    projectId: 'proj-product-launch',
    userId: 'user-sophie',
    userDisplayName: 'Sophie Martin',
    userPhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    content: 'Superbe travail ! Pense à vérifier que le client reçoit bien le reçu TVA automatique par email.',
    createdAt: '2026-11-07T16:05:00Z'
  },
  {
    id: 'comm-3',
    taskId: 'task-4',
    projectId: 'proj-product-launch',
    userId: 'user-alex',
    userDisplayName: 'Alexandre Dupont',
    userPhotoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    content: 'Nous avons identifié que c\'est l\'index composite sur (orgId, status, createdAt) qui manquait. Déploiement du correctif en cours.',
    createdAt: '2026-11-08T08:15:00Z'
  }
];

export const PROJECT_TEMPLATES = [
  {
    id: 'scrum',
    name: 'Scrum / Agile Sprint',
    description: 'Idéal pour le développement logiciel avec Backlog, En cours, Revue de code et Tests.',
    color: '#6366f1',
    statuses: [
      { id: 'st-backlog', label: 'Backlog', color: '#94a3b8', type: 'not_started' as const, order: 0 },
      { id: 'st-sprint', label: 'Sprint en cours', color: '#3b82f6', type: 'in_progress' as const, order: 1 },
      { id: 'st-review', label: 'Revue de code', color: '#f59e0b', type: 'in_progress' as const, order: 2 },
      { id: 'st-test', label: 'Recette / QA', color: '#8b5cf6', type: 'in_progress' as const, order: 3 },
      { id: 'st-done', label: 'Terminé', color: '#10b981', type: 'completed' as const, order: 4 }
    ]
  },
  {
    id: 'kanban',
    name: 'Kanban Classique',
    description: 'Gestion de flux continue pour les équipes opérationnelles et support.',
    color: '#0ea5e9',
    statuses: [
      { id: 'st-todo', label: 'À faire', color: '#94a3b8', type: 'not_started' as const, order: 0 },
      { id: 'st-doing', label: 'En cours', color: '#3b82f6', type: 'in_progress' as const, order: 1 },
      { id: 'st-review', label: 'En attente / Revue', color: '#f59e0b', type: 'in_progress' as const, order: 2 },
      { id: 'st-done', label: 'Terminé', color: '#10b981', type: 'completed' as const, order: 3 }
    ]
  },
  {
    id: 'personal',
    name: 'Gestion Personnelle & Productivité',
    description: 'Simple, épuré, pour suivre ses tâches personnelles et objectifs de la semaine.',
    color: '#10b981',
    statuses: [
      { id: 'st-ideas', label: 'Idées & Boîte de réception', color: '#64748b', type: 'not_started' as const, order: 0 },
      { id: 'st-this-week', label: 'Priorités de la semaine', color: '#6366f1', type: 'not_started' as const, order: 1 },
      { id: 'st-doing', label: 'Aujourd\'hui', color: '#0ea5e9', type: 'in_progress' as const, order: 2 },
      { id: 'st-done', label: 'Accompli', color: '#10b981', type: 'completed' as const, order: 3 }
    ]
  },
  {
    id: 'client-agency',
    name: 'Projet Client & Agence Web',
    description: 'Cycle complet avec phase de design, validation client et déploiement.',
    color: '#f97316',
    statuses: [
      { id: 'st-brief', label: 'Brief & Cadrage', color: '#8b5cf6', type: 'not_started' as const, order: 0 },
      { id: 'st-design', label: 'Design & Maquettes', color: '#ec4899', type: 'in_progress' as const, order: 1 },
      { id: 'st-client-val', label: 'Validation Client', color: '#f97316', type: 'in_progress' as const, order: 2 },
      { id: 'st-dev', label: 'Développement', color: '#06b6d4', type: 'in_progress' as const, order: 3 },
      { id: 'st-delivered', label: 'Livré & Validé', color: '#10b981', type: 'completed' as const, order: 4 }
    ]
  }
];
