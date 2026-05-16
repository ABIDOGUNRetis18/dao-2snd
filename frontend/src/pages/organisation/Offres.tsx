import { useState } from 'react'
import { 
  FileText, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Tag,
  X
} from 'lucide-react'

interface Publication {
  id: number
  titre: string
  type: 'offre' | 'communique' | 'projet'
  description: string
  date_publication: string
  date_expiration?: string
  statut: 'brouillon' | 'publiee' | 'expiree' | 'archivee'
}

const TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'offre', label: 'Offre d\'emploi' },
  { value: 'communique', label: 'Communiqué' },
  { value: 'projet', label: 'Projet' },
]

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'publiee', label: 'Publiée' },
  { value: 'expiree', label: 'Expirée' },
  { value: 'archivee', label: 'Archivée' },
]

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'offre': return { label: 'Offre', cls: 'bg-blue-100 text-blue-700' }
    case 'communique': return { label: 'Communiqué', cls: 'bg-purple-100 text-purple-700' }
    case 'projet': return { label: 'Projet', cls: 'bg-teal-100 text-teal-700' }
    default: return { label: type, cls: 'bg-gray-100 text-gray-500' }
  }
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'brouillon': return { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600' }
    case 'publiee': return { label: 'Publiée', cls: 'bg-green-100 text-green-700' }
    case 'expiree': return { label: 'Expirée', cls: 'bg-red-100 text-red-600' }
    case 'archivee': return { label: 'Archivée', cls: 'bg-slate-100 text-slate-500' }
    default: return { label: statut, cls: 'bg-gray-100 text-gray-500' }
  }
}

export default function Offres() {
  const [publications, setPublications] = useState<Publication[]>([
    { id: 1, titre: 'Appel à candidatures - Programme Jeunesse 2026', type: 'offre', description: 'Recrutement de 20 coordinateurs terrain pour le programme jeunesse dans les régions du Togo.', date_publication: '2026-05-15', date_expiration: '2026-06-30', statut: 'publiee' },
    { id: 2, titre: 'Communiqué - Résultats du programme Alpha', type: 'communique', description: 'Publication des résultats de la phase 1 du programme Alpha de formation professionnelle.', date_publication: '2026-05-08', statut: 'publiee' },
    { id: 3, titre: 'Projet WASH - Phase 2', type: 'projet', description: 'Extension du projet d\'accès à l\'eau potable dans 15 communes rurales.', date_publication: '2026-04-20', date_expiration: '2026-12-31', statut: 'publiee' },
    { id: 4, titre: 'Recrutement Comptable Senior', type: 'offre', description: 'Poste de comptable senior pour la gestion financière des projets.', date_publication: '2026-05-01', date_expiration: '2026-05-31', statut: 'expiree' },
    { id: 5, titre: 'Brouillon - Appel à partenaires', type: 'projet', description: 'Recherche de partenaires pour le programme éducation digitale.', date_publication: '', statut: 'brouillon' },
  ])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPublication, setNewPublication] = useState<Partial<Publication>>({
    titre: '',
    type: 'offre',
    description: '',
    date_expiration: '',
    statut: 'brouillon'
  })

  const filtered = publications.filter(pub => {
    const q = search.toLowerCase()
    const matchSearch = pub.titre.toLowerCase().includes(q) || pub.description.toLowerCase().includes(q)
    const matchType = typeFilter === '' || pub.type === typeFilter
    const matchStatut = statutFilter === '' || pub.statut === statutFilter
    return matchSearch && matchType && matchStatut
  })

  const handleCreate = () => {
    const newPub: Publication = {
      id: publications.length + 1,
      titre: newPublication.titre || 'Nouvelle publication',
      type: (newPublication.type as Publication['type']) || 'offre',
      description: newPublication.description || '',
      date_publication: newPublication.statut === 'publiee' ? new Date().toISOString().split('T')[0] : '',
      date_expiration: newPublication.date_expiration || undefined,
      statut: (newPublication.statut as Publication['statut']) || 'brouillon'
    }
    setPublications([newPub, ...publications])
    setShowCreateModal(false)
    setNewPublication({ titre: '', type: 'offre', description: '', date_expiration: '', statut: 'brouillon' })
  }

  const handleDelete = (id: number) => {
    setPublications(publications.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Offres & Publications
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos offres, communiqués et projets publiés.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle publication
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une publication..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrer
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Type</div>
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTypeFilter(t.value)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                      typeFilter === t.value ? 'text-teal-600 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1" />
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Statut</div>
                {STATUTS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setStatutFilter(s.value)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                      statutFilter === s.value ? 'text-teal-600 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{publications.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{publications.filter(p => p.statut === 'publiee').length}</p>
          <p className="text-xs text-green-600 mt-1">Publiées</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{publications.filter(p => p.statut === 'brouillon').length}</p>
          <p className="text-xs text-gray-500 mt-1">Brouillons</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{publications.filter(p => p.statut === 'expiree').length}</p>
          <p className="text-xs text-red-500 mt-1">Expirées</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Toutes les publications ({filtered.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Titre</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Date publication</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Expiration</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-sm text-slate-400">
                    Aucune publication trouvée.
                  </td>
                </tr>
              ) : filtered.map(pub => {
                const typeBadge = getTypeBadge(pub.type)
                const statutBadge = getStatutBadge(pub.statut)
                return (
                  <tr key={pub.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">{pub.titre}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{pub.description}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeBadge.cls}`}>
                        {typeBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {pub.date_publication ? new Date(pub.date_publication).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {pub.date_expiration ? new Date(pub.date_expiration).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statutBadge.cls}`}>
                        {statutBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(pub.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Nouvelle publication</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={newPublication.titre}
                  onChange={e => setNewPublication({ ...newPublication, titre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  placeholder="Titre de la publication"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Type
                </label>
                <select
                  value={newPublication.type}
                  onChange={e => setNewPublication({ ...newPublication, type: e.target.value as Publication['type'] })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                >
                  <option value="offre">Offre d'emploi</option>
                  <option value="communique">Communiqué</option>
                  <option value="projet">Projet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newPublication.description}
                  onChange={e => setNewPublication({ ...newPublication, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 resize-none"
                  placeholder="Description de la publication..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date d'expiration (optionnel)
                </label>
                <input
                  type="date"
                  value={newPublication.date_expiration}
                  onChange={e => setNewPublication({ ...newPublication, date_expiration: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                <select
                  value={newPublication.statut}
                  onChange={e => setNewPublication({ ...newPublication, statut: e.target.value as Publication['statut'] })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="publiee">Publier immédiatement</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-8">
        © 2026 2SND TECHNOLOGIES - Tous droits réservés.
      </footer>
    </div>
  )
}
