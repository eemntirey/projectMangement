import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  ListChecks, 
  TrendingUp, 
  AlertTriangle, 
  Check, 
  Copy, 
  X, 
  Loader2, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { DEMO_USERS } from '../../data/demoData';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'extract_meeting' | 'status_report' | 'suggest_priorities';

export function AiAssistantModal({ isOpen, onClose }: AiAssistantModalProps) {
  const { currentProject, tasks, workflow, createTask } = useProject();
  const [activeTab, setActiveTab] = useState<TabType>('extract_meeting');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab 1: Meeting Extraction state
  const [meetingText, setMeetingText] = useState(`Réunion de cadrage du 08 Novembre 2026 :
Participants : Sophie, Alexandre, Léa
- Alexandre doit terminer le branchement de l'API Stripe avant le 14 novembre.
- Léa va rédiger la séquence d'emails pour les 5 000 bêta-testeurs (priorité moyenne).
- Quelqu'un devra vérifier les mentions légales RGPD pour le bandeau cookie, date critique non définie !
- Tournage de la vidéo démo : Sophie et Léa s'en occupent pour le 25 novembre.
- Attention : il faut aussi auditer les performances de la base de données de production.`);
  const [extractedActions, setExtractedActions] = useState<any[] | null>(null);
  const [meetingSummary, setMeetingSummary] = useState<string | null>(null);
  const [importedIndices, setImportedIndices] = useState<number[]>([]);

  // Tab 2: Status Report state
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Tab 3: Priority Suggestions state
  const [prioritiesResult, setPrioritiesResult] = useState<any | null>(null);

  if (!isOpen || !currentProject) return null;

  // 1. Run Extract Meeting Minutes
  const handleExtractMeeting = async () => {
    if (!meetingText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/extract-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingText })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erreur lors de l\'analyse');
      }
      const data = await res.json();
      setExtractedActions(data.actions || []);
      setMeetingSummary(data.summary || null);
      setImportedIndices([]);
    } catch (err: any) {
      setError(err.message || 'Impossible d\'analyser le compte rendu.');
    } finally {
      setLoading(false);
    }
  };

  // Import single action into project
  const handleImportAction = async (action: any, index: number) => {
    // find matched user or fallback
    const matchedUser = DEMO_USERS.find(u => 
      action.assigneeName && u.displayName.toLowerCase().includes(action.assigneeName.toLowerCase())
    );
    const defaultStatus = workflow?.statuses[0]?.id || 'st-backlog';

    await createTask({
      title: action.title,
      description: action.description || '',
      dueDate: action.dueDate || undefined,
      priority: action.priority || 'medium',
      assigneeIds: matchedUser ? [matchedUser.uid] : [],
      statusId: defaultStatus,
      labels: action.isRisk ? ['Risque IA', 'Action Réunion'] : ['Action Réunion']
    });

    setImportedIndices(prev => [...prev, index]);
  };

  // Import all actions
  const handleImportAll = async () => {
    if (!extractedActions) return;
    for (let i = 0; i < extractedActions.length; i++) {
      if (!importedIndices.includes(i)) {
        await handleImportAction(extractedActions[i], i);
      }
    }
  };

  // 2. Generate Status Report
  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const simplifiedTasks = tasks.map(t => {
        const status = workflow?.statuses.find(s => s.id === t.statusId);
        const assignees = t.assigneeIds.map(id => DEMO_USERS.find(u => u.uid === id)?.displayName || id);
        return {
          title: t.title,
          statusLabel: status?.label || 'Inconnu',
          statusType: status?.type || 'in_progress',
          priority: t.priority,
          dueDate: t.dueDate,
          assigneeNames: assignees
        };
      });

      const res = await fetch('/api/gemini/status-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: currentProject.name,
          description: currentProject.description,
          tasks: simplifiedTasks
        })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erreur lors de la génération du rapport');
      }
      const data = await res.json();
      setReportMarkdown(data.reportMarkdown);
    } catch (err: any) {
      setError(err.message || 'Impossible de générer le rapport.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Suggest Priorities
  const handleSuggestPriorities = async () => {
    setLoading(true);
    setError(null);
    try {
      const simplifiedTasks = tasks.map(t => {
        const status = workflow?.statuses.find(s => s.id === t.statusId);
        return {
          id: t.id,
          title: t.title,
          statusLabel: status?.label || 'Inconnu',
          statusType: status?.type || 'in_progress',
          priority: t.priority,
          dueDate: t.dueDate,
          dependencyIds: t.dependencyIds
        };
      });

      const res = await fetch('/api/gemini/suggest-priorities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: simplifiedTasks })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erreur lors de l\'analyse');
      }
      const data = await res.json();
      setPrioritiesResult(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de calculer les priorités.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!reportMarkdown) return;
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-sky-50/30 to-white dark:from-indigo-950/20 dark:via-sky-950/10 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Assistant IA Gemini
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  gemini-3.8-flash
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optimisez vos workflows, extrayez des tâches et générez des synthèses en temps réel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-5 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('extract_meeting'); setError(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'extract_meeting'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Importer un compte rendu
          </button>

          <button
            onClick={() => { setActiveTab('status_report'); setError(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'status_report'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Rapport de statut
          </button>

          <button
            onClick={() => { setActiveTab('suggest_priorities'); setError(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'suggest_priorities'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Suggérer les priorités
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: EXTRACT MEETING */}
          {activeTab === 'extract_meeting' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Collez les notes brutes de votre réunion :
                </label>
                <textarea
                  rows={5}
                  value={meetingText}
                  onChange={(e) => setMeetingText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none shadow-xs"
                  placeholder="Ex : Réunion de cadrage... Paul doit livrer la maquette pour vendredi..."
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gemini détectera automatiquement les tâches, responsables, dates limites et signalera les actions sans responsable comme des <strong>risques</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleExtractMeeting}
                  disabled={loading || !meetingText.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Extraire les actions
                    </>
                  )}
                </button>
              </div>

              {/* Extracted results */}
              {extractedActions && (
                <div className="mt-5 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Actions identifiées</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                          {extractedActions.length}
                        </span>
                      </h3>
                      {meetingSummary && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                          "{meetingSummary}"
                        </p>
                      )}
                    </div>
                    {extractedActions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleImportAll}
                        disabled={importedIndices.length === extractedActions.length}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tout importer ({extractedActions.length - importedIndices.length})
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {extractedActions.map((action, idx) => {
                      const isImported = importedIndices.includes(idx);
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border transition-all ${
                            action.isRisk
                              ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {action.title}
                                </span>
                                {action.isRisk && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 text-[10px] font-semibold">
                                    <AlertTriangle className="w-3 h-3" />
                                    Risque : {action.riskReason || 'Informations incomplètes'}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-semibold uppercase">
                                  {action.priority}
                                </span>
                              </div>

                              {action.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {action.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                                <span>
                                  Responsable : <strong>{action.assigneeName || 'Non désigné ⚠️'}</strong>
                                </span>
                                <span>
                                  Échéance : <strong>{action.dueDate || 'Non définie ⚠️'}</strong>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleImportAction(action, idx)}
                              disabled={isImported}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                                isImported
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer'
                              }`}
                            >
                              {isImported ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Importé
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  Importer
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STATUS REPORT */}
          {activeTab === 'status_report' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Générateur de rapport d'avancement
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gemini analyse les {tasks.length} tâches du projet "{currentProject.name}" pour rédiger une synthèse Markdown pour la direction et les parties prenantes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération du rapport...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer le rapport de statut
                    </>
                  )}
                </button>
              </div>

              {reportMarkdown && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Rapport d'avancement généré :
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMarkdown}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copié dans le presse-papier !' : 'Copier le Markdown'}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap font-sans">
                    {reportMarkdown}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUGGEST PRIORITIES */}
          {activeTab === 'suggest_priorities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Arbitrage et suggestion intelligente des priorités
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gemini analyse l'échéancier, les dépendances critiques et la charge pour ordonnancer vos tâches.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSuggestPriorities}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Suggérer les priorités
                    </>
                  )}
                </button>
              </div>

              {prioritiesResult && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
                  {prioritiesResult.analysis && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200">
                      <strong>Stratégie recommandée :</strong> {prioritiesResult.analysis}
                    </div>
                  )}

                  <div className="space-y-2">
                    {prioritiesResult.recommendedOrder?.map((rec: any, idx: number) => {
                      const taskObj = tasks.find(t => t.id === rec.taskId);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-start gap-3"
                        >
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {rec.recommendedRank || idx + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {taskObj?.title || `Tâche #${rec.taskId}`}
                              </span>
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                {rec.suggestedPriority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {rec.rationale}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>Toutes les requêtes Gemini transitent par le backend sécurisé d'AI Studio.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
