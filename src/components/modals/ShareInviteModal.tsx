import React, { useState } from 'react';
import { X, UserPlus, Copy, Check, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { UserRole } from '../../types';

interface ShareInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareInviteModal({ isOpen, onClose }: ShareInviteModalProps) {
  const { currentOrg } = useAuth();
  const { currentProject, addNotification } = useProject();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [copied, setCopied] = useState(false);
  const [invited, setInvited] = useState(false);

  if (!isOpen) return null;

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}?invite=${currentProject?.id}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    addNotification(
      'Invitation envoyée',
      `Invitation transmise à ${email} avec le rôle ${role}.`
    );

    setInvited(true);
    setTimeout(() => {
      setInvited(false);
      setEmail('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Inviter des membres
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentOrg.name} • {currentProject?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Email Invite */}
          <form onSubmit={handleSendInvite} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adresse email professionnelle
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborateur@entreprise.com"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                Rôle et permissions accordées
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="admin">Administrateur (Tous les droits)</option>
                <option value="manager">Manager (Projets, Workflows, Tâches, Automatisations)</option>
                <option value="member">Membre (Créer et gérer les tâches)</option>
                <option value="reader">Lecteur (Consultation seule)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!email.trim() || invited}
              className="w-full py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {invited ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Invitation envoyée !
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Envoyer l'invitation
                </>
              )}
            </button>
          </form>

          {/* Copy Direct Link */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Ou partagez le lien d'accès direct au projet :
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
