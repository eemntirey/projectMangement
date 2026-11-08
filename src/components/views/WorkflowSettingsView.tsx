import React, { useState } from 'react';
import { 
  GitFork, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Check, 
  Palette, 
  Sliders,
  Layers
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { WorkflowStatus, StatusType } from '../../types';

const STATUS_COLORS = [
  '#94a3b8', // Slate
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#10b981', // Emerald
  '#06b6d4'  // Cyan
];

export function WorkflowSettingsView() {
  const { currentProject, workflow, updateWorkflowStatuses } = useProject();
  const { can } = useAuth();

  const [statuses, setStatuses] = useState<WorkflowStatus[]>(workflow?.statuses || []);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(STATUS_COLORS[1]);
  const [newType, setNewType] = useState<StatusType>('in_progress');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!currentProject || !workflow) return null;

  // Move status up/down
  const moveStatus = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= statuses.length) return;

    const updated = [...statuses];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((s, idx) => ({ ...s, order: idx }));
    setStatuses(reordered);
    updateWorkflowStatuses(reordered);
  };

  // Add new status
  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newStatus: WorkflowStatus = {
      id: `st-${Date.now()}`,
      label: newLabel.trim(),
      color: newColor,
      type: newType,
      order: statuses.length
    };

    const updated = [...statuses, newStatus];
    setStatuses(updated);
    updateWorkflowStatuses(updated);
    setNewLabel('');
  };

  // Remove status
  const handleRemoveStatus = (statusId: string) => {
    if (statuses.length <= 2) {
      alert('Un workflow doit comporter au moins 2 statuts.');
      return;
    }
    const updated = statuses.filter(s => s.id !== statusId).map((s, idx) => ({ ...s, order: idx }));
    setStatuses(updated);
    updateWorkflowStatuses(updated);
  };

  // Update status property
  const handleUpdateStatusProp = (statusId: string, prop: keyof WorkflowStatus, val: any) => {
    const updated = statuses.map(s => s.id === statusId ? { ...s, [prop]: val } : s);
    setStatuses(updated);
    updateWorkflowStatuses(updated);
  };

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-6">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-600" />
            Personnalisation du Workflow & Statuts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ajoutez, renommez, colorisez et réordonnez les colonnes et états de votre projet.
          </p>
        </div>
      </div>

      {/* Live Kanban Preview */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-500" />
          Aperçu direct du flux Kanban
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statuses.map((st, i) => (
            <div
              key={st.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs font-bold whitespace-nowrap shrink-0 shadow-2xs"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
              <span className="text-slate-900 dark:text-white">{st.label}</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">({st.type})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Statuses List Editor */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Liste ordonnée des statuts ({statuses.length})
        </span>

        <div className="space-y-2">
          {statuses.map((st, index) => {
            return (
              <div
                key={st.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                  {/* Color circle with picker dropdown */}
                  <div className="relative group">
                    <span
                      className="w-6 h-6 rounded-full inline-block cursor-pointer ring-2 ring-white dark:ring-slate-900 shadow-xs"
                      style={{ backgroundColor: st.color }}
                      title="Changer la couleur"
                    />
                    <div className="absolute left-0 top-8 z-20 hidden group-hover:flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
                      {STATUS_COLORS.map(c => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => handleUpdateStatusProp(st.id, 'color', c)}
                          className="w-5 h-5 rounded-full hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Label Input */}
                  <input
                    type="text"
                    value={st.label}
                    onChange={(e) => handleUpdateStatusProp(st.id, 'label', e.target.value)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 bg-transparent text-slate-900 dark:text-white"
                  />

                  {/* State Type */}
                  <select
                    value={st.type}
                    onChange={(e) => handleUpdateStatusProp(st.id, 'type', e.target.value as StatusType)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <option value="not_started">Non commencé</option>
                    <option value="in_progress">En cours</option>
                    <option value="blocked">Bloqué</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>

                {/* Move & Delete Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveStatus(index, 'up')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    title="Monter"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={index === statuses.length - 1}
                    onClick={() => moveStatus(index, 'down')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    title="Descendre"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveStatus(st.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Supprimer le statut"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Status Form */}
      {can('manage_workflow') && (
        <form onSubmit={handleAddStatus} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Ajouter un nouveau statut
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Nom du statut
              </label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Prêt pour QA, En attente client..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Catégorie d'état
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as StatusType)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="not_started">Non commencé</option>
                <option value="in_progress">En cours</option>
                <option value="blocked">Bloqué</option>
                <option value="completed">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Couleur de la colonne
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {STATUS_COLORS.slice(0, 7).map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  >
                    {newColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!newLabel.trim()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajouter ce statut
          </button>
        </form>
      )}

    </div>
  );
}
