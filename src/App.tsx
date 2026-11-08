import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { KanbanView } from './components/views/KanbanView';
import { ListView } from './components/views/ListView';
import { CalendarView } from './components/views/CalendarView';
import { DashboardView } from './components/views/DashboardView';
import { AutomationsView } from './components/views/AutomationsView';
import { WorkflowSettingsView } from './components/views/WorkflowSettingsView';
import { CustomFieldsView } from './components/views/CustomFieldsView';
import { MembersView } from './components/views/MembersView';
import { WebhooksView } from './components/views/WebhooksView';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { TaskCreateModal } from './components/tasks/TaskCreateModal';
import { AiAssistantModal } from './components/modals/AiAssistantModal';
import { ProjectPlanModal } from './components/modals/ProjectPlanModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { ShareInviteModal } from './components/modals/ShareInviteModal';
import { Task } from './types';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { activeView, currentProject } = useProject();
  const { isLoading } = useAuth();

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskStatusId, setCreateTaskStatusId] = useState<string | undefined>();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleOpenCreateTask = (statusId?: string) => {
    setCreateTaskStatusId(statusId);
    setIsCreateTaskOpen(true);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
          Chargement de FlexiFlow...
        </span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Top Navigation */}
      <Navbar
        onOpenCreateTask={() => handleOpenCreateTask()}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenPlanModal={() => setIsPlanModalOpen(true)}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onOpenPlanModal={() => setIsPlanModalOpen(true)}
        />

        {/* Viewport content area */}
        <main className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col">
          {activeView === 'kanban' && (
            <KanbanView
              onSelectTask={setSelectedTask}
              onOpenCreateTask={handleOpenCreateTask}
            />
          )}

          {activeView === 'list' && (
            <ListView
              onSelectTask={setSelectedTask}
              onOpenCreateTask={() => handleOpenCreateTask()}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              onSelectTask={setSelectedTask}
              onOpenCreateTask={() => handleOpenCreateTask()}
            />
          )}

          {activeView === 'dashboard' && (
            <DashboardView
              onOpenAiModal={() => setIsAiModalOpen(true)}
              onSelectTask={setSelectedTask}
            />
          )}

          {activeView === 'webhooks' && <WebhooksView />}

          {activeView === 'automations' && <AutomationsView />}

          {activeView === 'workflow' && <WorkflowSettingsView />}

          {activeView === 'custom_fields' && <CustomFieldsView />}

          {activeView === 'members' && (
            <MembersView
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      <TaskCreateModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultStatusId={createTaskStatusId}
      />

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      <ProjectPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />

      <ShareInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppContent />
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
