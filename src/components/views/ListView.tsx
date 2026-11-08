import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  FileText, 
  Check, 
  Calendar, 
  User, 
  Tag, 
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Task, TaskPriority } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { DEMO_USERS } from '../../data/demoData';

interface ListViewProps {
  onSelectTask: (task: Task) => void;
  onOpenCreateTask: () => void;
}

export function ListView({ onSelectTask, onOpenCreateTask }: ListViewProps) {
  const { 
    currentProject, 
    workflow, 
    tasks, 
    customFields, 
    editTask,
    isSemanticSearchActive,
    setIsSemanticSearchActive,
    runSemanticSearch
  } = useProject();

  const [search, setSearch] = useState('');
  const [isSearchingSemantics, setIsSearchingSemantics] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortField, setSortField] = useState<'title' | 'dueDate' | 'priority' | 'estimate'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'title', 'status', 'priority', 'assignees', 'dueDate', 'estimate', 'customFields'
  ]);
  const [showColPicker, setShowColPicker] = useState(false);

  // Sorting priorities mapping
  const priorityRank: Record<TaskPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (!isSemanticSearchActive && search.trim()) {
      const q = search.toLowerCase();
      const match = t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && t.statusId !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortField === 'dueDate') {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      comparison = dateA - dateB;
    } else if (sortField === 'priority') {
      comparison = priorityRank[b.priority] - priorityRank[a.priority];
    } else if (sortField === 'estimate') {
      comparison = (a.estimateHours || 0) - (b.estimateHours || 0);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: 'title' | 'dueDate' | 'priority' | 'estimate') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!currentProject) return;
    const headers = ['ID', 'Titre', 'Statut', 'Priorité', 'Assignés', 'Échéance', 'Estimation (h)'];
    const rows = sortedTasks.map(t => {
      const st = workflow?.statuses.find(s => s.id === t.statusId)?.label || t.statusId;
      const assignees = t.assigneeIds.map(id => DEMO_USERS.find(u => u.uid === id)?.displayName || id).join(', ');
      return [
        `"${t.id}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${st}"`,
        `"${t.priority}"`,
        `"${assignees}"`,
        `"${t.dueDate || ''}"`,
        `"${t.estimateHours || 0}"`
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentProject.name.replace(/\s+/g, '_')}_taches.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Markdown
  const handleExportMarkdown = () => {
    if (!currentProject) return;
    let md = `# Export Tâches - ${currentProject.name}\n\n`;
    md += `*Généré le ${new Date().toLocaleDateString()} - Total : ${sortedTasks.length} tâches*\n\n`;
    md += `| Titre | Statut | Priorité | Responsable(s) | Échéance |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    sortedTasks.forEach(t => {
      const st = workflow?.statuses.find(s => s.id === t.statusId)?.label || t.statusId;
      const assignees = t.assigneeIds.map(id => DEMO_USERS.find(u => u.uid === id)?.displayName || id).join(', ');
      md += `| ${t.title} | ${st} | ${t.priority.toUpperCase()} | ${assignees || '-'} | ${t.dueDate || '-'} |\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentProject.name.replace(/\s+/g, '_')}_taches.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      
      {/* Search, Filters and Export Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <form onSubmit={handleTriggerSemanticSearch} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                isSemanticSearchActive 
                  ? "Recherche sémantique par sens..." 
                  : "Filtrer les tâches..."
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
            title="Activer la recherche sémantique par similarité vectorielle"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vecteurs IA</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Tous statuts</option>
            {workflow?.statuses.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

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

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Exporter au format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Exporter au format Markdown"
            >
              <FileText className="w-3.5 h-3.5" />
              Markdown
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-slate-600 dark:text-slate-400 font-semibold sticky top-0 z-10 backdrop-blur-xs">
              
              <th
                onClick={() => toggleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Titre de la tâche</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-3">Statut</th>

              <th
                onClick={() => toggleSort('priority')}
                className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priorité</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-3">Assigné(s)</th>

              <th
                onClick={() => toggleSort('dueDate')}
                className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Échéance</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('estimate')}
                className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Estim.</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Dynamic custom fields columns */}
              {customFields.slice(0, 2).map(cf => (
                <th key={cf.id} className="py-3 px-3">
                  {cf.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Aucune tâche trouvée avec les critères actuels.
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => {
                const statusObj = workflow?.statuses.find(s => s.id === task.statusId) || {
                  label: task.statusId,
                  color: '#6366f1'
                };
                const assignees = task.assigneeIds.map(id => DEMO_USERS.find(u => u.uid === id)).filter(Boolean);
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

                return (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {task.title}
                          </span>
                          {task.similarityScore !== undefined && (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0"
                              title="Score de similarité sémantique"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                              {Math.round(task.similarityScore * 100)}%
                            </span>
                          )}
                        </div>
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {task.labels.map(l => (
                              <span key={l} className="text-[10px] text-slate-500 dark:text-slate-400">
                                #{l}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <StatusBadge label={statusObj.label} color={statusObj.color} size="sm" />
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <PriorityBadge priority={task.priority} size="sm" />
                    </td>

                    {/* Assignees */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center -space-x-1">
                        {assignees.map((u, i) => (
                          <Avatar key={i} name={u!.displayName} photoURL={u?.photoURL} size="xs" />
                        ))}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {task.dueDate ? (
                        <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                          {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Estimate */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {task.estimateHours ? `${task.estimateHours}h` : '-'}
                    </td>

                    {/* Custom fields values */}
                    {customFields.slice(0, 2).map(cf => (
                      <td key={cf.id} className="py-3.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {task.customFields?.[cf.id] !== undefined
                          ? String(task.customFields[cf.id])
                          : '-'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
