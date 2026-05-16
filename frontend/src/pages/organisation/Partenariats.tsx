import { useState } from 'react'
import { 
  Handshake, 
  Plus, 
  Search, 
  Building2,
  Globe,
  Mail,
  Phone,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  X,
  ExternalLink
} from 'lucide-react'

interface Partenaire {
  id: number
  nom: string
  type: 'technique' | 'financier' | 'institutionnel' | 'prive'
  description: string
  contact_nom: string
  contact_email: string
  contact_telephone: string
  site_web?: string
  date_debut: string
  date_fin?: string
  statut: 'actif' | 'en_negociation' | 'suspendu' | 'termine'
  montant_engagement?: number
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'technique': return { label: 'Technique', cls: 'bg-blue-100 text-blue-700' }
    case 'financier': return { label: 'Financier', cls: 'bg-green-100 text-green-700' }
    case 'institutionnel': return { label: 'Institutionnel', cls: 'bg-purple-100 text-purple-700' }
    case 'prive': return { label: 'Privé', cls: 'bg-orange-100 text-orange-700' }
    default: return { label: type, cls: 'bg-gray-100 text-gray-500' }
  }
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'actif': return { label: 'Actif', cls: 'bg-green-100 text-green-700' }
    case 'en_negociation': return { label: 'En négociation', cls: 'bg-yellow-100 text-yellow-700' }
    case 'suspendu': return { label: 'Suspendu', cls: 'bg-red-100 text-red-600' }
    case 'termine': return { label: 'Terminé', cls: 'bg-slate-100 text-slate-500' }
    default: return { label: statut, cls: 'bg-gray-100 text-gray-500' }
  }
}

export default function Partenariats() {
  const [partenaires, setPartenaires] = useState<Partenaire[]>([
    { id: 1, nom: 'UNICEF Togo', type: 'financier', description: 'Partenariat pour le programme WASH et santé dans les zones rurales.', contact_nom: 'Dr. Amara Diallo', contact_email: 'a.diallo@unicef.org', contact_telephone: '+228 22 21 50 00', site_web: 'https://www.unicef.org/togo', date_debut: '2025-01-01', date_fin: '2027-12-31', statut: 'actif', montant_engagement: 150000000 },
    { id: 2, nom: 'GIZ Togo', type: 'technique', description: 'Appui technique pour le renforcement des capacités et la formation professionnelle.', contact_nom: 'Hans Mueller', contact_email: 'h.mueller@giz.de', contact_telephone: '+228 22 23 45 67', site_web: 'https://www.giz.de/togo', date_debut: '2024-06-01', date_fin: '2026-12-31', statut: 'actif', montant_engagement: 80000000 },
    { id: 3, nom: 'Ministère de l\'Action Sociale', type: 'institutionnel', description: 'Convention cadre pour la mise en oeuvre de projets communautaires.', contact_nom: 'Mme Adjoa Mensah', contact_email: 'a.mensah@gouv.tg', contact_telephone: '+228 22 21 30 00', date_debut: '2024-01-01', statut: 'actif' },
    { id: 4, nom: 'Fondation Orange Togo', type: 'prive', description: 'Soutien à la digitalisation des services éducatifs.', contact_nom: 'Koffi Agbenyo', contact_email: 'k.agbenyo@orange.tg', contact_telephone: '+228 90 12 34 00', site_web: 'https://www.orange.tg/fondation', date_debut: '2026-03-01', statut: 'en_negociation', montant_engagement: 50000000 },
    { id: 5, nom: 'OMS Bureau Togo', type: 'technique', description: 'Appui technique en matière de santé publique et prévention.', contact_nom: 'Dr. Fatima Sy', contact_email: 'syf@who.int', contact_telephone: '+228 22 21 60 00', date_debut: '2023-01-01', date_fin: '2025-12-31', statut: 'termine' },
  ])

  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPartner, setNewPartner] = useState({
    nom: '', type: 'technique' as Partenaire['type'], description: '',
    contact_nom: '', contact_email: '', contact_telephone: '', site_web: '',
    date_debut: '', date_fin: '', montant_engagement: 0
  })

  const filtered = partenaires.filter(p => {
    const q = search.toLowerCase()
    return p.nom.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.contact_nom.toLowerCase().includes(q)
  })

  const stats = {
    total: partenaires.length,
    actifs: partenaires.filter(p => p.statut === 'actif').length,
    enNegociation: partenaires.filter(p => p.statut === 'en_negociation').length,
    totalEngagement: partenaires.filter(p => p.statut === 'actif').reduce((sum, p) => sum + (p.montant_engagement || 0), 0),
  }

  const handleCreate = () => {
    const newP: Partenaire = {
      id: partenaires.length + 1,
      nom: newPartner.nom || 'Nouveau partenaire',
      type: newPartner.type,
      description: newPartner.description,
      contact_nom: newPartner.contact_nom,
      contact_email: newPartner.contact_email,
      contact_telephone: newPartner.contact_telephone,
      site_web: newPartner.site_web || undefined,
      date_debut: newPartner.date_debut || new Date().toISOString().split('T')[0],
      date_fin: newPartner.date_fin || undefined,
      statut: 'en_negociation',
      montant_engagement: newPartner.montant_engagement || undefined
    }
    setPartenaires([newP, ...partenaires])
    setShowCreateModal(false)
    setNewPartner({ nom: '', type: 'technique', description: '', contact_nom: '', contact_email: '', contact_telephone: '', site_web: '', date_debut: '', date_fin: '', montant_engagement: 0 })
  }

  const handleDelete = (id: number) => {
    setPartenaires(partenaires.filter(p => p.id !== id))
  }

  const formatMontant = (montant?: number) => {
    if (!montant) return '—'
    return `${(montant / 1000000).toFixed(0)}M FCFA`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Handshake className="h-6 w-6 text-teal-600" />
            Partenariats Stratégiques
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos partenariats techniques, financiers et institutionnels.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau partenariat
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total partenaires</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.actifs}</p>
          <p className="text-xs text-green-600 mt-1">Actifs</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{stats.enNegociation}</p>
          <p className="text-xs text-yellow-600 mt-1">En négociation</p>
        </div>
        <div className="bg-teal-50 rounded-xl border border-teal-100 p-4 text-center">
          <p className="text-2xl font-bold text-teal-700">{formatMontant(stats.totalEngagement)}</p>
          <p className="text-xs text-teal-600 mt-1">Engagements actifs</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un partenaire..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition"
          />
        </div>
      </div>

      {/* Partner cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <Handshake className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-400">Aucun partenaire trouvé.</p>
          </div>
        ) : filtered.map(partner => {
          const typeBadge = getTypeBadge(partner.type)
          const statutBadge = getStatutBadge(partner.statut)
          return (
            <div key={partner.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-800">{partner.nom}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.cls}`}>
                        {typeBadge.label}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statutBadge.cls}`}>
                        {statutBadge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{partner.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div>
                        <p className="font-medium text-slate-700 mb-1">Contact</p>
                        <p>{partner.contact_nom}</p>
                        <p className="flex items-center gap-1 text-slate-400">
                          <Mail className="h-3 w-3" /> {partner.contact_email}
                        </p>
                        <p className="flex items-center gap-1 text-slate-400">
                          <Phone className="h-3 w-3" /> {partner.contact_telephone}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 mb-1">Période</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {new Date(partner.date_debut).toLocaleDateString('fr-FR')}
                          {partner.date_fin && ` - ${new Date(partner.date_fin).toLocaleDateString('fr-FR')}`}
                        </p>
                        {partner.site_web && (
                          <a href={partner.site_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 mt-1">
                            <Globe className="h-3 w-3" /> Site web <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 mb-1">Engagement</p>
                        <p className="text-lg font-bold text-teal-700">
                          {partner.montant_engagement 
                            ? `${partner.montant_engagement.toLocaleString('fr-FR')} FCFA`
                            : 'Non défini'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 ml-4">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(partner.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Nouveau partenariat</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du partenaire</label>
                <input
                  type="text"
                  value={newPartner.nom}
                  onChange={e => setNewPartner({ ...newPartner, nom: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  placeholder="Nom de l'organisation partenaire"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de partenariat</label>
                <select
                  value={newPartner.type}
                  onChange={e => setNewPartner({ ...newPartner, type: e.target.value as Partenaire['type'] })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                >
                  <option value="technique">Technique</option>
                  <option value="financier">Financier</option>
                  <option value="institutionnel">Institutionnel</option>
                  <option value="prive">Privé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newPartner.description}
                  onChange={e => setNewPartner({ ...newPartner, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 resize-none"
                  placeholder="Description du partenariat..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom du contact</label>
                  <input
                    type="text"
                    value={newPartner.contact_nom}
                    onChange={e => setNewPartner({ ...newPartner, contact_nom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                    placeholder="Nom du contact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newPartner.contact_email}
                    onChange={e => setNewPartner({ ...newPartner, contact_email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                    placeholder="email@org.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={newPartner.contact_telephone}
                    onChange={e => setNewPartner({ ...newPartner, contact_telephone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                    placeholder="+228 XX XX XX XX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Montant (FCFA)</label>
                  <input
                    type="number"
                    value={newPartner.montant_engagement}
                    onChange={e => setNewPartner({ ...newPartner, montant_engagement: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                <input
                  type="date"
                  value={newPartner.date_debut}
                  onChange={e => setNewPartner({ ...newPartner, date_debut: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
                />
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
                Créer le partenariat
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
