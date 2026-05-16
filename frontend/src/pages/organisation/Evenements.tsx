import { useState } from 'react'
import { 
  CalendarDays, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Users,
  CreditCard,
  Eye,
  Edit3,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react'

interface Evenement {
  id: number
  titre: string
  type: 'seminaire' | 'conference' | 'atelier' | 'formation'
  description: string
  date_debut: string
  date_fin: string
  lieu: string
  places_totales: number
  places_inscrites: number
  prix: number
  statut: 'planifie' | 'inscriptions_ouvertes' | 'complet' | 'en_cours' | 'termine'
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'seminaire': return { label: 'Séminaire', cls: 'bg-purple-100 text-purple-700' }
    case 'conference': return { label: 'Conférence', cls: 'bg-blue-100 text-blue-700' }
    case 'atelier': return { label: 'Atelier', cls: 'bg-orange-100 text-orange-700' }
    case 'formation': return { label: 'Formation', cls: 'bg-teal-100 text-teal-700' }
    default: return { label: type, cls: 'bg-gray-100 text-gray-500' }
  }
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'planifie': return { label: 'Planifié', cls: 'bg-gray-100 text-gray-600' }
    case 'inscriptions_ouvertes': return { label: 'Inscriptions ouvertes', cls: 'bg-green-100 text-green-700' }
    case 'complet': return { label: 'Complet', cls: 'bg-red-100 text-red-600' }
    case 'en_cours': return { label: 'En cours', cls: 'bg-blue-100 text-blue-700' }
    case 'termine': return { label: 'Terminé', cls: 'bg-slate-100 text-slate-500' }
    default: return { label: statut, cls: 'bg-gray-100 text-gray-500' }
  }
}

export default function Evenements() {
  const [evenements, setEvenements] = useState<Evenement[]>([
    { id: 1, titre: 'Séminaire sur le développement durable', type: 'seminaire', description: 'Échange sur les pratiques durables et l\'impact environnemental des projets de développement.', date_debut: '2026-06-20', date_fin: '2026-06-22', lieu: 'Hôtel Sarakawa, Lomé', places_totales: 100, places_inscrites: 67, prix: 25000, statut: 'inscriptions_ouvertes' },
    { id: 2, titre: 'Formation en gestion de projets', type: 'formation', description: 'Formation intensive sur les outils et méthodes de gestion de projets dans le secteur ONG.', date_debut: '2026-07-05', date_fin: '2026-07-10', lieu: 'Centre de formation ESGIS, Lomé', places_totales: 30, places_inscrites: 30, prix: 50000, statut: 'complet' },
    { id: 3, titre: 'Conférence annuelle des partenaires', type: 'conference', description: 'Rencontre annuelle avec nos partenaires techniques et financiers pour le bilan et les perspectives.', date_debut: '2026-08-15', date_fin: '2026-08-15', lieu: 'Palais des Congrès, Lomé', places_totales: 200, places_inscrites: 45, prix: 0, statut: 'planifie' },
    { id: 4, titre: 'Atelier de renforcement des capacités', type: 'atelier', description: 'Atelier pratique sur le suivi-évaluation des projets communautaires.', date_debut: '2026-05-10', date_fin: '2026-05-12', lieu: 'Bureau régional, Kara', places_totales: 25, places_inscrites: 25, prix: 15000, statut: 'termine' },
    { id: 5, titre: 'Séminaire WASH et santé publique', type: 'seminaire', description: 'Séminaire sur l\'eau, l\'assainissement et l\'hygiène dans les communautés rurales.', date_debut: '2026-09-01', date_fin: '2026-09-03', lieu: 'Hôtel Ibis, Lomé', places_totales: 80, places_inscrites: 12, prix: 30000, statut: 'inscriptions_ouvertes' },
  ])

  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    titre: '', type: 'seminaire' as Evenement['type'], description: '', 
    date_debut: '', date_fin: '', lieu: '', places_totales: 50, prix: 0
  })

  const filtered = evenements.filter(e => {
    const q = search.toLowerCase()
    return e.titre.toLowerCase().includes(q) || e.lieu.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
  })

  const stats = {
    total: evenements.length,
    aVenir: evenements.filter(e => e.statut === 'planifie' || e.statut === 'inscriptions_ouvertes').length,
    enCours: evenements.filter(e => e.statut === 'en_cours').length,
    totalInscrits: evenements.reduce((sum, e) => sum + e.places_inscrites, 0),
  }

  const handleCreate = () => {
    const newEv: Evenement = {
      id: evenements.length + 1,
      titre: newEvent.titre || 'Nouvel événement',
      type: newEvent.type,
      description: newEvent.description,
      date_debut: newEvent.date_debut,
      date_fin: newEvent.date_fin || newEvent.date_debut,
      lieu: newEvent.lieu,
      places_totales: newEvent.places_totales,
      places_inscrites: 0,
      prix: newEvent.prix,
      statut: 'planifie'
    }
    setEvenements([newEv, ...evenements])
    setShowCreateModal(false)
    setNewEvent({ titre: '', type: 'seminaire', description: '', date_debut: '', date_fin: '', lieu: '', places_totales: 50, prix: 0 })
  }

  const handleDelete = (id: number) => {
    setEvenements(evenements.filter(e => e.id !== id))
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit'
    return `${price.toLocaleString('fr-FR')} FCFA`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-orange-600" />
            Événements & Séminaires
          </h1>
          <p className="text-slate-500 text-sm mt-1">Organisez et gérez vos séminaires, formations et événements.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvel événement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total événements</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.aVenir}</p>
          <p className="text-xs text-green-600 mt-1">À venir</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats.enCours}</p>
          <p className="text-xs text-blue-600 mt-1">En cours</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{stats.totalInscrits}</p>
          <p className="text-xs text-purple-600 mt-1">Total inscrits</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition"
          />
        </div>
      </div>

      {/* Events cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-16 text-center">
            <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-400">Aucun événement trouvé.</p>
          </div>
        ) : filtered.map(event => {
          const typeBadge = getTypeBadge(event.type)
          const statutBadge = getStatutBadge(event.statut)
          const progressPercent = Math.round((event.places_inscrites / event.places_totales) * 100)
          return (
            <div key={event.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeBadge.cls}`}>
                      {typeBadge.label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statutBadge.cls}`}>
                      {statutBadge.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-2">{event.titre}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {new Date(event.date_debut).toLocaleDateString('fr-FR')}
                      {event.date_fin !== event.date_debut && ` - ${new Date(event.date_fin).toLocaleDateString('fr-FR')}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{event.lieu}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatPrice(event.prix)}</span>
                  </div>
                </div>

                {/* Inscription progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {event.places_inscrites}/{event.places_totales} inscrits
                    </span>
                    <span className="text-xs font-medium text-slate-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        progressPercent >= 100 ? 'bg-red-500' :
                        progressPercent >= 75 ? 'bg-orange-500' :
                        'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Nouvel événement</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={newEvent.titre}
                  onChange={e => setNewEvent({ ...newEvent, titre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  placeholder="Titre de l'événement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={newEvent.type}
                  onChange={e => setNewEvent({ ...newEvent, type: e.target.value as Evenement['type'] })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                >
                  <option value="seminaire">Séminaire</option>
                  <option value="conference">Conférence</option>
                  <option value="atelier">Atelier</option>
                  <option value="formation">Formation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 resize-none"
                  placeholder="Description de l'événement..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={newEvent.date_debut}
                    onChange={e => setNewEvent({ ...newEvent, date_debut: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={newEvent.date_fin}
                    onChange={e => setNewEvent({ ...newEvent, date_fin: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Lieu
                </label>
                <input
                  type="text"
                  value={newEvent.lieu}
                  onChange={e => setNewEvent({ ...newEvent, lieu: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  placeholder="Lieu de l'événement"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Users className="inline h-4 w-4 mr-1" />
                    Places
                  </label>
                  <input
                    type="number"
                    value={newEvent.places_totales}
                    onChange={e => setNewEvent({ ...newEvent, places_totales: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <CreditCard className="inline h-4 w-4 mr-1" />
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newEvent.prix}
                    onChange={e => setNewEvent({ ...newEvent, prix: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                    placeholder="0 = Gratuit"
                  />
                </div>
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
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Créer l'événement
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
