import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, FileText, Calendar, User, Download, Search } from 'lucide-react'
import { getTaskStatusFromProgress } from '../../utils/taskStatusUtils'

interface DAO {
  id: number
  numero: string
  objet: string
  statut: string
  chef_projet_nom: string
  created_at: string
  description?: string
}

interface Document {
  id: number
  titre: string
  type: string
  date: string
  dao_id: number
  dao_numero: string
  chef_projet_nom: string
}

export default function Lecteur() {
  const navigate = useNavigate()
  const [daos, setDaos] = useState<DAO[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Charger les DAOs (en lecture seule)
      const daosResponse = await fetch('http://localhost:3001/api/dao', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (daosResponse.ok) {
        const daosData = await daosResponse.json()
        if (daosData.success) {
          setDaos(daosData.data.daos || [])
        }
      }
      
      // Simuler des documents pour la démo
      const mockDocuments: Document[] = daosData.success ? (daosData.data.daos || []).map((dao: DAO, index) => ({
        id: index + 1,
        titre: `Document DAO ${dao.numero}`,
        type: 'PDF',
        date: dao.created_at,
        dao_id: dao.id,
        dao_numero: dao.numero,
        chef_projet_nom: dao.chef_projet_nom
      })) : []
      
      setDocuments(mockDocuments)
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-700'
      case 'EN_COURS': return 'bg-blue-100 text-blue-700'
      case 'TERMINEE': return 'bg-green-100 text-green-700'
      case 'A_RISQUE': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente'
      case 'EN_COURS': return 'En cours'
      case 'TERMINEE': return 'Terminé'
      case 'A_RISQUE': return 'À risque'
      default: return statut
    }
  }

  const filteredDaos = daos.filter(dao => 
    dao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.chef_projet_nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDocuments = documents.filter(doc => 
    doc.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.dao_numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.chef_projet_nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                L
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Centre de Documentation</h1>
                <p className="text-sm text-slate-500">Accès aux documents et projets</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher des projets ou documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-sm text-slate-500">
              {filteredDaos.length + filteredDocuments.length} résultat{filteredDaos.length + filteredDocuments.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">Projets Actifs</h3>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {daos.filter(d => d.statut === 'EN_COURS').length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">Projets Terminés</h3>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {daos.filter(d => d.statut === 'TERMINEE').length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">Documents</h3>
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-600">{documents.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">Total Projets</h3>
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-slate-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-600">{daos.length}</p>
          </div>
        </div>

        {/* DAOs List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Projets DAO</h2>
            <p className="text-sm text-slate-500">
              {filteredDaos.length} projet{filteredDaos.length > 1 ? 's' : ''}
            </p>
          </div>

          {filteredDaos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Aucun projet trouvé</p>
              <p className="text-xs text-slate-400 mt-1">
                Essayez de modifier votre recherche
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDaos.map((dao) => (
                <div key={dao.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">{dao.numero}</h3>
                      <p className="text-sm text-slate-600">{dao.chef_projet_nom}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(dao.statut)}`}>
                      {getStatutLabel(dao.statut)}
                    </span>
                  </div>
                  
                  <p className="text-slate-700 mb-3 line-clamp-2">{dao.objet}</p>
                  
                  {dao.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{dao.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Créé le {new Date(dao.created_at).toLocaleDateString('fr-FR')}</span>
                    <button
                      onClick={() => navigate(`/admin/dao/${dao.id}`)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Documents</h2>
            <p className="text-sm text-slate-500">
              {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
            </p>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Download className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Aucun document trouvé</p>
              <p className="text-xs text-slate-400 mt-1">
                Les documents apparaîtront ici une fois disponibles
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Titre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">DAO</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Chef de Projet</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{doc.titre}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {doc.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-blue-600">{doc.dao_numero}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600">{doc.chef_projet_nom}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-500">
                          {new Date(doc.date).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/dao/${doc.dao_id}`)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Voir
                          </button>
                          <button
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
