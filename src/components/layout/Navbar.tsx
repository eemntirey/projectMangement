import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Bell, 
  Kanban, 
  List, 
  Calendar, 
  LayoutDashboard, 
  Zap, 
  GitFork, 
  SlidersHorizontal, 
  Users, 
  ChevronDown, 
  LogOut, 
  LogIn, 
  Check, 
  Share2,
  Webhook,
  Target
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { Avatar } from '../common/Avatar';
import { ViewType } from '../../types';

interface NavbarProps {
  onOpenCreateTask: () => void;
  onOpenAiModal: () => void;
  onOpenPlanModal?: () => void;
  onOpenInviteModal: () => void;
  onOpenNewProjectModal: () => void;
}

export function Navbar({
  onOpenCreateTask,
  onOpenAiModal,
  onOpenPlanModal,
  onOpenInviteModal,
  onOpenNewProjectModal
}: NavbarProps) {
  const { 
    currentProject, 
    projects, 
    setCurrentProject, 
    activeView, 
    setActiveView, 
    notifications, 
    unreadNotifsCount, 
    markAllNotificationsAsRead,
    markNotificationAsRead 
  } = useProject();

  const { currentUser, currentOrg, signInWithGoogle, signOut, can } = useAuth();

  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const views: Array<{ id: ViewType; label: string; icon: any }> = [
    { id: 'kanban', label: 'Kanban', icon: Kanban },
    { id: 'list', label: 'Liste', icon: List },
    { id: 'calendar', label: 'Calendrier', icon: Calendar },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'automations', label: 'Automatisations', icon: Zap },
    { id: 'workflow', label: 'Workflow', icon: GitFork },
    { id: 'custom_fields', label: 'Champs', icon: SlidersHorizontal },
    { id: 'members', label: 'Équipe', icon: Users },
  ];

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 flex items-center justify-between gap-4 z-30 select-none">
      
      {/* Left side: Logo + Org & Project Switcher */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 pr-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <span className="font-extrabold text-base tracking-tighter">FF</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
              FlexiFlow
            </h1>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 block -mt-0.5">
              Workflows Agile
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProjectsDropdown(!showProjectsDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white transition-colors cursor-pointer"
          >
            {currentProject && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentProject.color }}
              />
            )}
            <span className="max-w-[150px] truncate">
              {currentProject?.name || 'Sélectionner un projet'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProjectsDropdown && (
            <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-2 space-y-1 z-50 animate-in fade-in">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vos projets ({projects.length})
              </div>
              {projects.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    setCurrentProject(p);
                    setShowProjectsDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    currentProject?.id === p.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </div>
                  {currentProject?.id === p.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectsDropdown(false);
                    onOpenNewProjectModal();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nouveau projet...
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: View Switcher Tabs */}
      <nav className="hidden lg:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = activeView === v.id;
          return (
            <button
              type="button"
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{v.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right side: Actions, AI, Notifs, Theme, User Profile */}
      <div className="flex items-center gap-2">
        
        {/* Autonomous Planning AI Agent Button */}
        {onOpenPlanModal && (
          <button
            type="button"
            onClick={onOpenPlanModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            title="Agent IA de Planification Autonome"
          >
            <Target className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Planifier le projet</span>
          </button>
        )}

        {/* Gemini AI Assistant Button */}
        <button
          type="button"
          onClick={onOpenAiModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-indigo-500/10 hover:from-indigo-500/20 hover:to-sky-500/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
          title="Assistant IA Gemini"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Assistant IA</span>
        </button>

        {/* New Task Button */}
        {can('create_task') && (
          <button
            type="button"
            onClick={onOpenCreateTask}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Tâche</span>
          </button>
        )}

        {/* Invite Member */}
        <button
          type="button"
          onClick={onOpenInviteModal}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Inviter un membre"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Notifications Center */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifsDropdown(!showNotifsDropdown)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifsDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-3 space-y-2 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Notifications ({unreadNotifsCount})
                </span>
                {unreadNotifsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Aucune notification.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-2.5 rounded-xl border text-xs space-y-1 transition-colors cursor-pointer ${
                        n.read
                          ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 text-slate-600 dark:text-slate-400'
                          : 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 text-slate-900 dark:text-white font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile / Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all cursor-pointer"
          >
            <Avatar name={currentUser?.displayName || 'User'} photoURL={currentUser?.photoURL} size="sm" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-3 space-y-3 z-50 animate-in fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Avatar name={currentUser?.displayName || 'User'} photoURL={currentUser?.photoURL} size="md" />
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {currentUser?.displayName}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {currentUser?.email}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 inline-block mt-1">
                    {currentUser?.role || 'admin'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    signInWithGoogle();
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-indigo-600" />
                  Connexion Google Firebase
                </button>

                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
