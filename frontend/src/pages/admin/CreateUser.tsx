import { useState, useEffect } from 'react'
import { User, Edit, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api'
import { useAuth } from '../../contexts/AuthContext'

interface UserData {
  id: number
  username: string
  email: string
  role_id: number
  url_photo?: string
  created_at: string
  updated_at: string
}

const roleLabels: { [key: number]: string } = {
  1: 'DirecteurGeneral',
  2: 'Administrateur',
  3: 'ChefProjet',
  4: 'MembreEquipe',
  5: 'Lecteur'
}

const roleOptions = [
  { value: 1, label: 'Directeur General' },
  { value: 2, label: 'Administrateur' },
  { value: 3, label: 'Chef de Projet' },
  { value: 4, label: 'Membre d\'équipe' },
  { value: 5, label: 'Lecteur' },
]

export default function CreateUser() {
  const [users, setUsers] = useState<UserData[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role_id: 4, // Par défaut: Membre d'équipe
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { token, user: currentUser } = useAuth()

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.data.users || [])
      } else {
        console.error('Erreur lors de la récupération des utilisateurs')
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDelete = async (userId: number) => {
    // Empêcher la suppression de l'admin principal (même par lui-même)
    if (userId === 1) {
      setError('Impossible de supprimer l\'administrateur principal pour des raisons de sécurité')
      return
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Utilisateur supprimé avec succès')
        fetchUsers()
      } else {
        setError('Erreur lors de la suppression de l\'utilisateur')
      }
    } catch (error) {
      setError('Erreur serveur lors de la suppression')
    }
  }

  const handleEdit = (user: UserData) => {
    // Vérifier si l'utilisateur peut modifier cet utilisateur
    const canEdit = currentUser?.id === user.id || user.id !== 1
    
    if (!canEdit) {
      setError('Seul l\'administrateur principal peut modifier son propre compte')
      return
    }
    
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Ne pas pré-remplir le mot de passe
      role_id: user.role_id
    })
    setShowEditForm(true)
    setShowForm(false)
    setError('')
    setSuccess('')
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!editingUser) return

    // Validation
    if (!formData.username || !formData.email) {
      setError('Le nom d\'utilisateur et l\'email sont requis')
      return
    }

    setLoading(true)

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        role_id: parseInt(formData.role_id.toString())
      }

      // Ajouter le mot de passe seulement s'il est fourni
      if (formData.password) {
        payload.password = formData.password
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Utilisateur modifié avec succès !')
        setEditingUser(null)
        setShowEditForm(false)
        setFormData({
          username: '',
          email: '',
          password: '',
          role_id: 4,
        })
        fetchUsers()
      } else {
        setError(data.message || 'Erreur lors de la modification de l\'utilisateur')
      }
    } catch (error) {
      setError('Erreur serveur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Tous les champs sont requis')
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        role_id: parseInt(formData.role_id.toString())
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Utilisateur créé avec succès !')
        setFormData({
          username: '',
          email: '',
          password: '',
          role_id: 4,
        })
        setShowForm(false)
        fetchUsers()
      } else {
        setError(data.message || 'Erreur lors de la création de l\'utilisateur')
      }
    } catch (error) {
      setError('Erreur serveur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleForm = () => {
    setShowForm(!showForm)
    setShowEditForm(false)
    setEditingUser(null)
    setError('')
    setSuccess('')
  }

  const toggleEditForm = () => {
    setShowEditForm(!showEditForm)
    setShowForm(false)
    setEditingUser(null)
    setError('')
    setSuccess('')
  }

  const getRoleBadgeColor = (roleId: number) => {
    const colors = {
      1: 'bg-purple-100 text-purple-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-gray-100 text-gray-800'
    }
    return colors[roleId as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">Créez et gérez les comptes utilisateurs</p>
        </div>
        <button
          onClick={toggleForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Messages d'alerte */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Ajouter un nouvel utilisateur</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez le nom d'utilisateur"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="exemple@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 6 caractères"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rôle *
                </label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={toggleForm}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer l\'utilisateur'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulaire de modification */}
      {showEditForm && editingUser && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Modifier l'utilisateur</h2>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez le nom d'utilisateur"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="exemple@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nouveau mot de passe (laisser vide pour ne pas changer)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Laisser vide pour conserver l'ancien"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rôle *
                </label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={toggleEditForm}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Modification...' : 'Modifier l\'utilisateur'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Liste des utilisateurs ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date de création</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {user.username}
                            {user.id === 1 && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                                Admin Principal
                              </span>
                            )}
                          </div>
                          {user.url_photo && (
                            <div className="text-xs text-slate-500">Photo disponible</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role_id)}`}>
                        {roleLabels[user.role_id]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={!currentUser || (user.id === 1 && currentUser.id !== user.id)}
                          className={`p-1 transition-colors ${
                            !currentUser || (user.id === 1 && currentUser.id !== user.id)
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                          title={
                            user.id === 1 && currentUser?.id !== user.id 
                              ? 'Seul l\'admin principal peut modifier ce compte' 
                              : 'Modifier'
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={user.id === 1}
                          className={`p-1 transition-colors ${
                            user.id === 1 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-slate-500 hover:text-red-600'
                          }`}
                          title={user.id === 1 ? 'Suppression non autorisée' : 'Supprimer'}
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
