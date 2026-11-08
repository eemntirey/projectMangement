import React from 'react';
import { 
  FolderPlus, 
  Copy, 
  Kanban, 
  List, 
  Calendar, 
  LayoutDashboard, 
  Zap, 
  GitFork, 
  SlidersHorizontal, 
  Users, 
  Bookmark, 
  Sparkles,
  ChevronRight,
  Archive,
  Webhook,
  Target
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { ViewType, Project } from '../../types';

interface SidebarProps {
  onOpenNewProjectModal: () => void;
  onOpenAiModal: () => void;
  onOpenPlanModal?: () => void;
}

export function Sidebar({ onOpenNewProjectModal, onOpenAiModal, onOpenPlanModal }: SidebarProps) {
  const { 
    projects, 
    currentProject, 
    setCurrentProject, 
    activeView, 
    setActiveView, 
    savedViews, 
    duplicateProjectAsTemplate,
    archiveProject 
  } = useProject();

  const { can } = useAuth();

  const handleDuplicate = async (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation();
    const newName = prompt('Nom du nouveau projet copié :', `${proj.name} (Modèle)`);
    if (newName) {
      await duplicateProjectAsTemplate(proj.id, newName);
    }
  };

  const navItems: Array<{ id: ViewType; label: string; icon: any }> = [
    { id: 'kanban', label: 'Tableau Kanban', icon: Kanban },
    { id: 'list', label: 'Vue Liste complète', icon: List },
    { id: 'calendar', label: 'Calendrier des jalons', icon: Calendar },
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'webhooks', label: 'Webhooks Sortants', icon: Webhook },
    { id: 'automations', label: 'Automatisations', icon: Zap },
    { id: 'workflow', label: 'Workflow & Statuts', icon: GitFork },
    { id: 'custom_fields', label: 'Champs personnalisés', icon: SlidersHorizontal },
    { id: 'members', label: 'Membres & Rôles', icon: Users },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 flex flex-col justify-between hidden md:flex select-none">
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Projects Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            <span>Projets actifs</span>
            {can('edit_project') && (
              <button
                type="button"
                onClick={onOpenNewProjectModal}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                title="Nouveau projet"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {projects.map((proj) => {
              const isSelected = currentProject?.id === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => setCurrentProject(proj)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: proj.color }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleDuplicate(e, proj)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-md cursor-pointer"
                      title="Dupliquer comme template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View Navigation */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 block">
            Navigation du projet
          </span>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Saved Views Section */}
        {savedViews.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Vues personnalisées
            </span>
            <div className="space-y-1">
              {savedViews.map((sv) => (
                <button
                  type="button"
                  key={sv.id}
                  onClick={() => setActiveView(sv.type)}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left truncate cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{sv.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer Info & Gemini shortcut */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {onOpenPlanModal && (
          <button
            type="button"
            onClick={onOpenPlanModal}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-between shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4 text-white" />
              Générer un plan (IA)
            </span>
            <ChevronRight className="w-4 h-4 opacity-75" />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenAiModal}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-indigo-500/10 hover:from-indigo-500/20 hover:to-sky-500/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Assistant Gemini
          </span>
          <ChevronRight className="w-4 h-4 opacity-50" />
        </button>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>FlexiFlow v1.0</span>
          <span>Google AI Studio</span>
        </div>
      </div>

    </aside>
  );
}
