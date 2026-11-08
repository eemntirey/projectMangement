import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Check, 
  Hourglass, 
  BarChart3,
  Calendar
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Avatar } from '../common/Avatar';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { DEMO_USERS } from '../../data/demoData';

interface DashboardViewProps {
  onOpenAiModal: () => void;
  onSelectTask: (task: any) => void;
}

export function DashboardView({ onOpenAiModal, onSelectTask }: DashboardViewProps) {
  const { currentProject, workflow, tasks } = useProject();

  if (!currentProject) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => {
    const s = workflow?.statuses.find(st => st.id === t.statusId);
    return s?.type === 'completed';
  });
  const inProgressTasks = tasks.filter(t => {
    const s = workflow?.statuses.find(st => st.id === t.statusId);
    return s?.type === 'in_progress';
  });
  const blockedTasks = tasks.filter(t => {
    const s = workflow?.statuses.find(st => st.id === t.statusId);
    return s?.type === 'blocked';
  });

  const now = new Date();
  const overdueTasks = tasks.filter(t => {
    const s = workflow?.statuses.find(st => st.id === t.statusId);
    return t.dueDate && new Date(t.dueDate) < now && s?.type !== 'completed';
  });

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const totalHours = tasks.reduce((acc, t) => acc + (t.estimateHours || 0), 0);

  // Workload per member
  const memberWorkload = DEMO_USERS.map(user => {
    const userTasks = tasks.filter(t => t.assigneeIds.includes(user.uid));
    const userCompleted = userTasks.filter(t => {
      const s = workflow?.statuses.find(st => st.id === t.statusId);
      return s?.type === 'completed';
    });
    const hours = userTasks.reduce((acc, t) => acc + (t.estimateHours || 0), 0);
    return {
      user,
      taskCount: userTasks.length,
      completedCount: userCompleted.length,
      hours
    };
  });

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-6">
      
      {/* Top Banner with AI Report shortcut */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 text-white shadow-lg flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
            Tableau de bord exécutif
          </span>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            {currentProject.name}
          </h2>
          <p className="text-xs text-indigo-100 max-w-xl">
            {currentProject.description || 'Suivi en temps réel de la vélocité, de la charge d\'équipe et des échéances critiques.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAiModal}
          className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Générer rapport de statut avec Gemini
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Avancement */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Taux d'avancement</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {completionPercent}%
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 block">
            {completedTasks.length} sur {totalTasks} tâches terminées
          </span>
        </div>

        {/* En cours */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>En cours d'exécution</span>
            <Hourglass className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {inProgressTasks.length}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Flux actif sur les colonnes de production
          </span>
        </div>

        {/* Bloqués / Risques */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Tâches bloquées</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {blockedTasks.length}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Dépendances non résolues ou blocages
          </span>
        </div>

        {/* En retard */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>En retard d'échéance</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {overdueTasks.length}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Action requise pour respecter le jalon
          </span>
        </div>

      </div>

      {/* Grid: Status Distribution & Member Workload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Status Distribution */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Répartition par statut de workflow
          </h3>

          <div className="space-y-3">
            {workflow?.statuses.map(st => {
              const count = tasks.filter(t => t.statusId === st.id).length;
              const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
              return (
                <div key={st.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                      {st.label}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: st.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Member Workload Balance */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Charge de travail par membre
          </h3>

          <div className="space-y-3">
            {memberWorkload.map(mw => {
              const pct = totalTasks > 0 ? Math.round((mw.taskCount / totalTasks) * 100) : 0;
              return (
                <div key={mw.user.uid} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={mw.user.displayName} photoURL={mw.user.photoURL} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {mw.user.displayName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {mw.hours}h estimées • {mw.completedCount}/{mw.taskCount} accomplies
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {mw.taskCount} tâches
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Critical Attention list: Overdue & Blocked Tasks */}
      {(overdueTasks.length > 0 || blockedTasks.length > 0) && (
        <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Points de vigilance immédiats
          </h3>

          <div className="divide-y divide-amber-200/50 dark:divide-amber-900/40">
            {[...overdueTasks, ...blockedTasks.filter(bt => !overdueTasks.some(ot => ot.id === bt.id))].map(task => {
              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-100/40 dark:hover:bg-amber-900/30 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {task.title}
                    </span>
                    {task.dueDate && new Date(task.dueDate) < now && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded-md">
                        En retard ({new Date(task.dueDate).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                  <PriorityBadge priority={task.priority} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
