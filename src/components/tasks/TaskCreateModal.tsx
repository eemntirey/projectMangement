import React, { useState } from 'react';
import { X, Plus, Calendar, User, Tag, Clock, Check } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { TaskPriority } from '../../types';
import { DEMO_USERS } from '../../data/demoData';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatusId?: string;
}

export function TaskCreateModal({ isOpen, onClose, defaultStatusId }: TaskCreateModalProps) {
  const { currentProject, workflow, customFields, createTask } = useProject();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(defaultStatusId || workflow?.statuses[0]?.id || 'st-todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([DEMO_USERS[0].uid]);
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimateHours, setEstimateHours] = useState<number>(4);
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>(['Frontend']);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !currentProject) return null;

  const handleAddLabel = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && labelInput.trim()) {
      e.preventDefault();
      if (!labels.includes(labelInput.trim())) {
        setLabels([...labels, labelInput.trim()]);
      }
      setLabelInput('');
    }
  };

  const handleRemoveLabel = (lbl: string) => {
    setLabels(labels.filter(l => l !== lbl));
  };

  const handleToggleAssignee = (userId: string) => {
    if (assigneeIds.includes(userId)) {
      setAssigneeIds(assigneeIds.filter(id => id !== userId));
    } else {
      setAssigneeIds([...assigneeIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        statusId: statusId || workflow?.statuses[0]?.id || 'st-todo',
        priority,
        assigneeIds,
        dueDate: dueDate || undefined,
        startDate: startDate || undefined,
        estimateHours: Number(estimateHours) || 0,
        labels,
        customFields: customFieldValues
      });

      // reset form
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Créer une nouvelle tâche
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Projet : {currentProject.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Titre de la tâche <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Que faut-il accomplir ?"
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description et critères d'acceptation
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexte, étapes, liens utiles..."
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Grid row 1: Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Statut initial
              </label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {workflow?.statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 Élevée</option>
                <option value="medium">🔵 Moyenne</option>
                <option value="low">⚪ Basse</option>
              </select>
            </div>
          </div>

          {/* Grid row 2: Dates & Estimate */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date d'échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Estimation (heures)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimateHours}
                onChange={(e) => setEstimateHours(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Assignees selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Responsable(s) assigné(s)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {DEMO_USERS.map((user) => {
                const isSelected = assigneeIds.includes(user.uid);
                return (
                  <button
                    type="button"
                    key={user.uid}
                    onClick={() => handleToggleAssignee(user.uid)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-[10px] font-bold flex items-center justify-center">
                      {user.displayName[0]}
                    </span>
                    <span>{user.displayName}</span>
                    {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Étiquettes (appuyez sur Entrée pour ajouter)
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {labels.map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                >
                  #{lbl}
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(lbl)}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={handleAddLabel}
              placeholder="Ex: Backend, UI, Audit..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Dynamic Custom Fields */}
          {customFields.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                Champs personnalisés du projet
              </span>
              <div className="grid grid-cols-2 gap-3">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {field.name} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'select' && (
                      <select
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      >
                        <option value="">Sélectionner...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!customFieldValues[field.id]}
                          onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.checked })}
                          className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Activer / Valider</span>
                      </label>
                    )}

                    {field.type === 'url' && (
                      <input
                        type="url"
                        placeholder="https://..."
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Création...' : 'Créer la tâche'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
