import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Check, 
  History, 
  Bell, 
  Tag, 
  UserCheck, 
  ArrowRight,
  ListPlus,
  Play
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Automation, 
  AutomationTrigger, 
  AutomationActionType, 
  TaskPriority 
} from '../../types';
import { DEMO_USERS } from '../../data/demoData';

export function AutomationsView() {
  const { 
    currentProject, 
    workflow, 
    automations, 
    automationLogs, 
    toggleAutomation, 
    createAutomation, 
    removeAutomation 
  } = useProject();
  const { can } = useAuth();

  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');
  const [showBuilder, setShowBuilder] = useState(false);

  // New rule builder form state
  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationTrigger>('status_changed');
  const [triggerValue, setTriggerValue] = useState('');
  const [actionType, setActionType] = useState<AutomationActionType>('send_notification');
  const [actionTarget, setActionTarget] = useState(DEMO_USERS[0].uid);
  const [actionExtra, setActionExtra] = useState('');

  if (!currentProject) return null;

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    await createAutomation({
      name: ruleName.trim(),
      enabled: true,
      trigger: {
        type: triggerType,
        value: triggerValue || (workflow?.statuses[0]?.id || 'st-todo')
      },
      conditions: [],
      actions: [
        {
          type: actionType,
          targetValue: actionTarget,
          extraValue: actionExtra
        }
      ]
    });

    // Reset
    setRuleName('');
    setActionExtra('');
    setShowBuilder(false);
  };

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-6">
      
      {/* Header Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            Automatisations No-Code
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Créez des règles conditionnelles : SI [Événement] ALORS [Action automatique].
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs: Rules vs Logs */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Règles actives ({automations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'logs'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Journal d'exécution ({automationLogs.length})
            </button>
          </div>

          {can('manage_automations') && activeTab === 'rules' && (
            <button
              type="button"
              onClick={() => setShowBuilder(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nouvelle automatisation
            </button>
          )}
        </div>
      </div>

      {/* Builder Modal / Form */}
      {showBuilder && (
        <div className="p-5 rounded-2xl border-2 border-indigo-500 bg-white dark:bg-slate-900 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Créer une règle d'automatisation
            </h3>
            <button
              type="button"
              onClick={() => setShowBuilder(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Annuler
            </button>
          </div>

          <form onSubmit={handleCreateRule} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nom descriptif de la règle
              </label>
              <input
                type="text"
                required
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Ex: Quand une tâche devient Urgente, assigner Alexandre et ajouter #Critique"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* IF / THEN Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* TRIGGER (SI) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  SI (Déclencheur)
                </span>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Événement déclencheur
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as AutomationTrigger)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="status_changed">Statut de la tâche modifié</option>
                    <option value="priority_changed">Priorité modifiée</option>
                    <option value="task_created">Nouvelle tâche créée</option>
                  </select>
                </div>

                {triggerType === 'status_changed' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Quand le statut passe à :
                    </label>
                    <select
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {workflow?.statuses.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {triggerType === 'priority_changed' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Quand la priorité devient :
                    </label>
                    <select
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="urgent">🔴 Urgent</option>
                      <option value="high">🟠 Élevée</option>
                      <option value="medium">🔵 Moyenne</option>
                      <option value="low">⚪ Basse</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ACTION (ALORS) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  ALORS (Action automatique)
                </span>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Action à exécuter
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as AutomationActionType)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="send_notification">Envoyer une notification in-app</option>
                    <option value="add_label">Ajouter une étiquette</option>
                    <option value="assign_user">Assigner à un membre</option>
                    <option value="change_status">Changer le statut</option>
                    <option value="create_subtask">Créer une sous-tâche</option>
                  </select>
                </div>

                {actionType === 'send_notification' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Destinataire de la notification
                      </label>
                      <select
                        value={actionTarget}
                        onChange={(e) => setActionTarget(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {DEMO_USERS.map(u => (
                          <option key={u.uid} value={u.uid}>
                            {u.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Message personnalisé
                      </label>
                      <input
                        type="text"
                        value={actionExtra}
                        onChange={(e) => setActionExtra(e.target.value)}
                        placeholder="Ex: Tâche urgente nécessitant une validation..."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {actionType === 'add_label' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nom de l'étiquette à ajouter
                    </label>
                    <input
                      type="text"
                      required
                      value={actionTarget}
                      onChange={(e) => setActionTarget(e.target.value)}
                      placeholder="Ex: Urgent, Revue, Bloquant..."
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {actionType === 'assign_user' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Membre à assigner
                    </label>
                    <select
                      value={actionTarget}
                      onChange={(e) => setActionTarget(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {DEMO_USERS.map(u => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {actionType === 'change_status' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nouveau statut cible
                    </label>
                    <select
                      value={actionTarget}
                      onChange={(e) => setActionTarget(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {workflow?.statuses.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {actionType === 'create_subtask' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Titre de la sous-tâche
                    </label>
                    <input
                      type="text"
                      required
                      value={actionTarget}
                      onChange={(e) => setActionTarget(e.target.value)}
                      placeholder="Ex: Vérifier la documentation..."
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!ruleName.trim()}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                Enregistrer la règle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 1: RULES LIST */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {automations.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
              Aucune automatisation configurée pour ce projet.
            </div>
          ) : (
            automations.map((auto) => {
              return (
                <div
                  key={auto.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      auto.enabled ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}>
                      <Zap className="w-5 h-5 fill-current" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {auto.name}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          auto.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}>
                          {auto.enabled ? 'Actif' : 'Désactivé'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span>Déclencheur : <strong>{auto.trigger.type}</strong></span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>Action : <strong>{auto.actions.map(a => a.type).join(', ')}</strong></span>
                      </div>

                      {auto.executionCount !== undefined && (
                        <div className="text-[11px] text-slate-400 pt-0.5">
                          Exécutée {auto.executionCount} fois • Dernière exécution : {auto.lastExecutedAt ? new Date(auto.lastExecutedAt).toLocaleString() : 'Jamais'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Switch */}
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={auto.enabled}
                        onChange={(e) => toggleAutomation(auto.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>

                    {can('manage_automations') && (
                      <button
                        type="button"
                        onClick={() => removeAutomation(auto.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Supprimer la règle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: EXECUTION LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Historique des exécutions automatiques
            </span>
            <span className="text-xs text-slate-400">
              Audit trail en direct
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {automationLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Aucun journal d'exécution enregistré pour le moment.
              </div>
            ) : (
              automationLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {log.automationName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                        Succès
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Tâche ciblée : <strong>{log.taskTitle}</strong> • {log.details}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
