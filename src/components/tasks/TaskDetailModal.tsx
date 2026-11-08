import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Plus, 
  Send, 
  MessageSquare, 
  Activity, 
  Link2, 
  AlertCircle,
  Tag,
  User,
  Check,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskPriority, Comment, Subtask } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { DEMO_USERS } from '../../data/demoData';
import { subscribeComments, addComment } from '../../firebase/firestoreService';
import confetti from 'canvas-confetti';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const { 
    currentProject, 
    workflow, 
    tasks, 
    customFields, 
    editTask, 
    removeTask 
  } = useProject();
  const { currentUser, can } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimateHours, setEstimateHours] = useState<number>(0);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatusId(task.statusId || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate || '');
      setStartDate(task.startDate || '');
      setEstimateHours(task.estimateHours || 0);
      setAssigneeIds(task.assigneeIds || []);
      setLabels(task.labels || []);
      setSubtasks(task.subtasks || []);
      setDependencyIds(task.dependencyIds || []);
      setCustomFieldValues(task.customFields || {});

      // Subscribe comments
      const unsub = subscribeComments(task.id, (cList) => {
        setComments(cList);
      });
      return () => unsub();
    }
  }, [task]);

  if (!isOpen || !task || !currentProject) return null;

  const currentStatus = workflow?.statuses.find(s => s.id === statusId) || workflow?.statuses[0];

  const handleSaveField = async (field: keyof Task, value: any) => {
    await editTask(task.id, { [field]: value });
  };

  // Subtasks logic
  const handleToggleSubtask = async (subId: string) => {
    const updated = subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
    setSubtasks(updated);
    await editTask(task.id, { subtasks: updated });

    // celebrate if all completed
    if (updated.length > 0 && updated.every(s => s.completed)) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    await editTask(task.id, { subtasks: updated });
  };

  const handleRemoveSubtask = async (subId: string) => {
    const updated = subtasks.filter(s => s.id !== subId);
    setSubtasks(updated);
    await editTask(task.id, { subtasks: updated });
  };

  // Comments
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comm: Comment = {
      id: `comm-${Date.now()}`,
      taskId: task.id,
      projectId: currentProject.id,
      userId: currentUser?.uid || 'user-admin',
      userDisplayName: currentUser?.displayName || 'Membre FlexiFlow',
      userPhotoURL: currentUser?.photoURL,
      content: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    await addComment(comm);
    setNewComment('');
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const availableDependencyTasks = tasks.filter(t => t.id !== task.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Header Bar */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-slate-400">
              #{task.id.slice(-6)}
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <select
              value={statusId}
              onChange={(e) => {
                setStatusId(e.target.value);
                handleSaveField('statusId', e.target.value);
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden"
              style={{ color: currentStatus?.color }}
            >
              {workflow?.statuses.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => {
                const val = e.target.value as TaskPriority;
                setPriority(val);
                handleSaveField('priority', val);
              }}
              className="text-xs font-medium px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 Élevée</option>
              <option value="medium">🔵 Moyenne</option>
              <option value="low">⚪ Basse</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {can('delete_task') && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
                    removeTask(task.id);
                    onClose();
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Supprimer la tâche"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Left Column: Title, Description, Subtasks, Dependencies (2 cols) */}
          <div className="md:col-span-2 p-6 space-y-6">
            
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveField('title', title)}
                className="w-full text-lg font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-hidden py-1 transition-colors"
                placeholder="Titre de la tâche"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Description & Notes
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleSaveField('description', description)}
                className="w-full text-xs leading-relaxed p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Ajoutez des détails, critères d'acceptation, liens de maquettes..."
              />
            </div>

            {/* Subtasks Section with Progress Bar */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-500" />
                  Sous-tâches ({completedSubtasks}/{subtasks.length})
                </span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {subtasksPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${subtasksPercent}%` }}
                />
              </div>

              {/* Subtasks List */}
              <div className="space-y-2">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={`text-xs ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 text-xs px-1.5 transition-opacity cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask input */}
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Ajouter une sous-tâche..."
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </button>
              </form>
            </div>

            {/* Task Dependencies */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-indigo-500" />
                Dépendances (Bloqué par)
              </span>

              {dependencyIds.length > 0 && (
                <div className="space-y-1.5">
                  {dependencyIds.map(depId => {
                    const depTask = tasks.find(t => t.id === depId);
                    return (
                      <div
                        key={depId}
                        className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{depTask?.title || `Tâche #${depId}`}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = dependencyIds.filter(id => id !== depId);
                            setDependencyIds(updated);
                            handleSaveField('dependencyIds', updated);
                          }}
                          className="hover:text-rose-500 cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <select
                onChange={(e) => {
                  if (e.target.value && !dependencyIds.includes(e.target.value)) {
                    const updated = [...dependencyIds, e.target.value];
                    setDependencyIds(updated);
                    handleSaveField('dependencyIds', updated);
                  }
                  e.target.value = '';
                }}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
              >
                <option value="">+ Ajouter une dépendance bloquante...</option>
                {availableDependencyTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Discussion & Comments */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Discussion & Échanges ({comments.length})
              </span>

              {/* Comments Feed */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun commentaire pour le moment.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex items-start gap-2.5 text-xs">
                      <Avatar name={c.userDisplayName} photoURL={c.userPhotoURL} size="xs" />
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {c.userDisplayName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment input */}
              <form onSubmit={handleSendComment} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Meta details, Assignees, Dates, Custom Fields (1 col) */}
          <div className="p-6 space-y-5 bg-slate-50/40 dark:bg-slate-950/30">
            
            {/* Assignees */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Assigné à
              </label>
              <div className="space-y-1.5">
                {DEMO_USERS.map(user => {
                  const isAssigned = assigneeIds.includes(user.uid);
                  return (
                    <button
                      type="button"
                      key={user.uid}
                      onClick={() => {
                        const updated = isAssigned
                          ? assigneeIds.filter(id => id !== user.uid)
                          : [...assigneeIds, user.uid];
                        setAssigneeIds(updated);
                        handleSaveField('assigneeIds', updated);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                        isAssigned
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={user.displayName} photoURL={user.photoURL} size="xs" />
                        <span>{user.displayName}</span>
                      </div>
                      {isAssigned && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleSaveField('dueDate', e.target.value);
                  }}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  Estimation (heures)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimateHours}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEstimateHours(val);
                    handleSaveField('estimateHours', val);
                  }}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Custom Fields of the Project */}
            {customFields.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Champs personnalisés
                </span>
                {customFields.map(field => (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      {field.name}
                    </label>

                    {field.type === 'select' && (
                      <select
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => {
                          const updated = { ...customFieldValues, [field.id]: e.target.value };
                          setCustomFieldValues(updated);
                          handleSaveField('customFields', updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="">Non défini</option>
                        {field.options?.map(opt => (
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
                        onChange={(e) => {
                          const updated = { ...customFieldValues, [field.id]: e.target.value };
                          setCustomFieldValues(updated);
                          handleSaveField('customFields', updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-2 text-xs py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!customFieldValues[field.id]}
                          onChange={(e) => {
                            const updated = { ...customFieldValues, [field.id]: e.target.checked };
                            setCustomFieldValues(updated);
                            handleSaveField('customFields', updated);
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{customFieldValues[field.id] ? 'Validé' : 'Non validé'}</span>
                      </label>
                    )}

                    {field.type === 'url' && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          value={customFieldValues[field.id] || ''}
                          onChange={(e) => {
                            const updated = { ...customFieldValues, [field.id]: e.target.value };
                            setCustomFieldValues(updated);
                            handleSaveField('customFields', updated);
                          }}
                          placeholder="https://..."
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                        {customFieldValues[field.id] && (
                          <a
                            href={customFieldValues[field.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-indigo-600 hover:text-indigo-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Labels Tags */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Étiquettes
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {labels.map(lbl => (
                  <span
                    key={lbl}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-medium"
                  >
                    #{lbl}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
