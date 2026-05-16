import { useState } from 'react'
import { 
  Users, 
  Search, 
  SlidersHorizontal, 
  UserPlus,
  Mail,
  Phone,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  UserCheck,
  UserX
} from 'lucide-react'

interface Candidat {
  id: number
  nom: string
  email: string
  telephone: string
  poste: string
  date_candidature: string
  statut: 'en_attente' | 'en_evaluation' | 'accepte' | 'refuse'
  type: 'candidature' | 'membre'
}

interface Membre {
  id: number
  nom: string
  email: string
  telephone: string
  role: string
  date_adhesion: string
  statut: 'actif' | 'inactif'
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'en_attente': return { label: 'En attente', cls: 'bg-yellow-100 text-yellow-700', icon: Clock }
    case 'en_evaluation': return { label: 'En évaluation', cls: 'bg-blue-100 text-blue-700', icon: Eye }
    case 'accepte': return { label: 'Accepté', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 }
    case 'refuse': return { label: 'Refusé', cls: 'bg-red-100 text-red-600', icon: XCircle }
    case 'actif': return { label: 'Actif', cls: 'bg-green-100 text-green-700', icon: UserCheck }
    case 'inactif': return { label: 'Inactif', cls: 'bg-gray-100 text-gray-500', icon: UserX }
    default: return { label: statut, cls: 'bg-gray-100 text-gray-500', icon: Clock }
  }
}

export default function Candidatures() {
  const [activeTab, setActiveTab] = useState<'candidatures' | 'membres'>('candidatures')
  const [search, setSearch] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [statutFilter, setStatutFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const [candidats, setCandidats] = useState<Candidat[]>([
    { id: 1, nom: 'Jean Kokou', email: 'jean.kokou@mail.com', telephone: '+228 90 12 34 56', poste: 'Coordonnateur terrain', date_candidature: '2026-05-14', statut: 'en_evaluation', type: 'candidature' },
    { id: 2, nom: 'Afi Mensah', email: 'afi.mensah@mail.com', telephone: '+228 91 23 45 67', poste: 'Chargé de communication', date_candidature: '2026-05-12', statut: 'en_attente', type: 'candidature' },
    { id: 3, nom: 'Kossi Amavi', email: 'kossi.amavi@mail.com', telephone: '+228 92 34 56 78', poste: 'Comptable Junior', date_candidature: '2026-05-10', statut: 'accepte', type: 'candidature' },
    { id: 4, nom: 'Ablavi Djossou', email: 'ablavi.d@mail.com', telephone: '+228 93 45 67 89', poste: 'Animateur communautaire', date_candidature: '2026-05-08', statut: 'refuse', type: 'candidature' },
    { id: 5, nom: 'Kodjo Amevor', email: 'kodjo.a@mail.com', telephone: '+228 94 56 78 90', poste: 'Développeur Web', date_candidature: '2026-05-05', statut: 'en_attente', type: 'candidature' },
  ])

  const [membres] = useState<Membre[]>([
    { id: 1, nom: 'Akouavi Mensah', email: 'akouavi@org.tg', telephone: '+228 90 00 11 22', role: 'Directrice Programme', date_adhesion: '2024-01-15', statut: 'actif' },
    { id: 2, nom: 'Kofi Agbeko', email: 'kofi@org.tg', telephone: '+228 91 11 22 33', role: 'Responsable Financier', date_adhesion: '2024-03-01', statut: 'actif' },
    { id: 3, nom: 'Ama Tossou', email: 'ama@org.tg', telephone: '+228 92 22 33 44', role: 'Chargée de suivi-évaluation', date_adhesion: '2024-06-10', statut: 'actif' },
    { id: 4, nom: 'Edem Kpegba', email: 'edem@org.tg', telephone: '+228 93 33 44 55', role: 'Logisticien', date_adhesion: '2025-01-20', statut: 'inactif' },
    { id: 5, nom: 'Sena Adjakly', email: 'sena@org.tg', telephone: '+228 94 44 55 66', role: 'Assistante Administrative', date_adhesion: '2025-09-01', statut: 'actif' },
  ])

  const [newMember, setNewMember] = useState({ nom: '', email: '', telephone: '', role: '' })

  const filteredCandidats = candidats.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.nom.toLowerCase().includes(q) || c.poste.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    const matchStatut = statutFilter === '' || c.statut === statutFilter
    return matchSearch && matchStatut
  })

  const filteredMembres = membres.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = m.nom.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    const matchStatut = statutFilter === '' || m.statut === statutFilter
    return matchSearch && matchStatut
  })

  const updateCandidatStatus = (id: number, newStatut: Candidat['statut']) => {
    setCandidats(candidats.map(c => c.id === id ? { ...c, statut: newStatut } : c))
  }

  const handleAddMember = () => {
    setShowAddModal(false)
    setNewMember({ nom: '', email: '', telephone: '', role: '' })
  }

  const candidatureStats = {
    total: candidats.length,
    enAttente: candidats.filter(c => c.statut === 'en_attente').length,
    enEvaluation: candidats.filter(c => c.statut === 'en_evaluation').length,
    acceptes: candidats.filter(c => c.statut === 'accepte').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            Candidatures & Membres
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les candidatures reçues et les membres de votre organisation.</p>
        </div>
        {activeTab === 'membres' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un membre
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => { setActiveTab('candidatures'); setStatutFilter(''); setSearch('') }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'candidatures' 
              ? 'bg-white text-teal-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Candidatures ({candidats.length})
        </button>
        <button
          onClick={() => { setActiveTab('membres'); setStatutFilter(''); setSearch('') }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'membres' 
              ? 'bg-white text-teal-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Membres ({membres.length})
        </button>
      </div>

      {/* Stats row - only for candidatures */}
      {activeTab === 'candidatures' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{candidatureStats.total}</p>
            <p className="text-xs text-slate-500 mt-1">Total reçues</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{candidatureStats.enAttente}</p>
            <p className="text-xs text-yellow-600 mt-1">En attente</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{candidatureStats.enEvaluation}</p>
            <p className="text-xs text-blue-600 mt-1">En évaluation</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{candidatureStats.acceptes}</p>
            <p className="text-xs text-green-600 mt-1">Acceptés</p>
          </div>
        </div>
      )}

      {/* Search & Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'candidatures' ? 'Rechercher un candidat...' : 'Rechercher un membre...'}
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
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20">
                {activeTab === 'candidatures' ? (
                  <>
                    {[
                      { value: '', label: 'Tous' },
                      { value: 'en_attente', label: 'En attente' },
                      { value: 'en_evaluation', label: 'En évaluation' },
                      { value: 'accepte', label: 'Accepté' },
                      { value: 'refuse', label: 'Refusé' },
                    ].map(s => (
                      <button
                        key={s.value}
                        onClick={() => { setStatutFilter(s.value); setShowFilterMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                          statutFilter === s.value ? 'text-teal-600 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { value: '', label: 'Tous' },
                      { value: 'actif', label: 'Actif' },
                      { value: 'inactif', label: 'Inactif' },
                    ].map(s => (
                      <button
                        key={s.value}
                        onClick={() => { setStatutFilter(s.value); setShowFilterMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                          statutFilter === s.value ? 'text-teal-600 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'candidatures' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Candidat</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Poste</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-sm text-slate-400">
                      Aucune candidature trouvée.
                    </td>
                  </tr>
                ) : filteredCandidats.map(c => {
                  const badge = getStatutBadge(c.statut)
                  return (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-800">{c.nom}</p>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{c.poste}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {c.email}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {c.telephone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {new Date(c.date_candidature).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1">
                          {c.statut !== 'accepte' && (
                            <button
                              onClick={() => updateCandidatStatus(c.id, 'accepte')}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Accepter"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {c.statut !== 'refuse' && (
                            <button
                              onClick={() => updateCandidatStatus(c.id, 'refuse')}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Refuser"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          {c.statut === 'en_attente' && (
                            <button
                              onClick={() => updateCandidatStatus(c.id, 'en_evaluation')}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Passer en évaluation"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Membre</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Rôle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Date d'adhésion</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembres.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-sm text-slate-400">
                      Aucun membre trouvé.
                    </td>
                  </tr>
                ) : filteredMembres.map(m => {
                  const badge = getStatutBadge(m.statut)
                  return (
                    <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-teal-600">{m.nom.charAt(0)}</span>
                          </div>
                          <p className="font-semibold text-slate-800">{m.nom}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{m.role}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {m.email}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {m.telephone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {new Date(m.date_adhesion).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Ajouter un membre</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={newMember.nom}
                  onChange={e => setNewMember({ ...newMember, nom: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  placeholder="Nom et prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  placeholder="email@organisation.tg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={newMember.telephone}
                  onChange={e => setNewMember({ ...newMember, telephone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  placeholder="+228 90 XX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <input
                  type="text"
                  value={newMember.role}
                  onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  placeholder="Rôle dans l'organisation"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Ajouter
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
