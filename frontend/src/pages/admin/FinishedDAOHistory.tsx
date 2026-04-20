import { useEffect, useState } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FinishedDAO {
  id: number
  numero: string
  objet: string
  date_depot: string
  date_fin: string
  reference: string
  autorite: string
  chef_projet_nom: string
  groupement: string
  nom_partenaire?: string
  statut: string
}

export default function FinishedDAOHistory() {
  const [daos, setDaos] = useState<FinishedDAO[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const loadFinishedDaos = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/dao/finished', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        console.error('Erreur lors du chargement des DAO terminés')
        return
      }

      const data = await response.json()
      if (data.success) {
        console.log('Données DAO terminés reçues:', data.data.daos)
        setDaos(data.data.daos || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des DAO terminés:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinishedDaos()
  }, [])

  // Filtrage des DAO
  const filteredDaos = daos.filter(dao => {
    const matchesSearch = searchTerm === '' || 
      dao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.autorite.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.chef_projet_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.groupement.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'termine': return 'bg-green-100 text-green-800'
      case 'annule': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'termine': return 'Terminé'
      case 'annule': return 'Annulé'
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
            <h1 className="text-xl font-bold text-slate-800">Historique des DAO terminés</h1>
            <p className="text-slate-500 text-sm">
              {filteredDaos.length} DAO terminé{filteredDaos.length > 1 ? 's' : ''} trouvé{filteredDaos.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, objet, référence, type, autorité, chef ou groupement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-slate-500">Chargement de l'historique...</p>
          </div>
        )}

        {/* Tableau des DAO terminés */}
        {!loading && filteredDaos.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Numéro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Objet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date Dépôt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Référence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Autorité</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chef de projet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Groupement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredDaos.map((dao) => (
                    <tr 
                      key={dao.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => {
                        // TODO: Naviguer vers le détail du DAO
                        console.log('Ouvrir le détail du DAO:', dao.id)
                      }}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{dao.numero}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{dao.objet}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {new Date(dao.date_depot).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{dao.reference}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{dao.autorite}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {dao.chef_projet_nom || 'Non assigné'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
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
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dao.statut)}`}>
                          {getStatusLabel(dao.statut)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aucun DAO trouvé */}
        {!loading && filteredDaos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? 'Aucun DAO trouvé.' : 'Aucun DAO terminé.'}
            </h3>
            <p className="text-slate-500">
              {searchTerm 
                ? 'Essayez de modifier votre recherche.'
                : 'Il n\'y a aucun DAO terminé dans l\'historique pour le moment.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
