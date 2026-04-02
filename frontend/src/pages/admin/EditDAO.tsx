import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

interface User {
  id: number
  username: string
  role: string
  role_id: number
}

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
  description: string
  chef_id: number
  membres: number[]
}

export default function EditDAO() {
  const { id } = useParams<{ id: string }>()
  const [dao, setDao] = useState<DAO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // États du formulaire
  const [dateDepot, setDateDepot] = useState('')
  const [typeDao, setTypeDao] = useState('')
  const [reference, setReference] = useState('')
  const [objet, setObjet] = useState('')
  const [description, setDescription] = useState('')
  const [autorite, setAutorite] = useState('')
  const [chefEquipe, setChefEquipe] = useState('')
  const [membres, setMembres] = useState<string[]>([])
  const [groupement, setGroupement] = useState('non')
  const [nomPartenaire, setNomPartenaire] = useState('')

  // États pour les dropdowns
  const [users, setUsers] = useState<User[]>([])
  const [teamLeaders, setTeamLeaders] = useState<User[]>([])
  const [typeDaoOptions, setTypeDaoOptions] = useState<{value: string, label: string}[]>([])
  const [membresOpen, setMembresOpen] = useState(false)
  const [chefOpen, setChefOpen] = useState(false)
  const [typeDaoOpen, setTypeDaoOpen] = useState(false)
  const [membresFlipUp, setMembresFlipUp] = useState(false)
  const [chefFlipUp, setChefFlipUp] = useState(false)
  const [typeDaoFlipUp, setTypeDaoFlipUp] = useState(false)

  // Références pour les dropdowns
  const membresRef = useRef<HTMLDivElement>(null)
  const membresButtonRef = useRef<HTMLButtonElement>(null)
  const chefRef = useRef<HTMLDivElement>(null)
  const chefButtonRef = useRef<HTMLButtonElement>(null)
  const typeDaoRef = useRef<HTMLDivElement>(null)
  const typeDaoButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (id) {
      loadDao()
      loadUsers()
      loadTypes()
    }
  }, [id])

  const loadDao = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/dao/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        setError('DAO non trouvé')
        return
      }
      
      const data = await response.json()
      if (data.success) {
        const daoData = data.data.dao
        setDao(daoData)
        
        // Remplir le formulaire avec les données existantes
        setDateDepot(daoData.date_depot ? new Date(daoData.date_depot).toISOString().split('T')[0] : '')
        setReference(daoData.reference || '')
        setObjet(daoData.objet || '')
        setDescription(daoData.description || '')
        setAutorite(daoData.autorite || '')
        setChefEquipe(daoData.chef_id?.toString() || '')
        
        // Charger le type de DAO depuis la base de données
        if (daoData.type_dao) {
          setTypeDao(daoData.type_dao)
        }
        
        // Charger les membres si disponibles
        if (daoData.membres && Array.isArray(daoData.membres)) {
          setMembres(daoData.membres.map((id: number) => id.toString()))
        } else if (data.data.members && Array.isArray(data.data.members)) {
          // Utiliser les membres détaillés si disponibles
          setMembres(data.data.members.map((member: any) => member.id.toString()))
        }
        
        setGroupement(daoData.groupement || 'non')
        setNomPartenaire(daoData.nom_partenaire || '')
      }
    } catch (error) {
      setError('Erreur lors du chargement du DAO')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const userList = data.data.users.map((u: any) => ({
            id: Number(u.id),
            username: u.username || u.email || `user-${u.id}`,
            role: getRoleName(u.role_id || u.role_id), // Utiliser role_id au lieu de role
            role_id: u.role_id || u.role_id
          }))
          setUsers(userList)
          
          // Filtrer pour les chefs de projet (role_id 2 ou 3)
          const leaders = userList.filter((u: User) => u.role_id === 2 || u.role_id === 3)
          setTeamLeaders(leaders)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    }
  }

  const loadTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/dao/types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const types = data.data.types.map((t: any) => ({
            value: t.code,
            label: t.libelle
          }))
          setTypeDaoOptions(types)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des types:', error)
    }
  }

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Directeur'
      case 2: return 'Admin'
      case 3: return 'ChefProjet'
      case 4: return 'MembreEquipe'
      case 5: return 'Lecteur'
      default: return 'Inconnu'
    }
  }

  // Fermer les dropdowns si clic à l'extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (membresRef.current && !membresRef.current.contains(e.target as Node)) {
        setMembresOpen(false)
      }
      if (chefRef.current && !chefRef.current.contains(e.target as Node)) {
        setChefOpen(false)
      }
      if (typeDaoRef.current && !typeDaoRef.current.contains(e.target as Node)) {
        setTypeDaoOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openMembres = () => {
    if (!membresButtonRef.current || !membresRef.current) return

    const buttonRect = membresButtonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const menuEstimatedHeight = 260

    if (spaceBelow < menuEstimatedHeight && spaceAbove > menuEstimatedHeight) {
      setMembresFlipUp(true)
    } else {
      setMembresFlipUp(false)
    }
    setMembresOpen((v) => !v)
  }

  const openChef = () => {
    if (!chefButtonRef.current || !chefRef.current) return

    const buttonRect = chefButtonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const menuEstimatedHeight = 260

    if (spaceBelow < menuEstimatedHeight && spaceAbove > menuEstimatedHeight) {
      setChefFlipUp(true)
    } else {
      setChefFlipUp(false)
    }
    setChefOpen((v) => !v)
  }

  const toggleMembre = (userId: string | number) => {
    const idStr = String(userId)
    if (membres.includes(idStr)) {
      setMembres(membres.filter(id => id !== idStr))
    } else {
      setMembres([...membres, idStr])
    }
  }

  const toggleChef = (userId: string | number) => {
    setChefEquipe(String(userId))
    setChefOpen(false)
  }

  const openTypeDao = () => {
    if (!typeDaoButtonRef.current || !typeDaoRef.current) return

    const buttonRect = typeDaoButtonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const menuEstimatedHeight = 260

    if (spaceBelow < menuEstimatedHeight && spaceAbove > menuEstimatedHeight) {
      setTypeDaoFlipUp(true)
    } else {
      setTypeDaoFlipUp(false)
    }
    setTypeDaoOpen((v) => !v)
  }

  const toggleTypeDao = (value: string) => {
    setTypeDao(value)
    setTypeDaoOpen(false)
  }

  const validate = () => {
    if (!dateDepot) return "La date de dépôt est requise."
    if (!reference) return "La référence est requise."
    if (!objet) return "L'objet est requis."
    if (description.trim().length < 5)
      return "La description doit contenir au moins 5 caractères."
    if (!autorite) return "L'autorité contractante est requise."
    if (!chefEquipe) return "Le chef d'équipe doit être assigné."
    if (membres.length === 0)
      return "Au moins un membre d'équipe doit être sélectionné."
    
    if (groupement === "oui" && !nomPartenaire.trim()) {
      return "Le nom de l'entreprise partenaire est requis lorsque le groupement est sélectionné."
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    // Trouver le nom du chef de projet sélectionné
    const selectedChef = teamLeaders.find(leader => leader.id === Number(chefEquipe))
    const chefProjetNom = selectedChef ? selectedChef.username : ''

    // Payload pour la mise à jour
    const payload = {
      reference: reference,
      objet: objet,
      description: description,
      autorite: autorite,
      chef_id: Number(chefEquipe),
      chef_projet_nom: chefProjetNom,
      date_depot: dateDepot,
      groupement: groupement,
      nom_partenaire: groupement === "oui" ? nomPartenaire : null,
      type_dao: typeDao,
      membres: membres.map(id => Number(id)),
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/dao/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || 'Erreur lors de la modification du DAO')
        return
      }

      setSuccess('DAO modifié avec succès')
      setTimeout(() => {
        window.location.href = '/admin/all-daos'
      }, 2000)
    } catch (err) {
      console.error('Erreur lors de la modification du DAO:', err)
      setError('Erreur réseau lors de la modification du DAO')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Chargement...</div>
      </div>
    )
  }

  if (error || !dao) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500">{error || 'DAO non trouvé'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/all-daos"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Modifier le DAO</h1>
            <p className="text-slate-500 text-sm">{dao.numero}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Numéro de DAO
              </label>
              <input
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700"
                value={dao.numero}
                readOnly
              />
              <p className="text-xs text-slate-500 mt-1">
                Numéro de DAO non modifiable
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date de dépôt *</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateDepot}
                onChange={(e) => setDateDepot(e.target.value)}
                required
              />
            </div>

            <div className="relative" ref={typeDaoRef}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type de DAO *</label>
              <button
                ref={typeDaoButtonRef}
                type="button"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={openTypeDao}
              >
                {typeDao
                  ? typeDaoOptions.find(option => option.value === typeDao)?.value || "Type sélectionné"
                  : "Sélectionner un type de DAO..."}
              </button>
              {typeDaoOpen && (
                <div
                  className="absolute z-50 w-full border border-slate-200 rounded-lg bg-white p-2 max-h-60 overflow-auto"
                  style={{
                    ...(typeDaoFlipUp
                      ? { bottom: "calc(100% + 8px)" }
                      : { top: "calc(100% + 8px)" }),
                  }}
                >
                  {typeDaoOptions.length === 0 && (
                    <div className="text-slate-500">Aucun type de DAO disponible</div>
                  )}
                  {typeDaoOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="type-dao"
                        checked={typeDao === option.value}
                        onChange={() => toggleTypeDao(option.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 truncate">
                        {option.value}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {typeDaoOptions.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">Chargement des types de DAO...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Référence *</label>
              <input
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="ex: AMI-2025-SYSINFO"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Groupement</label>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="groupement"
                    value="non"
                    checked={groupement === "non"}
                    onChange={() => {
                      setGroupement("non");
                      setNomPartenaire("");
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Non</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="groupement"
                    value="oui"
                    checked={groupement === "oui"}
                    onChange={() => setGroupement("oui")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Oui</span>
                </label>
              </div>
            </div>

            {groupement === "oui" && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'entreprise partenaire *</label>
                <input
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={nomPartenaire}
                  onChange={(e) => setNomPartenaire(e.target.value)}
                  placeholder="Entrez le nom de l'entreprise partenaire"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Objet du dossier *</label>
              <input
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description détaillée du projet (minimum 5 caractères)
              </label>
              <textarea
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                {description.length}/5 caractères minimum
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Autorité contractante *</label>
              <input
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={autorite}
                onChange={(e) => setAutorite(e.target.value)}
                required
              />
            </div>

            <div className="relative" ref={chefRef}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Chef Projet *</label>
              <button
                ref={chefButtonRef}
                type="button"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={openChef}
              >
                {chefEquipe
                  ? teamLeaders.find(leader => leader.id === Number(chefEquipe))?.username || "Chef sélectionné"
                  : "Sélectionner un chef de projet..."}
              </button>
              {chefOpen && (
                <div
                  className="absolute z-50 w-full border border-slate-200 rounded-lg bg-white p-2 max-h-60 overflow-auto"
                  style={{
                    ...(chefFlipUp
                      ? { bottom: "calc(100% + 8px)" }
                      : { top: "calc(100% + 8px)" }),
                  }}
                >
                  {teamLeaders.length === 0 && (
                    <div className="text-slate-500">Aucun chef de projet disponible</div>
                  )}
                  {teamLeaders.map((leader) => (
                    <label
                      key={leader.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="chef-projet"
                        checked={chefEquipe === String(leader.id)}
                        onChange={() => toggleChef(leader.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 truncate">
                        {leader.username} ({leader.role})
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {teamLeaders.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">Chargement des chefs d'équipe...</p>
              )}
            </div>

            <div className="relative" ref={membresRef}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Membres d'équipe *</label>
              <button
                ref={membresButtonRef}
                type="button"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={openMembres}
              >
                {membres.length > 0
                  ? `${membres.length} membre(s) sélectionné(s)` 
                  : "Sélectionner des membres..."}
              </button>
              {membresOpen && (
                <div
                  className="absolute z-50 w-full border border-slate-200 rounded-lg bg-white p-2 max-h-60 overflow-auto"
                  style={{
                    ...(membresFlipUp
                      ? { bottom: "calc(100% + 8px)" }
                      : { top: "calc(100% + 8px)" }),
                  }}
                >
                  {users.length === 0 && (
                    <div className="text-slate-500">Aucun membre disponible</div>
                  )}
                  {users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id={`m-${u.id}`}
                        checked={membres.includes(String(u.id))}
                        onChange={() => toggleMembre(u.id)}
                        className="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="text-slate-700 truncate">
                        {u.username}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <Link
                to="/admin/all-daos"
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
