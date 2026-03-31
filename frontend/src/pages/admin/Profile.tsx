import { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Shield, Calendar, Edit2, Save, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api'

interface UserProfile {
  id: number
  username: string
  email: string
  role_id: number
  url_photo?: string
  created_at: string
  updated_at: string
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editForm, setEditForm] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { user: currentUser, token } = useAuth()

  const roleLabels: { [key: number]: string } = {
    1: 'Directeur Général',
    2: 'Administrateur',
    3: 'Chef de Projet',
    4: 'Membre d\'équipe',
    5: 'Lecteur'
  }

  const roleDescriptions: { [key: number]: string } = {
    1: 'Supervision stratégique et validation des décisions importantes',
    2: 'Gestion complète du système et des utilisateurs',
    3: 'Gestion des projets et coordination des équipes',
    4: 'Participation aux projets et exécution des tâches assignées',
    5: 'Accès en lecture seule aux informations'
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.data.user)
        setEditForm(data.data.user)
      } else {
        console.error('Erreur lors du chargement du profil')
        setError('Erreur lors du chargement du profil')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur serveur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (profile) {
      setEditForm({ ...profile })
      setIsEditing(true)
      setError('')
      setSuccess('')
    }
  }

  const handleSave = async () => {
    if (!editForm) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}/${profile?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: editForm.username,
          email: editForm.email,
          role_id: editForm.role_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setProfile(data.data.user)
        setEditForm(data.data.user)
        setIsEditing(false)
        setSuccess('Profil mis à jour avec succès !')
        
        // Mettre à jour le contexte d'authentification si nécessaire
        if (currentUser?.id === data.data.user.id) {
          // Le contexte pourrait être mis à jour ici si nécessaire
        }
      } else {
        setError(data.message || 'Erreur lors de la mise à jour du profil')
      }
    } catch (error) {
      setError('Erreur serveur lors de la mise à jour du profil')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditForm(profile)
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-slate-500">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">{error || 'Profil non trouvé'}</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentForm = isEditing ? editForm : profile

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Mon Profil</h1>
              <p className="text-slate-500 text-sm">Gérez vos informations personnelles</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4" />
                    Annuler
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carte profil principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {currentForm?.url_photo ? (
                    <img
                      src={currentForm.url_photo}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full object-cover border-4 border-slate-100"
                    />
                  ) : (
                    <div className={`h-24 w-24 rounded-full flex items-center justify-center border-4 border-slate-100 ${
                      currentForm?.role_id === 1 ? 'bg-purple-100' :
                      currentForm?.role_id === 2 ? 'bg-blue-100' :
                      currentForm?.role_id === 3 ? 'bg-green-100' :
                      currentForm?.role_id === 4 ? 'bg-orange-100' :
                      'bg-gray-100'
                    }`}>
                      <User className={`h-12 w-12 ${
                        currentForm?.role_id === 1 ? 'text-purple-600' :
                        currentForm?.role_id === 2 ? 'text-blue-600' :
                        currentForm?.role_id === 3 ? 'text-green-600' :
                        currentForm?.role_id === 4 ? 'text-orange-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                  )}
                </div>

                {/* Informations principales */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentForm?.username}</h2>
                    
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">{roleLabels[currentForm?.role_id || 5]}</span>
                    </div>
                    
                    <p className="text-sm text-slate-500 italic">
                      {roleDescriptions[currentForm?.role_id || 5]}
                    </p>
                  </div>

                  {/* Informations détaillées */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nom d'utilisateur</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm?.username || ''}
                          onChange={(e) => handleChange('username', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-slate-900">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>{currentForm?.username}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm?.email || ''}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-slate-900">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span>{currentForm?.email}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                      {isEditing ? (
                        <select
                          value={editForm?.role_id || 5}
                          onChange={(e) => handleChange('role_id', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.entries(roleLabels).map(([id, label]) => (
                            <option key={id} value={id}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-slate-900">
                          {roleLabels[currentForm?.role_id || 5]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carte informations système */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Informations système</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Utilisateur</label>
                  <div className="text-slate-900 font-mono text-sm">#{currentForm?.id.toString().padStart(6, '0')}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    currentForm?.role_id === 1 ? 'bg-purple-100 text-purple-800' :
                    currentForm?.role_id === 2 ? 'bg-blue-100 text-blue-800' :
                    currentForm?.role_id === 3 ? 'bg-green-100 text-green-800' :
                    currentForm?.role_id === 4 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {roleLabels[currentForm?.role_id || 5]}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de création</label>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{new Date(currentForm?.created_at || '').toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dernière mise à jour</label>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{new Date(currentForm?.updated_at || '').toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statut du compte</label>
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Actif
                  </span>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Actions rapides</h4>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                    Changer le mot de passe
                  </button>
                  {currentForm?.role_id !== 2 && (
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      Demander une promotion
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
