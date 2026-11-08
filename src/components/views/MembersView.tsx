import React from 'react';
import { Users, UserPlus, Shield, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { Avatar } from '../common/Avatar';
import { DEMO_USERS } from '../../data/demoData';
import { UserRole } from '../../types';

interface MembersViewProps {
  onOpenInviteModal: () => void;
}

export function MembersView({ onOpenInviteModal }: MembersViewProps) {
  const { currentUser, currentOrg, switchUserPersona, can } = useAuth();
  const { currentProject } = useProject();

  const roleLabels: Record<UserRole, { label: string; desc: string; color: string }> = {
    admin: {
      label: 'Administrateur',
      desc: 'Tous les droits sur l\'organisation, les projets et membres',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
    },
    manager: {
      label: 'Manager',
      desc: 'Gestion des projets, workflows, champs et automatisations',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
    },
    member: {
      label: 'Membre',
      desc: 'Création et mise à jour des tâches et commentaires',
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
    },
    reader: {
      label: 'Lecteur',
      desc: 'Consultation seule sans droit d\'écriture',
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-6">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Équipe & Rôles ({currentOrg.name})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gérez les autorisations granulaires et basculez de profil pour tester les permissions.
          </p>
        </div>

        {can('manage_members') && (
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Inviter un membre
          </button>
        )}
      </div>

      {/* Simulator Banner: Persona Switcher */}
      <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Simulateur de rôle en temps réel
        </div>
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          Cliquez sur un profil pour incarner immédiatement un rôle et vérifier la restriction des actions sensibles :
        </p>
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {DEMO_USERS.map((user) => {
            const isCurrent = currentUser?.uid === user.uid;
            return (
              <button
                type="button"
                key={user.uid}
                onClick={() => switchUserPersona(user)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500 shadow-xs'
                    : 'border-indigo-200 dark:border-indigo-800 bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-white'
                }`}
              >
                <Avatar name={user.displayName} photoURL={user.photoURL} size="xs" />
                <span>{user.displayName}</span>
                <span className="text-[10px] font-bold uppercase opacity-80">({user.role})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-slate-500 font-semibold">
              <th className="py-3 px-4">Collaborateur</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Rôle</th>
              <th className="py-3 px-4">Permissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {DEMO_USERS.map((user) => {
              const roleInfo = roleLabels[user.role || 'member'];
              return (
                <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.displayName} photoURL={user.photoURL} size="sm" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {user.displayName}
                        </span>
                        {currentUser?.uid === user.uid && (
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            (Votre session actuelle)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {user.email}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                    {roleInfo.desc}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
