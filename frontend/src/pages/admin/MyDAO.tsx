import { useState } from 'react'
import { Search, Filter, Eye, Edit, Trash2, Calendar, User, Building2, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function MyDAO() {
  const [daos] = useState([
    {
      id: 'DAO-2026-001',
      reference: 'AMI-2025-SYSINFO',
      objet: 'Développement application de gestion',
      type: 'Normal',
      dateDepot: '2024-03-15',
      statut: 'En cours',
      autorite: 'Ministère du Digital',
      chefProjet: 'Jean Dupont',
      description: 'Développement d\'une application web moderne pour la gestion des processus administratifs'
    },
    {
      id: 'DAO-2026-002', 
      reference: 'AMI-2025-INFRA',
      objet: 'Infrastructure cloud sécurisée',
      type: 'Additif',
      dateDepot: '2024-03-20',
      statut: 'Validé',
      autorite: 'Direction des Systèmes',
      chefProjet: 'Marie Martin',
      description: 'Mise en place d\'une infrastructure cloud haute disponibilité'
    },
    {
      id: 'DAO-2026-003',
      reference: 'AMI-2025-SECUR',
      objet: 'Audit de sécurité renforcé',
      type: 'Normal',
      dateDepot: '2024-03-25',
      statut: 'En attente',
      autorite: 'Agence Nationale de Sécurité',
      chefProjet: 'Pierre Durand',
      description: 'Audit complet de la sécurité des systèmes d\'information'
    }
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('Tous')

  const filteredDaos = daos.filter(dao => {
    const matchesSearch = dao.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dao.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dao.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'Tous' || dao.statut === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'Validé': return 'bg-green-100 text-green-800 border-green-200'
      case 'En cours': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'En attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Rejeté': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'Validé': return <CheckCircle className="h-4 w-4" />
      case 'En cours': return <Clock className="h-4 w-4" />
      case 'En attente': return <AlertCircle className="h-4 w-4" />
      case 'Rejeté': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mes DAO</h1>
          <p className="text-slate-500 text-sm">Gérez vos dossiers d'appel d'offres</p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par référence, objet ou numéro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtre statut */}
          <div className="w-full md:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="Tous">Tous les statuts</option>
                <option value="Validé">Validé</option>
                <option value="En cours">En cours</option>
                <option value="En attente">En attente</option>
                <option value="Rejeté">Rejeté</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des DAO */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Objet
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Autorité
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Chef projet
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredDaos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-sm font-medium text-slate-900 mb-1">Aucun DAO trouvé</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        {searchTerm || filterStatus !== 'Tous' 
                          ? 'Essayez de modifier vos filtres de recherche' 
                          : 'Aucun DAO disponible pour le moment'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDaos.map((dao) => (
                  <tr key={dao.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {dao.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">
                        {dao.reference}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 max-w-xs truncate" title={dao.objet}>
                        {dao.objet}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dao.type === 'Normal' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {dao.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                        {new Date(dao.dateDepot).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatutColor(dao.statut)}`}>
                        {getStatutIcon(dao.statut)}
                        <span className="ml-1">{dao.statut}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                        {dao.autorite}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <User className="h-4 w-4 mr-2 text-slate-400" />
                        {dao.chefProjet}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
