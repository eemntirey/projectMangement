import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { GeneratedProjectPlan, ProjectPlanTask } from '../../types';
import { DEMO_USERS } from '../../data/demoData';

interface ProjectPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectPlanModal({ isOpen, onClose }: ProjectPlanModalProps) {
  const { currentProject, createTasksFromPlan } = useProject();
  const { currentUser } = useAuth();

  const [goal, setGoal] = useState<string>('Lancer la v2.0 du produit avec architecture microservices, paiements Stripe et tests de charge');
  const [description, setDescription] = useState<string>('Objectif majeur du Q4 : refonte des APIs de facturation, onboarding simplifié et monitoring Datadog.');
  const [timeline, setTimeline] = useState<string>('4 semaines');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(DEMO_USERS.map(u => u.displayName));
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedProjectPlan | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isCreatingTasks, setIsCreatingTasks] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !currentProject) return null;

  const handleToggleMember = (name: string) => {
    setSelectedMembers(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const handleGeneratePlan = async () => {
    if (!goal.trim()) {
      setErrorMessage('Veuillez renseigner un objectif pour le projet.');
      return;
    }
    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/gemini/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectGoal: goal,
          projectDescription: description,
          teamMembers: selectedMembers,
          timeline
        })
      });

      if (!res.ok) {
        throw new Error(`Erreur lors de la génération: ${res.statusText}`);
      }

      const plan: GeneratedProjectPlan = await res.json();
      const normalizedTasks = plan.tasks.map((t, idx) => ({
        ...t,
        id: t.id || `plan-task-${idx}`
      }));
      const normalizedPlan = { ...plan, tasks: normalizedTasks };
      setGeneratedPlan(normalizedPlan);
      // Select all tasks by default
      setSelectedTaskIds(new Set(normalizedTasks.map(t => t.id!)));
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setErrorMessage(err.message || 'Impossible de générer le plan avec Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const next = new Set(selectedTaskIds);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setSelectedTaskIds(next);
  };

  const handleSelectAll = (select: boolean) => {
    if (select && generatedPlan) {
      setSelectedTaskIds(new Set(generatedPlan.tasks.map(t => t.id || '')));
    } else {
      setSelectedTaskIds(new Set());
    }
  };

  const handleConfirmImport = async () => {
    if (!generatedPlan) return;
    const tasksToCreate = generatedPlan.tasks.filter(t => t.id && selectedTaskIds.has(t.id));
    if (tasksToCreate.length === 0) {
      setErrorMessage('Sélectionnez au moins une tâche à importer.');
      return;
    }

    setIsCreatingTasks(true);
    try {
      const count = await createTasksFromPlan(tasksToCreate);
      setSuccessMessage(`${count} tâches créées et associées au projet "${currentProject.name}" avec succès !`);
      setTimeout(() => {
        onClose();
        setGeneratedPlan(null);
        setSuccessMessage(null);
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la création des tâches.');
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">Urgent</span>;
      case 'high':
        return <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Élevée</span>;
      case 'medium':
        return <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Moyenne</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Basse</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                Agent IA de Planification Autonome
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Générez un WBS structuré (Work Breakdown Structure) avec jalons, estimations et dépendances pour « {currentProject.name} ».
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 text-sm rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 text-sm rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {!generatedPlan ? (
            /* Input Form */
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  Objectif principal du projet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="ex: Lancer la v2.0 du produit avec facturation Stripe"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  Contexte & exigences particulières (optionnel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Détails techniques, livrables attendus, contraintes de sécurité ou de conformité..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                    Durée cible / Échéance
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="ex: 4 semaines, Fin du trimestre, Sprint de 15 jours"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                    Membres disponibles pour l'assignation
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {DEMO_USERS.map((user) => {
                      const isSelected = selectedMembers.includes(user.displayName);
                      return (
                        <button
                          key={user.uid}
                          type="button"
                          onClick={() => handleToggleMember(user.displayName)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:border-indigo-400'
                          }`}
                        >
                          {user.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* AI Agent Features Callout */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">Fonctionnement autonome par Function Calling :</span> L'agent IA utilise le schéma standardisé de FlexiFlow pour déduire les phases logiques, assigner la personne la plus compétente selon son profil, estimer les charges en heures et chaîner les dépendances techniques (ex: API terminée avant tests frontend).
                </div>
              </div>
            </div>
          ) : (
            /* Generated Plan Preview */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-200">
                    {generatedPlan.planSummary || 'Plan de projet généré'}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                    <span>Durée estimée : <strong>{generatedPlan.estimatedDuration}</strong></span>
                    <span>•</span>
                    <span>Tâches générées : <strong>{generatedPlan.tasks.length}</strong></span>
                    <span>•</span>
                    <span>Sélectionnées : <strong>{selectedTaskIds.size}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(selectedTaskIds.size !== generatedPlan.tasks.length)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                  >
                    {selectedTaskIds.size === generatedPlan.tasks.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratedPlan(null)}
                    className="text-xs px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Recommencer
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {generatedPlan.tasks.map((task: ProjectPlanTask, idx: number) => {
                  const taskId = task.id || `task-${idx}`;
                  const isChecked = selectedTaskIds.has(taskId);
                  const assignee = task.suggestedAssignee || task.suggestedAssigneeName;

                  return (
                    <div
                      key={taskId}
                      onClick={() => handleToggleTask(taskId)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-indigo-400 bg-white dark:bg-zinc-850 dark:border-indigo-600/80 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTask(taskId)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                              {task.title}
                              {task.phase && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                                  {task.phase}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(task.priority)}
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                ~{task.estimateHours}h
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {assignee && (
                              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {assignee}
                              </span>
                            )}

                            {task.dependencies && task.dependencies.length > 0 && (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Dépend de {task.dependencies.length} tâche(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            Fermer
          </button>

          {!generatedPlan ? (
            <button
              type="button"
              disabled={isGenerating || !goal.trim()}
              onClick={handleGeneratePlan}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Génération autonome en cours...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Générer le plan avec Gemini 3.8 Flash
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={isCreatingTasks || selectedTaskIds.size === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isCreatingTasks ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Création dans Firestore...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Créer les {selectedTaskIds.size} tâches sélectionnées
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
