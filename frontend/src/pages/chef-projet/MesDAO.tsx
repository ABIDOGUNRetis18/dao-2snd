import { useEffect, useState } from 'react'
import { Search, Filter, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface DAO {
  id: number
  numero: string
  objet: string
  reference: string
  date_depot: string
  autorite: string
  chef_projet_nom: string
  groupement: string
  nom_partenaire?: string
  statut: string
  created_at: string
}


export default function MesDAOs() {
  const [daos, setDaos] = useState<DAO[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDaos()
  }, [])

  const loadDaos = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/dao/mes-daos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        console.error('Erreur lors du chargement des DAO')
        return
      }
      
      const data = await response.json()
      if (data.success) {
        // Filtrer pour ne pas afficher les DAO archivés
        const nonArchivedDaos = (data.data.daos || []).filter((dao: any) => dao.statut !== 'ARCHIVE')
        setDaos(nonArchivedDaos)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des DAO:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'EN_COURS':
        return 'bg-blue-100 text-blue-800'
      case 'TERMINE':
        return 'bg-green-100 text-green-800'
      case 'A_RISQUE':
      case 'EN_RETARD':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgression = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return 25
      case 'EN_COURS':
        return 60
      case 'TERMINE':
        return 100
      case 'A_RISQUE':
      case 'EN_RETARD':
        return 40
      default:
        return 0
    }
  }

  const getProgressionColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'bg-yellow-500'
      case 'EN_COURS':
        return 'bg-blue-500'
      case 'TERMINE':
        return 'bg-green-500'
      case 'A_RISQUE':
      case 'EN_RETARD':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Filtrage des DAO
  const filteredDaos = daos.filter(dao => {
    const matchesSearch = searchTerm === '' || 
      dao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.reference.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'tous' || dao.statut === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/chef-projet"
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mes DAO</h1>
          <p className="text-slate-500 text-sm">
            {filteredDaos.length} DAO trouvé{filteredDaos.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, objet ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filtre par statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="tous">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="A_RISQUE">À risque</option>
            </select>
          </div>
        </div>
      </div>

      {/* DAO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-500">Chargement...</div>
          </div>
        ) : filteredDaos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-500">Aucun DAO trouvé.</div>
          </div>
        ) : (
          filteredDaos.map((dao) => (
            <div 
              key={dao.id} 
              className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
              onClick={() => window.location.href = `/chef-projet/dao/${dao.id}`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-900">{dao.numero}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutColor(dao.statut)}`}>
                    {dao.statut?.replace('_', ' ') || 'Non défini'}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-1">{dao.objet}</h3>
                <p className="text-sm text-slate-500">Référence: {dao.reference}</p>
              </div>
              
              {/* Progression Bar */}
              <div className="px-4 py-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">Progression</span>
                  <span className="text-xs font-medium text-slate-600">{getProgression(dao.statut)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressionColor(dao.statut)}`}
                    style={{ width: `${getProgression(dao.statut)}%` }}
                  />
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Date de dépôt:</span>
                  <span className="text-sm text-slate-700">
                    {new Date(dao.date_depot).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Autorité:</span>
                  <span className="text-sm text-slate-700">{dao.autorite}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Chef de projet:</span>
                  <span className="text-sm text-slate-700">{dao.chef_projet_nom || 'Non assigné'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Groupement:</span>
                  <span className="text-sm text-slate-700">
                    {dao.groupement === "oui" ? (
                      dao.nom_partenaire ? (
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {dao.nom_partenaire.replace(/,/g, ",\n")}
                        </span>
                      ) : (
                        "-"
                      )
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              </div>
              
              {/* Card Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                {/* Pas d'actions pour le chef projet */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
