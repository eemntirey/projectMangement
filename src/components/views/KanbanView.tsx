import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckSquare, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Layers, 
  Sparkles,
  Link2
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Task, WorkflowStatus, TaskPriority } from '../../types';
import { PriorityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { DEMO_USERS } from '../../data/demoData';

interface KanbanViewProps {
  onSelectTask: (task: Task) => void;
  onOpenCreateTask: (statusId?: string) => void;
}

export function KanbanView({ onSelectTask, onOpenCreateTask }: KanbanViewProps) {
  const { 
    workflow, 
    tasks, 
    moveTaskStatus, 
    customFields,
    isSemanticSearchActive,
    setIsSemanticSearchActive,
    runSemanticSearch
  } = useProject();
  const [search, setSearch] = useState('');
  const [isSearchingSemantics, setIsSearchingSemantics] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (!isSemanticSearchActive && !val) {
      runSemanticSearch('');
    }
  };

  const handleTriggerSemanticSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!search.trim()) {
      runSemanticSearch('');
      return;
    }
    setIsSearchingSemantics(true);
    try {
      await runSemanticSearch(search);
    } finally {
      setIsSearchingSemantics(false);
    }
  };

  // Filter tasks (when semantic search is active, tasks are already ranked by similarity score)
  const filteredTasks = tasks.filter((t) => {
    if (!isSemanticSearchActive && search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchLabels = t.labels?.some(l => l.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLabels) return false;
    }
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'all' && !t.assigneeIds.includes(assigneeFilter)) return false;
    return true;
  });

  const statuses = workflow?.statuses || [];

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    if (dragOverColId !== statusId) {
      setDragOverColId(statusId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColId(null);
    setDraggedTaskId(null);

    if (taskId) {
      await moveTaskStatus(taskId, targetStatusId);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      
      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <form onSubmit={handleTriggerSemanticSearch} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                isSemanticSearchActive 
                  ? "Recherche sémantique par sens (ex: problème paiement, conformité, lenteurs)..." 
                  : "Rechercher par titre, description, étiquette..."
              }
              className={`w-full text-xs pl-9 pr-24 py-2 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 shadow-xs transition-colors ${
                isSemanticSearchActive 
                  ? 'border-indigo-400 ring-1 ring-indigo-400/30 focus:ring-indigo-500' 
                  : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
              }`}
            />
            {isSemanticSearchActive && (
              <button
                type="submit"
                disabled={isSearchingSemantics}
                className="absolute right-1.5 top-1 px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1"
              >
                {isSearchingSemantics ? (
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Trouver
              </button>
            )}
          </form>

          {/* Semantic Search Mode Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const next = !isSemanticSearchActive;
              setIsSemanticSearchActive(next);
              if (!next) {
                runSemanticSearch('');
              } else if (search.trim()) {
                runSemanticSearch(search);
              }
            }}
            className={`text-xs px-3 py-2 rounded-xl border font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              isSemanticSearchActive
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
            }`}
            title="Activer la recherche sémantique par similarité vectorielle (embeddings Gemini)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vecteurs IA</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtres :</span>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Toutes priorités</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 Élevée</option>
            <option value="medium">🔵 Moyenne</option>
            <option value="low">⚪ Basse</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Tous les membres</option>
            {DEMO_USERS.map(u => (
              <option key={u.uid} value={u.uid}>
                {u.displayName}
              </option>
            ))}
          </select>

          {(search || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setPriorityFilter('all'); setAssigneeFilter('all'); }}
              className="text-xs text-rose-500 hover:underline px-1 cursor-pointer"
            >
              Effacer filtres
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex items-start gap-4 min-w-max h-full">
          {statuses.map((status) => {
            const colTasks = filteredTasks.filter(t => t.statusId === status.id);
            const totalHours = colTasks.reduce((acc, t) => acc + (t.estimateHours || 0), 0);
            const isDragOver = dragOverColId === status.id;

            return (
              <div
                key={status.id}
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDragLeave={() => setDragOverColId(null)}
                onDrop={(e) => handleDrop(e, status.id)}
                className={`w-72 shrink-0 flex flex-col max-h-full rounded-2xl border transition-all ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-400/50'
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/60'
                }`}
              >
                {/* Column Header */}
                <div className="p-3 px-3.5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {status.label}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {colTasks.length}
                    </span>
                  </div>

                  {totalHours > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {totalHours}h
                    </span>
                  )}
                </div>

                {/* Column Cards List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[140px]">
                  {colTasks.map((task) => {
                    const assignees = task.assigneeIds.map(id => DEMO_USERS.find(u => u.uid === id)).filter(Boolean);
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && status.type !== 'completed';
                    const subtasksCount = task.subtasks?.length || 0;
                    const completedSubs = task.subtasks?.filter(s => s.completed).length || 0;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onSelectTask(task)}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all cursor-pointer group active:scale-[0.99] space-y-2.5"
                      >
                        {/* Header: Priority & Labels */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <PriorityBadge priority={task.priority} size="sm" />
                            {task.similarityScore !== undefined && (
                              <span 
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                title="Score de similarité sémantique cosine"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                {Math.round(task.similarityScore * 100)}%
                              </span>
                            )}
                          </div>
                          {task.dependencyIds && task.dependencyIds.length > 0 && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md"
                              title="Tâche dépendante d'autres tâches"
                            >
                              <Link2 className="w-3 h-3" />
                              Bloqué
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {task.title}
                        </h4>

                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {task.labels.map(l => (
                              <span
                                key={l}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              >
                                #{l}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Custom fields snippet */}
                        {task.customFields && Object.keys(task.customFields).length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {Object.entries(task.customFields).slice(0, 2).map(([key, val]) => {
                              const def = customFields.find(f => f.id === key);
                              if (!val) return null;
                              return (
                                <span
                                  key={key}
                                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                                >
                                  {def?.name || key}: {String(val)}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Card Footer: Due Date, Subtasks, Assignees */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}

                            {subtasksCount > 0 && (
                              <span className="flex items-center gap-0.5">
                                <CheckSquare className="w-3 h-3 text-slate-400" />
                                {completedSubs}/{subtasksCount}
                              </span>
                            )}
                          </div>

                          {/* Avatars */}
                          <div className="flex items-center -space-x-1.5">
                            {assignees.map((u, i) => (
                              <Avatar key={i} name={u!.displayName} photoURL={u?.photoURL} size="xs" />
                            ))}
                          </div>
                        </div>

                      </div>
                    );
                  })}

                  {/* Add Quick Task in Column */}
                  <button
                    type="button"
                    onClick={() => onOpenCreateTask(status.id)}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white/40 dark:bg-slate-800/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter une tâche
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
