import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { WebhookConfig, WebhookEvent, WebhookLog } from '../../types';

const AVAILABLE_EVENTS: { id: WebhookEvent; label: string; desc: string }[] = [
  { id: 'task.created', label: 'Tâche créée', desc: 'Quand une nouvelle tâche est ajoutée au projet' },
  { id: 'task.status_changed', label: 'Statut modifié', desc: 'Quand une tâche change de colonne ou d\'état dans le workflow' },
  { id: 'task.updated', label: 'Tâche mise à jour', desc: 'Quand les priorités, échéances ou détails sont modifiés' },
  { id: 'task.deleted', label: 'Tâche supprimée', desc: 'Quand une tâche est archivée ou supprimée définitivement' },
  { id: 'comment.added', label: 'Commentaire ajouté', desc: 'Quand une discussion ou une note est publiée sur une tâche' }
];

export function WebhooksView() {
  const { 
    currentProject, 
    webhooks, 
    webhookLogs, 
    addWebhook, 
    updateWebhook, 
    removeWebhook, 
    testWebhook 
  } = useProject();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>(['task.created', 'task.status_changed']);

  if (!currentProject) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Veuillez sélectionner un projet pour configurer ses webhooks.
      </div>
    );
  }

  const handleToggleEvent = (event: WebhookEvent) => {
    setSelectedEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    try {
      await addWebhook({
        name: name.trim(),
        url: url.trim(),
        secret: secret.trim() || undefined,
        events: selectedEvents.length > 0 ? selectedEvents : ['task.created'],
        enabled: true
      });

      setName('');
      setUrl('');
      setSecret('');
      setSelectedEvents(['task.created', 'task.status_changed']);
      setIsAddModalOpen(false);
      setFeedbackMessage({ type: 'success', text: 'Webhook enregistré avec succès.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur lors de la création du webhook.' });
    }
  };

  const handleTestWebhook = async (wh: WebhookConfig) => {
    setTestingWebhookId(wh.id);
    setFeedbackMessage(null);
    try {
      const log = await testWebhook(wh);
      if (log.status === 'success') {
        setFeedbackMessage({
          type: 'success',
          text: `Envoi réussi ! HTTP ${log.httpStatus} (${log.durationMs}ms)`
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: `Échec d'envoi (${log.error || `HTTP ${log.httpStatus}`})`
        });
      }
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur de test.' });
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleToggleEnabled = async (wh: WebhookConfig) => {
    await updateWebhook(wh.id, { enabled: !wh.enabled });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <span>Moteur de Webhooks Sortants</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Événements en direct
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Transmettez automatiquement les événements du projet « {currentProject.name} » vers vos serveurs, Slack, GitHub Actions, n8n ou Zapier par requêtes POST signées.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un Webhook
        </button>
      </div>

      {feedbackMessage && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
            : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
        }`}>
          {feedbackMessage.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Webhooks Configured List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            Points de terminaison configurés
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {webhooks.length}
            </span>
          </h2>
        </div>

        {webhooks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40">
            <svg className="w-10 h-10 text-zinc-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Aucun webhook configuré</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Ajoutez votre première URL d'écoute pour synchroniser FlexiFlow avec vos outils externes en temps réel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {webhooks.map((wh) => (
              <div 
                key={wh.id}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${wh.enabled ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-zinc-400'}`} />
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                      {wh.name}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      wh.enabled 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {wh.enabled ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg truncate inline-block max-w-full">
                    POST {wh.url}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-zinc-500">Déclencheurs :</span>
                    {wh.events.map(ev => (
                      <span key={ev} className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium font-mono">
                        {ev}
                      </span>
                    ))}
                    {wh.secret && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                        Secret: ••••••••
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleEnabled(wh)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {wh.enabled ? 'Désactiver' : 'Activer'}
                  </button>

                  <button
                    onClick={() => handleTestWebhook(wh)}
                    disabled={testingWebhookId === wh.id}
                    className="text-xs px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors flex items-center gap-1.5 font-medium disabled:opacity-50"
                  >
                    {testingWebhookId === wh.id ? (
                      <>
                        <svg className="animate-spin w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        Test en cours...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                        Tester le webhook
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => removeWebhook(wh.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Supprimer ce webhook"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook Delivery Logs Table */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              Journal d'envois des webhooks
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {webhookLogs.length} entrées
              </span>
            </h2>
            <p className="text-xs text-zinc-500">
              Historique des requêtes HTTP POST expédiées avec codes de retour, temps de latence et réponses.
            </p>
          </div>
        </div>

        {webhookLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl">
            Aucun historique de livraison pour le moment.
          </div>
        ) : (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                  <tr>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Événement</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Latence</th>
                    <th className="py-3 px-4">Date / Heure</th>
                    <th className="py-3 px-4 text-right">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                  {webhookLogs.map((log) => {
                    const isSuccess = log.status === 'success';
                    return (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4 font-sans">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {log.httpStatus ? `HTTP ${log.httpStatus}` : 'Erreur réseau'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-medium">
                          {log.event}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate" title={log.url}>
                          {log.webhookName || log.url}
                        </td>
                        <td className="py-3 px-4 text-zinc-500">
                          {log.durationMs}ms
                        </td>
                        <td className="py-3 px-4 text-zinc-500 font-sans">
                          {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                          >
                            Inspecter
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Webhook Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              Configurer un nouveau webhook
            </h3>
            <p className="text-xs text-zinc-500 mb-5">
              Recevez des notifications HTTP JSON en direct pour ce projet.
            </p>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nom du récepteur <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Serveur Discord / Channel Déploiement"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  URL cible du webhook (POST) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/... ou https://mon-api.com/webhook"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Secret de signature (optionnel)
                </label>
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="whsec_votre_clef_secrete"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Sera transmis dans l'en-tête HTTP <code className="font-mono">X-FlexiFlow-Secret</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Événements déclencheurs
                </label>
                <div className="space-y-2">
                  {AVAILABLE_EVENTS.map((ev) => {
                    const isSelected = selectedEvents.includes(ev.id);
                    return (
                      <label
                        key={ev.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleEvent(ev.id)}
                          className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-white font-mono">
                            {ev.id}
                          </span>
                          <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {ev.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                >
                  Enregistrer le webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                Détails du Webhook Dispatch
                <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                  selectedLog.status === 'success'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}>
                  HTTP {selectedLog.httpStatus}
                </span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-zinc-500">Événement :</span>
                  <p className="font-mono font-semibold text-blue-600 dark:text-blue-400">{selectedLog.event}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Latence :</span>
                  <p className="font-mono font-semibold text-zinc-900 dark:text-white">{selectedLog.durationMs} ms</p>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500">URL :</span>
                  <p className="font-mono text-zinc-900 dark:text-white truncate">{selectedLog.url}</p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Payload JSON envoyé :
                </span>
                <pre className="p-3 bg-zinc-950 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-48">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>

              <div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Réponse du serveur cible :
                </span>
                <pre className="p-3 bg-zinc-950 text-zinc-300 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-32">
                  {selectedLog.responseSnippet || (selectedLog.error ? `Erreur: ${selectedLog.error}` : 'Aucune réponse')}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-900 dark:text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
