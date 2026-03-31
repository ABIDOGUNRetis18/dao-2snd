import { useEffect, useState } from 'react'
import { Search, Filter, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface DAO {
  id: number
  numero: string
  objet: string
  statut: string
  equipe: string
  date_depot: string
}

export default function AllDAOs() {
  const [daos, setDaos] = useState<DAO[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [loading, setLoading] = useState(true)

  // Mock data pour le développement
  const mockDaos: DAO[] = [
    {
      id: 1,
      numero: 'DAO-2025-001',
      objet: 'Système d\'information RH',
      statut: 'en_cours',
      equipe: 'Équipe Alpha',
      date_depot: '2025-01-15'
    },
    {
      id: 2,
      numero: 'DAO-2025-002',
      objet: 'Infrastructure cloud',
      statut: 'termine',
      equipe: 'Équipe Beta',
      date_depot: '2025-01-20'
    }
  ]

  useEffect(() => {
    // Simulation de chargement des données
    setTimeout(() => {
      setDaos(mockDaos)
      setLoading(false)
    }, 500)
  }, [])

  // Filtrage des DAO
  const filteredDaos = daos.filter(dao => {
    const matchesSearch = searchTerm === '' || 
      dao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.equipe.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'tous' || dao.statut === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const statusOptions = [
    { value: 'tous', label: 'Tous les statuts' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminé' },
    { value: 'en_attente', label: 'En attente' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours': return 'bg-blue-100 text-blue-800'
      case 'termine': return 'bg-green-100 text-green-800'
      case 'en_attente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      case 'en_attente': return 'En attente'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Tous les DAO</h1>
            <p className="text-slate-500 text-sm">
              {filteredDaos.length} DAO trouvé{filteredDaos.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, objet ou équipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtre de statut */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Message d'information */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
          Cliquer sur une carte pour ouvrir le détail
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-slate-500">Chargement des DAO...</p>
          </div>
        )}

        {/* Liste des DAO */}
        {!loading && filteredDaos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDaos.map((dao) => (
              <div
                key={dao.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                onClick={() => {
                  // TODO: Naviguer vers le détail du DAO
                  console.log('Ouvrir le détail du DAO:', dao.id)
                }}
              >
                {/* En-tête avec numéro et statut */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{dao.numero}</h3>
                    <p className="text-sm text-slate-500">{dao.date_depot}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dao.statut)}`}>
                    {getStatusLabel(dao.statut)}
                  </span>
                </div>

                {/* Objet */}
                <div className="mb-3">
                  <h4 className="font-medium text-slate-800 mb-1">Objet</h4>
                  <p className="text-sm text-slate-600 line-clamp-2">{dao.objet}</p>
                </div>

                {/* Équipe */}
                <div className="flex items-center text-sm text-slate-600">
                  <span className="font-medium">Équipe:</span>
                  <span className="ml-2">{dao.equipe}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aucun résultat */}
        {!loading && filteredDaos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun DAO trouvé.</h3>
            <p className="text-slate-500">
              {searchTerm || statusFilter !== 'tous' 
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Commencez par créer un nouveau DAO.'
              }
            </p>
            {(!searchTerm && statusFilter === 'tous') && (
              <div className="mt-4">
                <Link
                  to="/admin/create-dao"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  Créer un DAO
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
