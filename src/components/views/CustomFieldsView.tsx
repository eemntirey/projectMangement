import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  Check, 
  AlignLeft, 
  Hash, 
  Calendar, 
  CheckSquare, 
  ListFilter, 
  User, 
  Link2 
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { CustomFieldDefinition, CustomFieldType } from '../../types';

export function CustomFieldsView() {
  const { currentProject, customFields, addCustomField, removeCustomField } = useProject();
  const { can } = useAuth();

  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('text');
  const [optionsStr, setOptionsStr] = useState('');
  const [required, setRequired] = useState(false);

  if (!currentProject) return null;

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const options = (type === 'select' || type === 'multiselect')
      ? optionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    await addCustomField({
      name: name.trim(),
      type,
      options,
      required
    });

    setName('');
    setOptionsStr('');
    setRequired(false);
  };

  const typeIcons: Record<CustomFieldType, any> = {
    text: AlignLeft,
    textarea: AlignLeft,
    number: Hash,
    date: Calendar,
    checkbox: CheckSquare,
    select: ListFilter,
    multiselect: ListFilter,
    user: User,
    url: Link2
  };

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-6">
      
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
          Champs personnalisés du projet
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enrichissez les formulaires de vos tâches avec des métadonnées métier adaptées à vos besoins.
        </p>
      </div>

      {/* Fields List */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Champs configurés ({customFields.length})
        </span>

        {customFields.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Aucun champ personnalisé défini pour ce projet.
          </div>
        ) : (
          <div className="space-y-2">
            {customFields.map((field) => {
              const Icon = typeIcons[field.type] || AlignLeft;
              return (
                <div
                  key={field.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {field.name}
                        </span>
                        {field.required && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Requis
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        Type : {field.type} {field.options && `(${field.options.join(', ')})`}
                      </span>
                    </div>
                  </div>

                  {can('manage_fields') && (
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Supprimer ce champ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add New Field Form */}
      {can('manage_fields') && (
        <form onSubmit={handleCreateField} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Créer un nouveau champ personnalisé
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nom du champ
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Version cible, Budget estimé, Client référent..."
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type de données
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CustomFieldType)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="text">Texte court</option>
                <option value="textarea">Texte long</option>
                <option value="number">Nombre</option>
                <option value="date">Date</option>
                <option value="checkbox">Case à cocher (Booléen)</option>
                <option value="select">Liste déroulante (Choix unique)</option>
                <option value="multiselect">Sélection multiple</option>
                <option value="user">Utilisateur</option>
                <option value="url">Lien URL</option>
              </select>
            </div>
          </div>

          {(type === 'select' || type === 'multiselect') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Options séparées par des virgules
              </label>
              <input
                type="text"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Option 1, Option 2, Option 3..."
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Champ obligatoire lors de la création d'une tâche</span>
          </label>

          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajouter ce champ
          </button>
        </form>
      )}

    </div>
  );
}
