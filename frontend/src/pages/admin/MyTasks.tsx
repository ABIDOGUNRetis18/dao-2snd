import { useEffect, useState } from 'react'
import { Search, ArrowLeft, Calendar, User, FileText, MessageSquare, Filter, Clock, AlertTriangle, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import './MyTasks.css'

interface Task {
  id: number
  id_task: number
  nom: string
  dao_id: number
  dao_numero: string
  dao_objet: string
  statut: string | null
  progress: number | null
  priority: 'low' | 'medium' | 'high' | null
  due_date: string | null
  assigned_to: number | null
  assigned_username: string | null
  assigned_email: string | null
  chef_projet_nom: string | null
  created_at: string
  updated_at: string
}

interface Message {
  id: number
  task_id: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
  mentioned_user_id: number | null
  mentioned_user_name: string | null
  is_public: boolean
  username: string
}

interface User {
  id: number
  username: string
  email: string
  role_id: number
}

interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showComments, setShowComments] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<{[key: number]: Message[]}>({})
  const [progressTimeout, setProgressTimeout] = useState<number | null>(null)
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [commentInputRef, setCommentInputRef] = useState<HTMLTextAreaElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadMyTasks()
    loadCurrentUser()
    loadAvailableUsers()
    // loadNotifications() // Désactivé - non utile pour cette section
    
    // Nettoyage du timeout lors du démontage
    return () => {
      if (progressTimeout) {
        clearTimeout(progressTimeout)
      }
    }
  }, [])

  // Surveillance automatique des notifications (toutes les 5 minutes) - Temporarily disabled
  // useEffect(() => {
  //   if (!user) return

  //   const checkNotificationsAndDeposits = async () => {
  //     try {
  //       // Vérifier les notifications avec checkDeposits
  //       const res = await fetch(`http://localhost:3001/api/notifications?userId=${user.id}&checkDeposits=true`, {
  //         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  //         cache: 'no-store'
  //       })
        
  //       if (res.ok) {
  //         const data = await res.json()
  //         console.log('Notifications vérifiées:', data)
  //         // Recharger les notifications locales
  //         await loadNotifications()
  //       }
  //     } catch (error) {
  //       console.error('Erreur lors de la vérification des notifications:', error)
  //     }
  //   }

  //   // Vérification immédiate
  //   checkNotificationsAndDeposits()
    
  //   // Toutes les 5 minutes
  //   const interval = setInterval(checkNotificationsAndDeposits, 5 * 60 * 1000)
    
  //   return () => clearInterval(interval)
  // }, [user])

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const usersData = await res.json()
        setAvailableUsers(usersData.users || [])
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    }
  }

  const loadNotifications = async () => {
    // Désactivé - non utile pour cette section
    return
    // try {
    //   const token = localStorage.getItem('token')
    //   const res = await fetch(`http://localhost:3001/api/notifications?userId=${user?.id}`, {
    //     headers: { 'Authorization': `Bearer ${token}` }
    //   })
    //   if (res.ok) {
    //     const notifsData = await res.json()
    //     setNotifications(notifsData.notifications || [])
    //     const unread = notifsData.notifications?.filter((n: Notification) => !n.is_read).length || 0
    //     setUnreadCount(unread)
    //   }
    // } catch (error) {
    //   console.error('Erreur chargement notifications:', error)
    // }
  }

  const loadMyTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const res = await fetch('http://localhost:3001/api/my-tasks', { headers })
      
      if (res.ok) {
        const d = await res.json()
        if (d.success) {
          const tasksData = d.data.tasks || []
          setTasks(tasksData)
          // calculateStats(tasksData) // Supprimé - section statistiques retirée
        }
      } else {
        console.error('Erreur lors du chargement des tâches')
      }
    } catch (error) {
      console.error('Erreur réseau:', error)
    } finally {
      setLoading(false)
    }
  }

  // const calculateStats = (tasksData: Task[]) => {
  //   const now = new Date()
  //   const stats = {
  //     total: tasksData.length,
  //     completed: tasksData.filter(t => t.statut === 'termine').length,
  //     inProgress: tasksData.filter(t => t.statut === 'en_cours').length,
  //     overdue: tasksData.filter(t => {
  //       if (!t.due_date) return false
  //       return new Date(t.due_date) < now && t.statut !== 'termine'
  //     }).length,
  //     highPriority: tasksData.filter(t => t.priority === 'high').length
  //   }
  //   setStats(stats)
  // }

  // Affichage direct des tâches sans filtrage

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800'
      case 'en_cours': return 'bg-blue-100 text-blue-800'
      case 'termine': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'Haute'
      case 'medium': return 'Moyenne'
      case 'low': return 'Basse'
      default: return 'Non définie'
    }
  }

  const isOverdue = (dueDate: string | null, status: string | null) => {
    if (!dueDate || status === 'termine') return false
    return new Date(dueDate) < new Date()
  }

  const filteredUsers = availableUsers.filter(u => 
    u.username.toLowerCase().includes(mentionFilter.toLowerCase()) &&
    u.id !== user?.id
  )

  const updateTaskProgress = async (taskId: number, progress: number, statut: string) => {
    try {
      // Temporairement sans authentification pour contourner le problème de token
      const res = await fetch(`http://localhost:3001/api/task-progress/${taskId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress, statut }),
      })
      
      if (res.ok) {
        const responseData = await res.json()
        console.log('✅ Progression mise à jour:', responseData.data.task)
        // Mettre à jour la tâche dans le state local
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, progress, statut }
            : task
        ))
      } else {
        const errorData = await res.json()
        console.error('❌ Erreur lors de la mise à jour:', errorData)
        alert('Erreur lors de la mise à jour: ' + (errorData.message || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error)
      alert('Erreur réseau: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }

  const handleTaskClick = (task: Task) => {
    // Naviguer vers la page des tâches du DAO spécifique
    navigate(`/admin/dao/${task.dao_id}/tasks`)
  }

  const toggleComments = async (taskId: number) => {
    if (showComments === taskId) {
      setShowComments(null)
    } else {
      setShowComments(taskId)
      await loadTaskMessages(taskId)
    }
  }

  const loadTaskMessages = async (taskId: number) => {
    // Désactivé - non utile pour cette section
    return
    // try {
    //   const token = localStorage.getItem('token')
    //   const res = await fetch(`http://localhost:3001/api/messages?task_id=${taskId}`, {
    //     headers: { 'Authorization': `Bearer ${token}` }
    //   })
    //   if (res.ok) {
    //     const messagesData = await res.json()
    //     setComments(prev => ({ ...prev, [taskId]: messagesData.messages || [] }))
    //   }
    // } catch (error) {
    //   console.error('Erreur chargement messages:', error)
    // }
  }

  const addComment = async (taskId: number) => {
    // Désactivé - non utile pour cette section
    return
    // if (!commentText.trim()) return
    
    // try {
    //   // Extraire les mentions et trouver les utilisateurs correspondants
    //   const mentionMatches = commentText.match(/@(\w+)/g) || []
    //   let mentionedUserId: number | null = null
    //   let mentionedUserName: string | null = null
      
    //   if (mentionMatches.length > 0) {
    //     const mentionUsername = mentionMatches[0].substring(1)
    //     const mentionedUser = availableUsers.find(u => u.username === mentionUsername)
    //     if (mentionedUser && user) {
    //       mentionedUserId = mentionedUser.id
    //       mentionedUserName = mentionedUser.username
    //     }
    //   }
      
    //   const token = localStorage.getItem('token')
    //   const res = await fetch('http://localhost:3001/api/messages', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify({
    //       task_id: taskId,
    //       user_id: user?.id,
    //       content: commentText.trim(),
    //       mentioned_user_id: mentionedUserId,
    //       mentioned_user_name: mentionedUserName,
    //       is_public: true
    //     })
    //   })
      
    //   if (res.ok) {
    //     const messageData = await res.json()
    //     // Ajouter le message au state local
    //     const newMessage = messageData.message
    //     setComments(prev => ({
    //       ...prev,
    //       [taskId]: [...(prev[taskId] || []), newMessage]
    //     }))
        
    //     setCommentText('')
    //     setShowMentionSuggestions(false)
        
    //     // Recharger les notifications si une mention a été faite
    //     if (mentionedUserId && mentionedUserId !== user?.id) {
    //       await loadNotifications()
    //     }
    //   } else {
    //     console.error('Erreur lors de l\'ajout du commentaire')
    //     alert('Erreur lors de l\'ajout du commentaire')
    //   }
    // } catch (error) {
    //   console.error('Erreur réseau:', error)
    //   alert('Erreur réseau: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    // }
  }

  const handleCommentInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setCommentText(text)
    
    // Détecter si l'utilisateur tape @ pour afficher les suggestions
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = text.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const mentionText = textBeforeCursor.substring(lastAtIndex + 1)
      const nextSpaceIndex = mentionText.indexOf(' ')
      
      if (nextSpaceIndex === -1) {
        // L'utilisateur est en train de taper une mention
        setMentionFilter(mentionText)
        setShowMentionSuggestions(true)
      } else {
        setShowMentionSuggestions(false)
      }
    } else {
      setShowMentionSuggestions(false)
    }
  }

  const handleMentionSelect = (selectedUser: User) => {
    const text = commentText
    const cursorPos = commentInputRef?.selectionStart || text.length
    const textBeforeCursor = text.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    const newText = text.substring(0, lastAtIndex) + `@${selectedUser.username} ` + text.substring(cursorPos)
    setCommentText(newText)
    setShowMentionSuggestions(false)
    
    // Mettre le focus après la mention
    setTimeout(() => {
      if (commentInputRef) {
        const newCursorPos = lastAtIndex + selectedUser.username.length + 2
        commentInputRef.setSelectionRange(newCursorPos, newCursorPos)
        commentInputRef.focus()
      }
    }, 0)
  }

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'error': return '🚨'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      case 'success': return '✅'
      case 'user': return '👤'
      case 'system': return '⚙️'
      case 'comment': return '💬'
      case 'mention': return '🏷️'
      default: return '🔔'
    }
  }

  const markNotificationAsRead = async (notificationId: number) => {
    // Temporarily disabled - notifications endpoint not implemented
    return
    // try {
    //   const token = localStorage.getItem('token')
    //   const res = await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
    //     method: 'PUT',
    //     headers: { 'Authorization': `Bearer ${token}` }
    //   })
      
    //   if (res.ok) {
    //     setNotifications(prev => 
    //       prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    //     )
    //     setUnreadCount(prev => Math.max(0, prev - 1))
    //   }
    // } catch (error) {
    //   console.error('Erreur lors du marquage de notification comme lue:', error)
    // }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'user': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'system': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'comment': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'mention': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const updateProgressContinuous = async (taskId: number, progress: number) => {
    const statut = progress === 0 ? 'a_faire' : progress === 100 ? 'termine' : 'en_cours'
    
    // Mise à jour locale immédiate pour une réponse instantanée
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, progress, statut }
        : task
    ))
    
    // Mise à jour en arrière-plan avec debounce
    if (progressTimeout) {
      clearTimeout(progressTimeout)
    }
    
    const newTimeout = setTimeout(async () => {
      await updateTaskProgress(taskId, progress, statut)
    }, 300) as unknown as number
    
    setProgressTimeout(newTimeout)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 animate-fadeInUp">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-3 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Mes Tâches</h1>
              <p className="text-slate-500 text-sm">
                {tasks.length} tâche{tasks.length > 1 ? 's' : ''} trouvée{tasks.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-600">
                  Bienvenue, <span className="font-semibold">{user.username}</span>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Admin
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-300 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 font-medium">Chargement des tâches...</p>
          </div>
        )}

        {/* Liste des tâches */}
        {!loading && tasks.length > 0 && (
          <div className="space-y-4">
            {tasks.map((task: Task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 task-card"
              >
                {/* En-tête avec titre et statut */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-2 task-title">
                      {task.nom}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      {isOverdue(task.due_date, task.statut) && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          En retard
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(task.statut)}`}>
                      {task.statut === 'a_faire' ? 'À faire' : task.statut === 'en_cours' ? 'En cours' : task.statut === 'termine' ? 'Terminé' : 'Non défini'}
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      {(task.progress || 0)}% complété
                    </span>
                  </div>
                </div>

                {/* Barre de progression continue */}
                <div className="mb-4 no-navigate">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 w-20">Progression:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={task.progress || 0}
                      onChange={(e) => updateProgressContinuous(task.id, parseInt(e.target.value))}
                      className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(task.progress || 0)}%, #e2e8f0 ${(task.progress || 0)}%, #e2e8f0 100%)`
                      }}
                    />
                    <span className="text-sm font-bold text-slate-700 w-12 text-right">
                      {task.progress || 0}%
                    </span>
                  </div>
                </div>

                {/* Informations DAO et assignation */}
                <div className="bg-slate-50 rounded-lg p-3 mb-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{task.dao_numero}</span>
                  </div>
                  <p className="text-sm text-slate-600">{task.dao_objet}</p>
                  
                  {/* Information d'assignation */}
                  {task.chef_projet_nom && (
                    <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 px-2 py-1.5 rounded-md">
                      <User className="h-3 w-3" />
                      <span>
                        Assigné par <span className="font-semibold">{task.chef_projet_nom}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Date de création et boutons d'action */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Créée le {new Date(task.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className={`font-medium ${isOverdue(task.due_date, task.statut) ? 'text-red-600' : 'text-slate-700'}`}>
                          Échéance {new Date(task.due_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {task.assigned_username && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-slate-700">
                          Assigné à {task.assigned_username}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 no-navigate">
                    {(task.progress || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-blue-600 font-medium">
                          {(task.progress || 0)}% terminé
                        </span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleComments(task.id)
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Commentaires
                      {comments[task.id] && comments[task.id].length > 0 && (
                        <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {comments[task.id].length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Section des commentaires */}
                {showComments === task.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 no-navigate comment-section">
                    <div className="space-y-3">
                      {/* Ajouter un commentaire */}
                      <div className="flex gap-2 relative">
                        <textarea
                          ref={setCommentInputRef}
                          value={commentText}
                          onChange={handleCommentInputChange}
                          placeholder="Ajouter un commentaire... @utilisateur pour mentionner"
                          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                          rows={2}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              addComment(task.id)
                            }
                          }}
                        />
                        <button
                          onClick={() => addComment(task.id)}
                          className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Ajouter
                        </button>
                        
                        {/* Suggestions de mentions */}
                        {showMentionSuggestions && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 max-h-32 overflow-y-auto z-10 mt-1">
                            <p className="text-xs text-slate-500 mb-2">Suggestions:</p>
                            <div className="flex flex-col gap-1">
                              {filteredUsers.length > 0 ? (
                                filteredUsers.map(u => (
                                  <button
                                    key={u.id}
                                    onClick={() => handleMentionSelect(u)}
                                    className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors text-left w-full"
                                  >
                                    @{u.username}
                                  </button>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400">Aucun utilisateur trouvé</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Afficher les commentaires existants */}
                      {comments[task.id] && comments[task.id].length > 0 && (
                        <div className="space-y-2">
                          {comments[task.id].map((message) => (
                            <div key={message.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {message.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-slate-700">{message.username}</span>
                                    <span className="text-xs text-slate-500">
                                      {new Date(message.created_at).toLocaleString('fr-FR')}
                                    </span>
                                    {message.mentioned_user_name && (
                                      <span className="text-xs text-orange-600">
                                        → @{message.mentioned_user_name}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-700 whitespace-pre-wrap">{message.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {(!comments[task.id] || comments[task.id].length === 0) && (
                        <p className="text-sm text-slate-400 italic text-center py-4">Aucun commentaire pour cette tâche.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Aucune tâche trouvée */}
        {!loading && tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Aucune tâche assignée.
            </h3>
            <p className="text-slate-500">
              Vous n'avez pas de tâches assignées pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
