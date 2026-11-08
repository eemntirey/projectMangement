export type UserRole = 'admin' | 'manager' | 'member' | 'reader';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: UserRole;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  orgId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
}

export type StatusType = 'not_started' | 'in_progress' | 'blocked' | 'completed';

export interface WorkflowStatus {
  id: string;
  label: string;
  color: string;
  type: StatusType;
  order: number;
}

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  statuses: WorkflowStatus[];
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type CustomFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'date' 
  | 'checkbox' 
  | 'select' 
  | 'multiselect' 
  | 'user' 
  | 'url';

export interface CustomFieldDefinition {
  id: string;
  projectId: string;
  name: string;
  type: CustomFieldType;
  options?: string[]; // for select / multiselect
  required?: boolean;
  order: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  orgId: string;
  title: string;
  description: string;
  statusId: string;
  priority: TaskPriority;
  assigneeIds: string[];
  creatorId: string;
  dueDate?: string;
  startDate?: string;
  labels: string[];
  parentTaskId?: string;
  dependencyIds: string[]; // blocked by these tasks
  customFields: Record<string, any>;
  subtasks?: Subtask[];
  estimateHours?: number;
  embedding?: number[];
  similarityScore?: number;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description: string;
  color: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'archived' | 'completed' | 'planning';
  priority: TaskPriority;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  templateId?: string;
  memberIds?: string[];
}

export type ViewType = 'kanban' | 'list' | 'calendar' | 'dashboard' | 'automations' | 'workflow' | 'custom_fields' | 'members' | 'webhooks';

export type WebhookEvent = 
  | 'task.created' 
  | 'task.status_changed' 
  | 'task.updated' 
  | 'task.deleted' 
  | 'comment.added' 
  | 'project.updated';

export interface WebhookConfig {
  id: string;
  projectId: string;
  name: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  enabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
  failureCount?: number;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  webhookName: string;
  projectId: string;
  event: WebhookEvent;
  url: string;
  status: 'success' | 'failed';
  httpStatus?: number;
  durationMs: number;
  payload: Record<string, any>;
  responseSnippet?: string;
  error?: string;
  timestamp: string;
}

export interface ProjectPlanTask {
  id?: string;
  title: string;
  description: string;
  phase?: string;
  suggestedAssignee?: string;
  suggestedAssigneeName?: string;
  priority: TaskPriority;
  estimateHours: number;
  labels?: string[];
  dependencies?: string[];
  dependsOnIndex?: number[];
  targetStatusId?: string;
  dueDate?: string;
}

export interface GeneratedProjectPlan {
  summary?: string;
  planSummary?: string;
  phases?: string[];
  estimatedDuration?: string;
  tasks: ProjectPlanTask[];
}


export interface SavedView {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  type: 'kanban' | 'list' | 'calendar' | 'dashboard';
  filters?: {
    search?: string;
    priority?: TaskPriority[];
    assignees?: string[];
    labels?: string[];
    statusIds?: string[];
    isOverdue?: boolean;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  columns?: string[];
}

export type AutomationTrigger = 
  | 'status_changed' 
  | 'priority_changed' 
  | 'task_created' 
  | 'due_date_passed' 
  | 'custom_field_changed';

export type AutomationActionType = 
  | 'change_status' 
  | 'assign_user' 
  | 'add_label' 
  | 'send_notification' 
  | 'create_subtask';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty';
  value: string;
}

export interface AutomationAction {
  type: AutomationActionType;
  targetValue: string;
  extraValue?: string;
}

export interface Automation {
  id: string;
  projectId: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: AutomationTrigger;
    field?: string;
    value?: string;
  };
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdBy: string;
  lastExecutedAt?: string;
  executionCount?: number;
}

export interface AutomationLog {
  id: string;
  automationId: string;
  automationName: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  timestamp: string;
  success: boolean;
  details: string;
}

export interface Comment {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  orgId: string;
  projectId: string;
  taskId?: string;
  taskTitle?: string;
  userId: string;
  userDisplayName: string;
  action: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  taskId?: string;
  projectId?: string;
  createdAt: string;
}
