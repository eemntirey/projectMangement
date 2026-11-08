import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import { 
  Project, 
  Workflow, 
  Task, 
  CustomFieldDefinition, 
  Automation, 
  Comment, 
  ActivityLog, 
  InAppNotification, 
  UserProfile, 
  Organization,
  WebhookConfig,
  WebhookLog,
  WebhookEvent
} from '../types';
import { 
  DEMO_PROJECTS, 
  DEMO_WORKFLOWS, 
  DEMO_CUSTOM_FIELDS, 
  DEMO_TASKS, 
  DEMO_AUTOMATIONS, 
  DEMO_USERS, 
  DEMO_COMMENTS 
} from '../data/demoData';

// User Profile sync
export async function syncUserProfile(user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }) {
  if (!user.uid) return null;
  const userRef = doc(db, 'users', user.uid);
  try {
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || 'user@flexiflow.app',
        displayName: user.displayName || user.email?.split('@')[0] || 'Utilisateur FlexiFlow',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, profile);
      return profile;
    }
    return existing.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    return null;
  }
}

// Seed Demo Data into Firestore
export async function seedDemoDataIfEmpty(currentUserId: string) {
  try {
    const projectsSnap = await getDocs(collection(db, 'projects'));
    if (!projectsSnap.empty) {
      console.log('[Firestore] Data already exists, skipping initial seed.');
      return;
    }

    console.log('[Firestore] Seeding demo projects and tasks...');
    
    // Seed projects
    for (const project of DEMO_PROJECTS) {
      await setDoc(doc(db, 'projects', project.id), {
        ...project,
        createdBy: currentUserId,
        memberIds: [...(project.memberIds || []), currentUserId]
      });

      // Seed workflow
      const wf = DEMO_WORKFLOWS[project.id];
      if (wf) {
        await setDoc(doc(db, 'workflows', wf.id), wf);
      }

      // Seed custom fields
      const fields = DEMO_CUSTOM_FIELDS[project.id] || [];
      for (const field of fields) {
        await setDoc(doc(db, 'customFieldDefinitions', field.id), field);
      }
    }

    // Seed tasks
    for (const task of DEMO_TASKS) {
      await setDoc(doc(db, 'tasks', task.id), {
        ...task,
        creatorId: currentUserId
      });
    }

    // Seed automations
    for (const auto of DEMO_AUTOMATIONS) {
      await setDoc(doc(db, 'automations', auto.id), {
        ...auto,
        createdBy: currentUserId
      });
    }

    // Seed comments
    for (const comment of DEMO_COMMENTS) {
      await setDoc(doc(db, 'comments', comment.id), comment);
    }

    console.log('[Firestore] Seeding completed successfully!');
  } catch (error) {
    console.warn('[Firestore] Note on seeding:', error);
  }
}

// Projects
export function subscribeProjects(callback: (projects: Project[]) => void) {
  const colRef = collection(db, 'projects');
  return onSnapshot(colRef, (snapshot) => {
    const list: Project[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Project);
    });
    callback(list.length > 0 ? list : DEMO_PROJECTS);
  }, (err) => {
    console.warn('Projects snapshot error, using cached demo data:', err);
    callback(DEMO_PROJECTS);
  });
}

export async function createProject(project: Project): Promise<void> {
  const docRef = doc(db, 'projects', project.id);
  try {
    await setDoc(docRef, project);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `projects/${project.id}`);
  }
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
  const docRef = doc(db, 'projects', projectId);
  try {
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}`);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const docRef = doc(db, 'projects', projectId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
  }
}

// Workflows
export function subscribeWorkflow(projectId: string, callback: (wf: Workflow | null) => void) {
  const colRef = collection(db, 'workflows');
  const q = query(colRef, where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      callback(snapshot.docs[0].data() as Workflow);
    } else {
      callback(DEMO_WORKFLOWS[projectId] || null);
    }
  }, (err) => {
    console.warn('Workflow snapshot error:', err);
    callback(DEMO_WORKFLOWS[projectId] || null);
  });
}

export async function saveWorkflow(workflow: Workflow): Promise<void> {
  const docRef = doc(db, 'workflows', workflow.id);
  try {
    await setDoc(docRef, workflow);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `workflows/${workflow.id}`);
  }
}

// Tasks
export function subscribeTasks(projectId: string, callback: (tasks: Task[]) => void) {
  const colRef = collection(db, 'tasks');
  const q = query(colRef, where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    const list: Task[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Task);
    });
    if (list.length > 0) {
      callback(list);
    } else {
      const fallback = DEMO_TASKS.filter(t => t.projectId === projectId);
      callback(fallback);
    }
  }, (err) => {
    console.warn('Tasks snapshot fallback:', err);
    const fallback = DEMO_TASKS.filter(t => t.projectId === projectId);
    callback(fallback);
  });
}

export async function saveTask(task: Task): Promise<void> {
  const docRef = doc(db, 'tasks', task.id);
  try {
    await setDoc(docRef, task);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `tasks/${task.id}`);
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  const docRef = doc(db, 'tasks', taskId);
  try {
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const docRef = doc(db, 'tasks', taskId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
  }
}

// Custom Field Definitions
export function subscribeCustomFields(projectId: string, callback: (fields: CustomFieldDefinition[]) => void) {
  const colRef = collection(db, 'customFieldDefinitions');
  const q = query(colRef, where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    const list: CustomFieldDefinition[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as CustomFieldDefinition);
    });
    callback(list.length > 0 ? list : (DEMO_CUSTOM_FIELDS[projectId] || []));
  }, (err) => {
    callback(DEMO_CUSTOM_FIELDS[projectId] || []);
  });
}

export async function saveCustomField(field: CustomFieldDefinition): Promise<void> {
  const docRef = doc(db, 'customFieldDefinitions', field.id);
  try {
    await setDoc(docRef, field);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `customFieldDefinitions/${field.id}`);
  }
}

export async function deleteCustomField(fieldId: string): Promise<void> {
  const docRef = doc(db, 'customFieldDefinitions', fieldId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `customFieldDefinitions/${fieldId}`);
  }
}

// Automations
export function subscribeAutomations(projectId: string, callback: (autos: Automation[]) => void) {
  const colRef = collection(db, 'automations');
  const q = query(colRef, where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    const list: Automation[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Automation);
    });
    callback(list.length > 0 ? list : DEMO_AUTOMATIONS.filter(a => a.projectId === projectId));
  }, (err) => {
    callback(DEMO_AUTOMATIONS.filter(a => a.projectId === projectId));
  });
}

export async function saveAutomation(automation: Automation): Promise<void> {
  const docRef = doc(db, 'automations', automation.id);
  try {
    await setDoc(docRef, automation);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `automations/${automation.id}`);
  }
}

export async function deleteAutomation(automationId: string): Promise<void> {
  const docRef = doc(db, 'automations', automationId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `automations/${automationId}`);
  }
}

// Comments
export function subscribeComments(taskId: string, callback: (comments: Comment[]) => void) {
  const colRef = collection(db, 'comments');
  const q = query(colRef, where('taskId', '==', taskId));
  return onSnapshot(q, (snapshot) => {
    const list: Comment[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Comment);
    });
    callback(list.length > 0 ? list : DEMO_COMMENTS.filter(c => c.taskId === taskId));
  }, (err) => {
    callback(DEMO_COMMENTS.filter(c => c.taskId === taskId));
  });
}

export async function addComment(comment: Comment): Promise<void> {
  const docRef = doc(db, 'comments', comment.id);
  try {
    await setDoc(docRef, comment);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `comments/${comment.id}`);
  }
}

// Activity Logs
export async function logActivity(log: ActivityLog): Promise<void> {
  const docRef = doc(db, 'activityLogs', log.id);
  try {
    await setDoc(docRef, log);
  } catch (err) {
    console.warn('Activity logging issue:', err);
  }
}

export function subscribeActivityLogs(projectId: string, callback: (logs: ActivityLog[]) => void) {
  const colRef = collection(db, 'activityLogs');
  const q = query(colRef, where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    const list: ActivityLog[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ActivityLog);
    });
    callback(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, (err) => {
    console.warn('Activity logs fallback:', err);
    callback([]);
  });
}

// Webhooks Services

export const DEMO_WEBHOOKS: WebhookConfig[] = [
  {
    id: 'wh-slack-notify',
    projectId: 'proj-product-launch',
    name: 'Notification Slack #dev-product',
    url: 'https://hooks.slack.com/services/T000/B000/XXXXX',
    secret: 'whsec_slack_prod_secret_token',
    events: ['task.created', 'task.status_changed'],
    enabled: true,
    createdAt: '2026-11-06T10:00:00Z',
    lastTriggeredAt: '2026-11-08T08:30:00Z',
    failureCount: 0
  },
  {
    id: 'wh-ci-deploy',
    projectId: 'proj-product-launch',
    name: 'Trigger Déploiement GitHub Actions CI/CD',
    url: 'https://api.github.com/repos/flexiflow/actions/workflows/deploy.yml/dispatches',
    secret: 'whsec_gh_actions_token',
    events: ['task.status_changed'],
    enabled: true,
    createdAt: '2026-11-07T12:00:00Z',
    lastTriggeredAt: '2026-11-08T09:00:00Z',
    failureCount: 0
  }
];

export const DEMO_WEBHOOK_LOGS: WebhookLog[] = [
  {
    id: 'whlog-1',
    webhookId: 'wh-slack-notify',
    webhookName: 'Notification Slack #dev-product',
    projectId: 'proj-product-launch',
    event: 'task.status_changed',
    url: 'https://hooks.slack.com/services/T000/B000/XXXXX',
    status: 'success',
    httpStatus: 200,
    durationMs: 142,
    payload: {
      event: 'task.status_changed',
      task: { id: 'task-1', title: 'Finaliser l\'intégration du paiement Stripe', status: 'En cours' }
    },
    responseSnippet: 'ok',
    timestamp: '2026-11-08T08:30:00Z'
  },
  {
    id: 'whlog-2',
    webhookId: 'wh-ci-deploy',
    webhookName: 'Trigger Déploiement GitHub Actions CI/CD',
    projectId: 'proj-product-launch',
    event: 'task.status_changed',
    url: 'https://api.github.com/repos/flexiflow/actions/workflows/deploy.yml/dispatches',
    status: 'success',
    httpStatus: 204,
    durationMs: 280,
    payload: {
      event: 'task.status_changed',
      task: { id: 'task-8', title: 'Configuration du monitoring temps réel', status: 'Terminé' }
    },
    responseSnippet: '204 No Content',
    timestamp: '2026-11-08T09:00:00Z'
  }
];

export function subscribeWebhooks(projectId: string, callback: (webhooks: WebhookConfig[]) => void) {
  const colRef = collection(db, 'webhooks');
  const q = query(colRef, where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    const list: WebhookConfig[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as WebhookConfig);
    });
    callback(list.length > 0 ? list : DEMO_WEBHOOKS.filter(w => w.projectId === projectId));
  }, (err) => {
    console.warn('Webhooks fallback:', err);
    callback(DEMO_WEBHOOKS.filter(w => w.projectId === projectId));
  });
}

export async function saveWebhook(webhook: WebhookConfig): Promise<void> {
  const docRef = doc(db, 'webhooks', webhook.id);
  try {
    await setDoc(docRef, webhook);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `webhooks/${webhook.id}`);
  }
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const docRef = doc(db, 'webhooks', webhookId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `webhooks/${webhookId}`);
  }
}

export function subscribeWebhookLogs(projectId: string, callback: (logs: WebhookLog[]) => void) {
  const colRef = collection(db, 'webhookLogs');
  const q = query(colRef, where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    const list: WebhookLog[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as WebhookLog);
    });
    callback(list.length > 0 ? list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : DEMO_WEBHOOK_LOGS);
  }, (err) => {
    callback(DEMO_WEBHOOK_LOGS);
  });
}

export async function saveWebhookLog(log: WebhookLog): Promise<void> {
  const docRef = doc(db, 'webhookLogs', log.id);
  try {
    await setDoc(docRef, log);
  } catch (err) {
    console.warn('Could not save webhook log to Firestore:', err);
  }
}

export async function triggerProjectWebhooks(
  webhooks: WebhookConfig[],
  event: WebhookEvent,
  payload: Record<string, any>,
  onLogSaved?: (log: WebhookLog) => void
) {
  const activeWebhooks = webhooks.filter(w => w.enabled && w.events.includes(event));
  for (const wh of activeWebhooks) {
    try {
      const res = await fetch('/api/webhooks/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook: wh, event, payload })
      });
      if (res.ok) {
        const log: WebhookLog = await res.json();
        await saveWebhookLog(log);
        onLogSaved?.(log);
      }
    } catch (e) {
      console.warn('Webhook dispatch failed:', e);
    }
  }
}

