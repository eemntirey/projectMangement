import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Project, 
  Workflow, 
  WorkflowStatus, 
  Task, 
  CustomFieldDefinition, 
  Automation, 
  AutomationLog, 
  InAppNotification, 
  SavedView, 
  ViewType, 
  ActivityLog, 
  TaskPriority,
  WebhookConfig,
  WebhookLog,
  ProjectPlanTask
} from '../types';
import { 
  subscribeProjects, 
  createProject as apiCreateProject, 
  updateProject as apiUpdateProject, 
  deleteProject as apiDeleteProject, 
  subscribeWorkflow, 
  saveWorkflow as apiSaveWorkflow, 
  subscribeTasks, 
  saveTask as apiSaveTask, 
  updateTask as apiUpdateTask, 
  deleteTask as apiDeleteTask, 
  subscribeCustomFields, 
  saveCustomField as apiSaveCustomField, 
  deleteCustomField as apiDeleteCustomField, 
  subscribeAutomations, 
  saveAutomation as apiSaveAutomation, 
  deleteAutomation as apiDeleteAutomation, 
  logActivity, 
  subscribeActivityLogs,
  subscribeWebhooks,
  saveWebhook as apiSaveWebhook,
  deleteWebhook as apiDeleteWebhook,
  subscribeWebhookLogs,
  saveWebhookLog as apiSaveWebhookLog,
  triggerProjectWebhooks,
  DEMO_WEBHOOKS,
  DEMO_WEBHOOK_LOGS
} from '../firebase/firestoreService';
import { 
  DEMO_PROJECTS, 
  DEMO_WORKFLOWS, 
  DEMO_CUSTOM_FIELDS, 
  DEMO_TASKS, 
  DEMO_AUTOMATIONS, 
  DEMO_USERS, 
  PROJECT_TEMPLATES 
} from '../data/demoData';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (proj: Project) => void;
  workflow: Workflow | null;
  tasks: Task[];
  customFields: CustomFieldDefinition[];
  automations: Automation[];
  automationLogs: AutomationLog[];
  activityLogs: ActivityLog[];
  notifications: InAppNotification[];
  unreadNotifsCount: number;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  savedViews: SavedView[];
  activeSavedView: SavedView | null;
  setActiveSavedView: (view: SavedView | null) => void;
  
  // Actions
  createNewProject: (name: string, description: string, color: string, templateId?: string) => Promise<string>;
  duplicateProjectAsTemplate: (projectId: string, newName: string) => Promise<string>;
  editProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;

  // Workflow actions
  updateWorkflowStatuses: (statuses: WorkflowStatus[]) => Promise<void>;

  // Task actions
  createTask: (taskData: Partial<Task>) => Promise<void>;
  editTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  moveTaskStatus: (taskId: string, targetStatusId: string) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;

  // Custom Fields
  addCustomField: (field: Omit<CustomFieldDefinition, 'id' | 'projectId' | 'order'>) => Promise<void>;
  removeCustomField: (fieldId: string) => Promise<void>;

  // Automations
  toggleAutomation: (automationId: string, enabled: boolean) => Promise<void>;
  createAutomation: (auto: Omit<Automation, 'id' | 'projectId' | 'createdBy'>) => Promise<void>;
  removeAutomation: (automationId: string) => Promise<void>;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (title: string, message: string, link?: string, taskId?: string) => void;

  // Webhooks
  webhooks: WebhookConfig[];
  webhookLogs: WebhookLog[];
  addWebhook: (wh: Omit<WebhookConfig, 'id' | 'projectId' | 'createdAt'>) => Promise<void>;
  updateWebhook: (id: string, updates: Partial<WebhookConfig>) => Promise<void>;
  removeWebhook: (id: string) => Promise<void>;
  testWebhook: (webhook: WebhookConfig) => Promise<WebhookLog>;

  // AI Plan & Semantic Search
  createTasksFromPlan: (planTasks: ProjectPlanTask[]) => Promise<number>;
  isSemanticSearchActive: boolean;
  setIsSemanticSearchActive: (active: boolean) => void;
  runSemanticSearch: (query: string) => Promise<void>;

  // Saved Views
  saveCurrentView: (name: string, viewType: SavedView['type'], filters?: any, sort?: any) => void;
  deleteSavedView: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [currentProject, setCurrentProject] = useState<Project | null>(DEMO_PROJECTS[0]);
  const [workflow, setWorkflow] = useState<Workflow | null>(DEMO_WORKFLOWS['proj-product-launch']);
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS.filter(t => t.projectId === 'proj-product-launch'));
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(DEMO_CUSTOM_FIELDS['proj-product-launch'] || []);
  const [automations, setAutomations] = useState<Automation[]>(DEMO_AUTOMATIONS.filter(a => a.projectId === 'proj-product-launch'));
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(DEMO_WEBHOOKS.filter(w => w.projectId === 'proj-product-launch'));
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(DEMO_WEBHOOK_LOGS);
  const [isSemanticSearchActive, setIsSemanticSearchActive] = useState<boolean>(false);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([
    {
      id: 'log-1',
      automationId: 'auto-1',
      automationName: 'Quand une tâche passe en "En revue", notifier Sophie Martin',
      projectId: 'proj-product-launch',
      taskId: 'task-2',
      taskTitle: 'Audit de sécurité & tests de pénétration OWASP',
      timestamp: '2026-11-08T09:00:00Z',
      success: true,
      details: 'Notification in-app envoyée avec succès à Sophie Martin'
    }
  ]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([
    {
      id: 'notif-1',
      userId: currentUser?.uid || 'user-sophie',
      title: 'Revue requise',
      message: 'La tâche "Audit de sécurité & tests" a été déplacée en "En revue".',
      read: false,
      taskId: 'task-2',
      projectId: 'proj-product-launch',
      createdAt: '2026-11-08T09:00:00Z'
    },
    {
      id: 'notif-2',
      userId: currentUser?.uid || 'user-sophie',
      title: 'Tâche urgente bloquée',
      message: 'La tâche "API Gateway : Latence" a été marquée en Bloqué.',
      read: false,
      taskId: 'task-4',
      projectId: 'proj-product-launch',
      createdAt: '2026-11-08T07:45:00Z'
    }
  ]);

  const [activeView, setActiveView] = useState<ViewType>('kanban');
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    {
      id: 'sv-1',
      projectId: 'proj-product-launch',
      userId: 'user-sophie',
      name: 'Urgences & Bloquants',
      type: 'kanban',
      filters: {
        priority: ['urgent', 'high']
      }
    },
    {
      id: 'sv-2',
      projectId: 'proj-product-launch',
      userId: 'user-sophie',
      name: 'Toutes les tâches - Liste complète',
      type: 'list'
    }
  ]);
  const [activeSavedView, setActiveSavedView] = useState<SavedView | null>(null);

  // Sync projects from Firestore
  useEffect(() => {
    const unsub = subscribeProjects((projs) => {
      setProjects(projs);
      if (!currentProject && projs.length > 0) {
        setCurrentProject(projs[0]);
      }
    });
    return () => unsub();
  }, []);

  // When currentProject changes, subscribe to its sub-entities
  useEffect(() => {
    if (!currentProject) return;

    const unsubWf = subscribeWorkflow(currentProject.id, (wf) => {
      if (wf) {
        setWorkflow(wf);
      } else {
        const fallbackWf = DEMO_WORKFLOWS[currentProject.id] || {
          id: `wf-${currentProject.id}`,
          projectId: currentProject.id,
          name: 'Workflow Standard',
          statuses: [
            { id: 'st-todo', label: 'À faire', color: '#94a3b8', type: 'not_started', order: 0 },
            { id: 'st-doing', label: 'En cours', color: '#3b82f6', type: 'in_progress', order: 1 },
            { id: 'st-done', label: 'Terminé', color: '#10b981', type: 'completed', order: 2 }
          ]
        };
        setWorkflow(fallbackWf);
      }
    });

    const unsubTasks = subscribeTasks(currentProject.id, (tList) => {
      setTasks(tList);
    });

    const unsubFields = subscribeCustomFields(currentProject.id, (fields) => {
      setCustomFields(fields);
    });

    const unsubAutos = subscribeAutomations(currentProject.id, (autos) => {
      setAutomations(autos);
    });

    const unsubLogs = subscribeActivityLogs(currentProject.id, (logs) => {
      setActivityLogs(logs);
    });

    const unsubWebhooks = subscribeWebhooks(currentProject.id, (whs) => {
      setWebhooks(whs);
    });

    const unsubWebhookLogs = subscribeWebhookLogs(currentProject.id, (logs) => {
      setWebhookLogs(logs);
    });

    return () => {
      unsubWf();
      unsubTasks();
      unsubFields();
      unsubAutos();
      unsubLogs();
      unsubWebhooks();
      unsubWebhookLogs();
    };
  }, [currentProject?.id]);

  // Notifications helpers
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (title: string, message: string, link?: string, taskId?: string) => {
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser?.uid || 'user-current',
      title,
      message,
      read: false,
      link,
      taskId,
      projectId: currentProject?.id,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Run No-Code Automations Engine
  const executeAutomationsForTask = async (
    task: Task, 
    changeType: 'status_changed' | 'priority_changed' | 'task_created', 
    previousValue?: string
  ) => {
    if (!currentProject) return;
    const activeRules = automations.filter(a => a.enabled && a.trigger.type === changeType);

    for (const rule of activeRules) {
      // Check trigger match
      let isTriggerMatch = false;
      if (changeType === 'status_changed') {
        isTriggerMatch = !rule.trigger.value || rule.trigger.value === task.statusId;
      } else if (changeType === 'priority_changed') {
        isTriggerMatch = !rule.trigger.value || rule.trigger.value === task.priority;
      } else if (changeType === 'task_created') {
        isTriggerMatch = true;
      }

      if (!isTriggerMatch) continue;

      // Execute each action
      for (const action of rule.actions) {
        try {
          if (action.type === 'send_notification') {
            const targetUser = DEMO_USERS.find(u => u.uid === action.targetValue);
            addNotification(
              `Règle exécutée: ${rule.name}`,
              action.extraValue || `Automatisation déclenchée sur "${task.title}"`,
              undefined,
              task.id
            );
          } else if (action.type === 'add_label') {
            const updatedLabels = Array.from(new Set([...task.labels, action.targetValue]));
            await apiUpdateTask(task.id, { labels: updatedLabels });
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, labels: updatedLabels } : t));
          } else if (action.type === 'assign_user') {
            const updatedAssignees = Array.from(new Set([...task.assigneeIds, action.targetValue]));
            await apiUpdateTask(task.id, { assigneeIds: updatedAssignees });
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assigneeIds: updatedAssignees } : t));
          } else if (action.type === 'change_status') {
            await apiUpdateTask(task.id, { statusId: action.targetValue });
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, statusId: action.targetValue } : t));
          } else if (action.type === 'create_subtask') {
            const newSubtask = {
              id: `sub-${Date.now()}`,
              title: action.targetValue || 'Sous-tâche automatique',
              completed: false
            };
            const updatedSubtasks = [...(task.subtasks || []), newSubtask];
            await apiUpdateTask(task.id, { subtasks: updatedSubtasks });
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subtasks: updatedSubtasks } : t));
          }

          // Record execution log
          const logEntry: AutomationLog = {
            id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            automationId: rule.id,
            automationName: rule.name,
            projectId: currentProject.id,
            taskId: task.id,
            taskTitle: task.title,
            timestamp: new Date().toISOString(),
            success: true,
            details: `Action "${action.type}" effectuée avec valeur "${action.targetValue}".`
          };
          setAutomationLogs(prev => [logEntry, ...prev.slice(0, 49)]);

          // Increment count
          apiSaveAutomation({
            ...rule,
            lastExecutedAt: new Date().toISOString(),
            executionCount: (rule.executionCount || 0) + 1
          });
        } catch (err: any) {
          console.error('Automation execution failed:', err);
        }
      }
    }
  };

  // Project Actions
  const createNewProject = async (name: string, description: string, color: string, templateId?: string): Promise<string> => {
    const newId = `proj-${Date.now()}`;
    const selectedTpl = PROJECT_TEMPLATES.find(t => t.id === templateId) || PROJECT_TEMPLATES[0];

    const newProject: Project = {
      id: newId,
      orgId: 'org-flexiflow-inc',
      name,
      description,
      color: color || selectedTpl.color,
      status: 'active',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.uid || 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: templateId || 'scrum',
      memberIds: [currentUser?.uid || 'user-sophie']
    };

    await apiCreateProject(newProject);
    setProjects(prev => [newProject, ...prev]);

    // Create workflow from template
    const newWf: Workflow = {
      id: `wf-${newId}`,
      projectId: newId,
      name: `${name} Workflow`,
      statuses: selectedTpl.statuses.map((s, idx) => ({ ...s, order: idx }))
    };
    await apiSaveWorkflow(newWf);
    setWorkflow(newWf);

    setCurrentProject(newProject);
    logActivity({
      id: `act-${Date.now()}`,
      orgId: 'org-flexiflow-inc',
      projectId: newId,
      userId: currentUser?.uid || 'admin',
      userDisplayName: currentUser?.displayName || 'Admin',
      action: `Projet "${name}" créé avec succès`,
      createdAt: new Date().toISOString()
    });

    return newId;
  };

  const duplicateProjectAsTemplate = async (sourceProjectId: string, newName: string): Promise<string> => {
    const sourceProject = projects.find(p => p.id === sourceProjectId) || currentProject;
    if (!sourceProject) throw new Error('Projet introuvable');

    const newId = `proj-copy-${Date.now()}`;
    const clonedProject: Project = {
      ...sourceProject,
      id: newId,
      name: newName || `${sourceProject.name} (Copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.uid || 'user-admin'
    };

    await apiCreateProject(clonedProject);
    setProjects(prev => [clonedProject, ...prev]);

    // Clone workflow
    if (workflow) {
      const clonedWf: Workflow = {
        ...workflow,
        id: `wf-${newId}`,
        projectId: newId
      };
      await apiSaveWorkflow(clonedWf);
    }

    setCurrentProject(clonedProject);
    return newId;
  };

  const editProject = async (projectId: string, updates: Partial<Project>) => {
    await apiUpdateProject(projectId, updates);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    if (currentProject?.id === projectId) {
      setCurrentProject(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const archiveProject = async (projectId: string) => {
    await editProject(projectId, { status: 'archived' });
  };

  const removeProject = async (projectId: string) => {
    await apiDeleteProject(projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      const remaining = projects.filter(p => p.id !== projectId);
      setCurrentProject(remaining[0] || null);
    }
  };

  // Workflow actions
  const updateWorkflowStatuses = async (statuses: WorkflowStatus[]) => {
    if (!currentProject || !workflow) return;
    const updated: Workflow = {
      ...workflow,
      statuses
    };
    await apiSaveWorkflow(updated);
    setWorkflow(updated);
  };

  // Task actions
  const createTask = async (taskData: Partial<Task>) => {
    if (!currentProject) return;
    const defaultStatusId = workflow?.statuses[0]?.id || 'st-todo';
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: currentProject.id,
      orgId: currentProject.orgId,
      title: taskData.title || 'Nouvelle tâche',
      description: taskData.description || '',
      statusId: taskData.statusId || defaultStatusId,
      priority: taskData.priority || 'medium',
      assigneeIds: taskData.assigneeIds || [currentUser?.uid || 'user-sophie'],
      creatorId: currentUser?.uid || 'user-admin',
      dueDate: taskData.dueDate,
      startDate: taskData.startDate,
      labels: taskData.labels || [],
      dependencyIds: taskData.dependencyIds || [],
      customFields: taskData.customFields || {},
      subtasks: taskData.subtasks || [],
      estimateHours: taskData.estimateHours || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await apiSaveTask(newTask);
    setTasks(prev => [newTask, ...prev]);

    logActivity({
      id: `act-${Date.now()}`,
      orgId: currentProject.orgId,
      projectId: currentProject.id,
      taskId: newTask.id,
      taskTitle: newTask.title,
      userId: currentUser?.uid || 'admin',
      userDisplayName: currentUser?.displayName || 'Admin',
      action: `a créé la tâche "${newTask.title}"`,
      createdAt: new Date().toISOString()
    });

    executeAutomationsForTask(newTask, 'task_created');

    // Trigger Outgoing Webhooks
    triggerProjectWebhooks(webhooks, 'task.created', {
      event: 'task.created',
      timestamp: new Date().toISOString(),
      project: { id: currentProject.id, name: currentProject.name },
      task: newTask
    }, (log) => setWebhookLogs(prev => [log, ...prev]));
  };

  const editTask = async (taskId: string, updates: Partial<Task>) => {
    const existing = tasks.find(t => t.id === taskId);
    if (!existing) return;

    await apiUpdateTask(taskId, updates);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));

    if (updates.statusId && updates.statusId !== existing.statusId) {
      executeAutomationsForTask(updated, 'status_changed', existing.statusId);
      // Trigger status changed webhook
      triggerProjectWebhooks(webhooks, 'task.status_changed', {
        event: 'task.status_changed',
        timestamp: new Date().toISOString(),
        previousStatusId: existing.statusId,
        newStatusId: updates.statusId,
        project: { id: currentProject?.id, name: currentProject?.name },
        task: updated
      }, (log) => setWebhookLogs(prev => [log, ...prev]));
    } else {
      // Trigger updated webhook
      triggerProjectWebhooks(webhooks, 'task.updated', {
        event: 'task.updated',
        timestamp: new Date().toISOString(),
        updates,
        project: { id: currentProject?.id, name: currentProject?.name },
        task: updated
      }, (log) => setWebhookLogs(prev => [log, ...prev]));
    }

    if (updates.priority && updates.priority !== existing.priority) {
      executeAutomationsForTask(updated, 'priority_changed', existing.priority);
    }
  };

  const moveTaskStatus = async (taskId: string, targetStatusId: string) => {
    await editTask(taskId, { statusId: targetStatusId });
  };

  const removeTask = async (taskId: string) => {
    const existing = tasks.find(t => t.id === taskId);
    await apiDeleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));

    if (existing && currentProject) {
      triggerProjectWebhooks(webhooks, 'task.deleted', {
        event: 'task.deleted',
        timestamp: new Date().toISOString(),
        project: { id: currentProject.id, name: currentProject.name },
        task: existing
      }, (log) => setWebhookLogs(prev => [log, ...prev]));
    }
  };

  // Custom Fields
  const addCustomField = async (field: Omit<CustomFieldDefinition, 'id' | 'projectId' | 'order'>) => {
    if (!currentProject) return;
    const newField: CustomFieldDefinition = {
      ...field,
      id: `cf-${Date.now()}`,
      projectId: currentProject.id,
      order: customFields.length
    };
    await apiSaveCustomField(newField);
    setCustomFields(prev => [...prev, newField]);
  };

  const removeCustomField = async (fieldId: string) => {
    await apiDeleteCustomField(fieldId);
    setCustomFields(prev => prev.filter(f => f.id !== fieldId));
  };

  // Automations
  const toggleAutomation = async (automationId: string, enabled: boolean) => {
    const auto = automations.find(a => a.id === automationId);
    if (!auto) return;
    const updated = { ...auto, enabled };
    await apiSaveAutomation(updated);
    setAutomations(prev => prev.map(a => a.id === automationId ? updated : a));
  };

  const createAutomation = async (auto: Omit<Automation, 'id' | 'projectId' | 'createdBy'>) => {
    if (!currentProject) return;
    const newAuto: Automation = {
      ...auto,
      id: `auto-${Date.now()}`,
      projectId: currentProject.id,
      createdBy: currentUser?.uid || 'user-admin',
      executionCount: 0
    };
    await apiSaveAutomation(newAuto);
    setAutomations(prev => [newAuto, ...prev]);
  };

  const removeAutomation = async (automationId: string) => {
    await apiDeleteAutomation(automationId);
    setAutomations(prev => prev.filter(a => a.id !== automationId));
  };

  // Webhooks
  const addWebhook = async (wh: Omit<WebhookConfig, 'id' | 'projectId' | 'createdAt'>) => {
    if (!currentProject) return;
    const newWh: WebhookConfig = {
      ...wh,
      id: `wh-${Date.now()}`,
      projectId: currentProject.id,
      createdAt: new Date().toISOString(),
      failureCount: 0
    };
    await apiSaveWebhook(newWh);
    setWebhooks(prev => [newWh, ...prev]);
  };

  const updateWebhook = async (id: string, updates: Partial<WebhookConfig>) => {
    const existing = webhooks.find(w => w.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await apiSaveWebhook(updated);
    setWebhooks(prev => prev.map(w => w.id === id ? updated : w));
  };

  const removeWebhook = async (id: string) => {
    await apiDeleteWebhook(id);
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const testWebhook = async (webhook: WebhookConfig): Promise<WebhookLog> => {
    const testEvent = webhook.events[0] || 'task.created';
    const testPayload = {
      event: testEvent,
      timestamp: new Date().toISOString(),
      project: { id: currentProject?.id, name: currentProject?.name },
      task: { id: 'test-task', title: 'Tâche de test FlexiFlow', status: 'À faire', priority: 'medium' }
    };
    const res = await fetch('/api/webhooks/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook, event: testEvent, payload: testPayload })
    });
    const log: WebhookLog = await res.json();
    await apiSaveWebhookLog(log);
    setWebhookLogs(prev => [log, ...prev]);
    return log;
  };

  // AI Project Planner: Create tasks in batch
  const createTasksFromPlan = async (planTasks: ProjectPlanTask[]): Promise<number> => {
    if (!currentProject) return 0;
    const defaultStatusId = workflow?.statuses[0]?.id || 'st-todo';
    const tempIdToRealIdMap: Record<string, string> = {};

    planTasks.forEach((pt, index) => {
      tempIdToRealIdMap[pt.id || `plan-${index}`] = `task-plan-${Date.now()}-${index}`;
    });

    const newTaskList: Task[] = [];

    for (let index = 0; index < planTasks.length; index++) {
      const pt = planTasks[index];
      const realId = tempIdToRealIdMap[pt.id || `plan-${index}`];

      // Match assignee
      let matchedUserId = currentUser?.uid || 'user-sophie';
      const targetAssigneeName = pt.suggestedAssignee || pt.suggestedAssigneeName;
      if (targetAssigneeName) {
        const query = targetAssigneeName.toLowerCase();
        const found = DEMO_USERS.find(u => 
          u.displayName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        );
        if (found) matchedUserId = found.uid;
      }

      // Map dependencies
      const mappedDependencies = (pt.dependencies || [])
        .map((depId: string) => tempIdToRealIdMap[depId])
        .filter(Boolean);

      const task: Task = {
        id: realId,
        projectId: currentProject.id,
        orgId: currentProject.orgId,
        title: pt.title,
        description: pt.description || '',
        statusId: defaultStatusId,
        priority: pt.priority || 'medium',
        assigneeIds: [matchedUserId],
        creatorId: currentUser?.uid || 'user-admin',
        dueDate: pt.dueDate,
        labels: ['Planifié IA', ...(pt.phase ? [pt.phase] : [])],
        dependencyIds: mappedDependencies,
        customFields: {},
        subtasks: [],
        estimateHours: pt.estimateHours || 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      newTaskList.push(task);
      await apiSaveTask(task);
    }

    setTasks(prev => [...newTaskList, ...prev]);

    // Trigger webhook for batch creation
    if (newTaskList.length > 0) {
      triggerProjectWebhooks(webhooks, 'task.created', {
        event: 'task.created',
        tasksCreatedCount: newTaskList.length,
        project: { id: currentProject.id, name: currentProject.name },
        firstTask: newTaskList[0]
      }, (log) => setWebhookLogs(l => [log, ...l]));
    }

    logActivity({
      id: `act-${Date.now()}`,
      orgId: currentProject.orgId,
      projectId: currentProject.id,
      userId: currentUser?.uid || 'admin',
      userDisplayName: currentUser?.displayName || 'Admin',
      action: `a importé ${newTaskList.length} tâches depuis le planificateur autonome IA`,
      createdAt: new Date().toISOString()
    });

    addNotification(
      'Plan IA généré avec succès',
      `${newTaskList.length} tâches ont été créées et ordonnées dans "${currentProject.name}".`,
      undefined,
      newTaskList[0]?.id
    );

    return newTaskList.length;
  };

  // Semantic Vector Search
  const runSemanticSearch = async (queryText: string) => {
    if (!queryText || queryText.trim() === '') {
      setTasks(prev => prev.map(t => ({ ...t, similarityScore: undefined })));
      return;
    }

    try {
      const res = await fetch('/api/gemini/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, tasks })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          setTasks(data.results);
        }
      }
    } catch (err) {
      console.warn('Semantic search error:', err);
    }
  };

  // Saved Views
  const saveCurrentView = (name: string, viewType: SavedView['type'], filters?: any, sort?: any) => {
    if (!currentProject) return;
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      projectId: currentProject.id,
      userId: currentUser?.uid || 'user-current',
      name,
      type: viewType,
      filters,
      sort
    };
    setSavedViews(prev => [...prev, newView]);
    setActiveSavedView(newView);
  };

  const deleteSavedView = (id: string) => {
    setSavedViews(prev => prev.filter(v => v.id !== id));
    if (activeSavedView?.id === id) {
      setActiveSavedView(null);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        workflow,
        tasks,
        customFields,
        automations,
        automationLogs,
        activityLogs,
        notifications,
        unreadNotifsCount,
        activeView,
        setActiveView,
        savedViews,
        activeSavedView,
        setActiveSavedView,
        createNewProject,
        duplicateProjectAsTemplate,
        editProject,
        archiveProject,
        removeProject,
        updateWorkflowStatuses,
        createTask,
        editTask,
        moveTaskStatus,
        removeTask,
        addCustomField,
        removeCustomField,
        toggleAutomation,
        createAutomation,
        removeAutomation,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        saveCurrentView,
        deleteSavedView,
        webhooks,
        webhookLogs,
        addWebhook,
        updateWebhook,
        removeWebhook,
        testWebhook,
        createTasksFromPlan,
        isSemanticSearchActive,
        setIsSemanticSearchActive,
        runSemanticSearch
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
