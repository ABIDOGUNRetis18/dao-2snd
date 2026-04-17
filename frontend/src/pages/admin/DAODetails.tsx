import { useState, useMemo, useEffect, useRef } from "react";
import {
  ArrowLeft, X, Send, User, UserCheck, 
  MessageCircle, Download, Clock
} from "lucide-react";
import { Link, useParams } from 'react-router-dom'

// Interfaces TypeScript
interface Dao {
  id: number;
  numero: string;
  reference: string;
  objet: string;
  description?: string;
  autorite: string;
  date_depot?: string;
  statut?: string;
  chef_id?: number | null;
  chef_projet?: string | null;
  groupement?: string | null;
  nom_partenaire?: string | null;
}

interface Task {
  id: number;
  id_task?: number;
  name: string;
  progress: number;
  comment: string;
  assigned_to?: string;
  assigned_username?: string;
  assigned_email?: string;
  statut?: string;
}

interface Comment {
  id: number;
  user: string;
  role: string;
  text: string;
  time: string;
  task_id: number;
  user_id?: number;
  mentioned_user_id?: number;
  mentioned_user_name?: string;
  is_public?: boolean;
}

export default function DAODetails() {
  const { id } = useParams<{ id: string }>()
  const [dao, setDao] = useState<Dao | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [globalComment, setGlobalComment] = useState("")
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Logique de permissions pour l'Admin
  const canManageDao = useMemo(() => {
    if (!currentUser || !dao) return false
    
    // Si l'utilisateur est Admin, vérifier s'il est le chef de ce DAO
    if (currentUser.role_id === 2) {
      return Number(dao.chef_id) === Number(currentUser.id)
    }
    
    // Les autres rôles (Chef de projet) peuvent toujours gérer leurs DAOs
    return true
  }, [currentUser, dao])

  const isReadOnlyMode = useMemo(() => {
    return currentUser?.role_id === 2 && !canManageDao
  }, [currentUser, canManageDao])

  // Calcul de la progression globale
  const globalProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const total = tasks.reduce((sum, t) => sum + t.progress, 0);
    return Math.round(total / tasks.length);
  }, [tasks]);

  // Chargement principal
  useEffect(() => {
    async function loadDao() {
      try {
        setLoading(true);
        setError("");

        // 1. Charger les infos du DAO
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3001/api/dao/${id}`, { 
          cache: "no-store",
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(json?.message || "Erreur lors du chargement du DAO");
          return;
        }

        setDao(json.data.dao);
        
        // 2. Charger les tâches du DAO
        await loadTasks(id || '');
        
        // 3. Charger les utilisateurs pour les mentions
        await loadUsers();
        
        // 4. Charger l'utilisateur courant
        const userFromStorage = localStorage.getItem('user');
        if (userFromStorage) {
          const userData = JSON.parse(userFromStorage);
          setCurrentUser({
            id: userData.id,
            name: userData.username || userData.email?.split('@')[0] || 'Utilisateur'
          });
        }
      } catch (err) {
        setError("Erreur réseau lors du chargement du DAO");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadDao();
    }
  }, [id]);

  // Chargement des tâches avec validation d'isolation
  const loadTasks = async (daoId: string) => {
    try {
      // Validation du daoId
      if (!daoId || isNaN(Number(daoId))) {
        console.error("DAO ID invalide:", daoId);
        setTasks([]);
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/tasks?daoId=${daoId}`, { 
        cache: "no-store",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      console.log("Réponse API tâches pour DAO", daoId, ":", json);

      if (res.ok && json.success) {
        // L'API retourne data.tasks, pas data directement
        const tasksData = json.data.tasks || json.data || [];
        console.log("Données de tâches brutes:", tasksData);
        
        // Validation d'isolation : vérifier que toutes les tâches appartiennent bien au DAO
        const validatedTasks = tasksData.filter((task: any) => {
          const belongsToDao = task.dao_id === Number(daoId);
          if (!belongsToDao) {
            console.warn(`Tâche ${task.id} n'appartient pas au DAO ${daoId} (dao_id: ${task.dao_id})`);
          }
          return belongsToDao;
        });
        
        const adaptedTasks = validatedTasks.map((task: any) => ({
          id: task.id,
          id_task: task.id_task,
          name: task.titre || task.name || task.nom || `Tâche ${task.id}`,
          progress: task.progress || 0,
          comment: task.description || "À faire",
          assigned_to: task.assigned_to,
          assigned_username: task.assigned_username || "Non assigné",
          assigned_email: task.assigned_email,
          statut: task.statut,
          priorite: task.priorite,
          date_echeance: task.date_echeance,
          dao_id: task.dao_id
        }));
        
        console.log("Tâches adaptées et validées:", adaptedTasks);
        setTasks(adaptedTasks);
        
        // Charger les commentaires pour la première tâche
        if (adaptedTasks.length > 0) {
          await loadComments(adaptedTasks[0].id);
          setSelectedTaskId(adaptedTasks[0].id);
        }
      } else {
        console.error("Erreur API tâches:", json);
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]);
    }
  };

  // Chargement des commentaires
  const loadComments = async (taskId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/messages?task_id=${taskId}`, {
        cache: "no-store",
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        const adaptedComments = result.data.map((msg: any) => ({
          id: msg.id,
          user: msg.user_name || 'Utilisateur',
          role: 'Utilisateur',
          text: msg.content,
          time: new Date(msg.created_at).toLocaleString('fr-FR'),
          task_id: msg.task_id,
          user_id: msg.user_id,
          mentioned_user_id: msg.mentioned_user_id,
          mentioned_user_name: msg.mentioned_user_name,
          is_public: msg.is_public
        }));
        
        setComments(adaptedComments);
      }
    } catch (error) {
      console.error('Erreur réseau lors du chargement des commentaires:', error);
    }
  };

  // Filtrage commentaires par visibilité selon la logique décrite
  const getFilteredComments = () => {
    return comments.filter(comment => {
      // Exclure ses propres messages
      if (comment.user_id === currentUser?.id) return false;
      
      // Afficher commentaires publics
      if (comment.is_public) return true;
      
      // Afficher mentions privées uniquement si destinataire
      return comment.mentioned_user_id === currentUser?.id;
    });
  };

  // Chargement des utilisateurs pour les mentions
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users', { 
        cache: "no-store",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const adaptedUsers = result.data.map((user: any) => ({
          id: user.id,
          name: user.username || user.name,
          email: user.email
        }));
        setUsers(adaptedUsers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  // Logique des mentions
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);
    
    // Détecter les mentions @
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setShowMentionSuggestions(true);
      setMentionSearch(mentionMatch[1]);
    } else {
      setShowMentionSuggestions(false);
      setMentionSearch("");
    }
  };

  // Insertion de mention
  const insertMention = (user: any) => {
    if (!commentInputRef.current) return;
    
    const textarea = commentInputRef.current;
    const cursorPosition = textarea.selectionStart;
    const text = newComment;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, textBeforeCursor.length - mentionMatch[0].length);
      const afterCursor = text.substring(cursorPosition);
      const newText = `${beforeMention}@${user.name} ${afterCursor}`;
      
      setNewComment(newText);
      setShowMentionSuggestions(false);
      
      // Repositionner le curseur
      setTimeout(() => {
        const newCursorPosition = beforeMention.length + user.name.length + 2;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        textarea.focus();
      }, 0);
    }
  };

  // Ajout de commentaire par tâche avec logique de mentions privées
  const addComment = async () => {
    if (!newComment.trim() || !currentUser || !selectedTaskId) return;

    try {
      // Détection mentions @username pour déterminer si le message est privé
      const mentionMatch = newComment.match(/^@(\w+)/);
      let mentionedUserId = null;
      let isPublic = true;

      if (mentionMatch) {
        const mentionedUser = users.find(u => 
          u.name.toLowerCase() === mentionMatch[1].toLowerCase()
        );
        if (mentionedUser) {
          mentionedUserId = mentionedUser.id;
          isPublic = false; // Message privé si mention au début
        }
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          task_id: selectedTaskId,
          dao_id: id,
          user_id: currentUser.id,
          mentioned_user_id: mentionedUserId,
          is_public: isPublic
        })
      });

      if (response.ok) {
        setNewComment('');
        await loadComments(selectedTaskId);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    }
  };

  
  // Ajout de commentaire global
  const addGlobalComment = async () => {
    if (!globalComment.trim() || !currentUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: globalComment,
          task_id: null, // Commentaire global (non lié à une tâche)
          dao_id: id,
          user_id: currentUser.id,
          is_public: true
        })
      });

      if (response.ok) {
        setGlobalComment('');
        setShowCommentModal(false);
        // Recharger les commentaires si nécessaire
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    }
  };

  
  // Gestion du chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    );
  }

  if (error || !dao) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500 text-sm">{error || 'DAO non trouvé'}</div>
      </div>
    );
  }

  // Interface utilisateur complète selon l'image
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation et actions */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Navigation retour */}
            <div className="flex items-center">
              <Link to="/admin/all-daos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Link>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-gray-900">{dao.numero}</h1>
                <p className="text-sm text-gray-500">{dao.objet || dao.reference}</p>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>Chef: {dao.chef_projet || 'Non assigné'}</span>
                  </div>
                  {dao.date_depot && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Dépôt: {new Date(dao.date_depot).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Indicateur de permissions pour Admin */}
              {isReadOnlyMode && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  <span className="text-xs font-medium">Lecture seule</span>
                </div>
              )}
              
              {/* Statut */}
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                dao.statut === 'A_RISQUE' ? 'bg-red-100 text-red-800' :
                dao.statut === 'TERMINEE' ? 'bg-green-100 text-green-800' :
                dao.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {dao.statut === 'A_RISQUE' ? 'À risque' :
                 dao.statut === 'TERMINEE' ? 'Terminée' :
                 dao.statut === 'EN_COURS' ? 'En cours' :
                 'En attente'}
              </span>
              
              {/* Boutons d'action */}
              <button 
                onClick={() => !isReadOnlyMode && setShowCommentModal(true)}
                disabled={isReadOnlyMode}
                className={`p-2 rounded-lg transition-colors ${
                  isReadOnlyMode 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={isReadOnlyMode ? "Vous ne pouvez pas commenter ce DAO (vous n'êtes pas le chef)" : "Ajouter un commentaire global"}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button 
                onClick={() => window.print()}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                title="Exporter en PDF"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                disabled={isReadOnlyMode}
                className={`p-2 rounded-lg transition-colors ${
                  isReadOnlyMode 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={isReadOnlyMode ? "Actions limitées (vous n'êtes pas le chef)" : "Actions du DAO"}
              >
                <UserCheck className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section progression globale */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Progression globale du DAO</h2>
              <p className="text-sm text-gray-500 mt-1">
                {tasks.filter(t => t.progress === 100).length} / {tasks.length} tâches terminées
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {dao.date_depot && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Date dépôt: {new Date(dao.date_depot).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>Progression: {globalProgress}%</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{globalProgress}%</div>
              <div className="text-sm text-gray-500">Progression totale</div>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </section>

        {/* Section progression des tâches */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Progression des tâches</h2>
            <div className="text-sm text-gray-500">
              {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
            </div>
          </div>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune tâche trouvée pour ce DAO.</p>
              <p className="text-sm text-gray-400 mt-2">
                Les 15 tâches standards devraient être créées automatiquement lors de la création du DAO.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tasks.map((task) => (
              <div
                key={task.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTaskId === task.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => {
                  setSelectedTaskId(task.id);
                  loadComments(task.id);
                }}
              >
                {/* Header avec nom et utilisateur assigné */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm mb-1">{task.name}</h5>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3 h-3" />
                      <span>{task.assigned_username || 'Non assigné'}</span>
                    </div>
                  </div>
                  
                  {/* Badge de statut */}
                  <span className={`px-2 py-1 text-xs rounded ${
                    task.progress === 100 
                      ? 'bg-green-100 text-green-800'    // Terminé
                      : task.progress > 0 
                      ? 'bg-yellow-100 text-yellow-800'   // En cours
                      : 'bg-gray-100 text-gray-800'       // À faire
                  }`}>
                    {task.progress === 100 ? 'Terminé' : task.progress > 0 ? 'En cours' : 'À faire'}
                  </span>
                </div>
                
                {/* Barre de progression */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Progression</span>
                    <span className="font-medium">{task.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        task.progress === 100 
                          ? 'bg-green-500'     // Vert si terminé
                          : task.progress > 0 
                          ? 'bg-yellow-500'    // Jaune si en cours
                          : 'bg-gray-400'      // Gris si à faire
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </section>

        {/* Section commentaires */}
        {selectedTaskId && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Commentaires</h2>
              <div className="text-sm text-gray-500">
                {comments.filter(comment => comment.task_id === selectedTaskId).length} commentaire{comments.filter(comment => comment.task_id === selectedTaskId).length > 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              {getFilteredComments()
                .filter(comment => comment.task_id === selectedTaskId)
                .map(comment => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {comment.user.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm text-gray-900">{comment.user}</div>
                        <div className="text-xs text-gray-500">{comment.role}</div>
                        <div className="text-xs text-gray-400">{comment.time}</div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  </div>
                ))}
              
              {comments.filter(comment => comment.task_id === selectedTaskId).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Aucun commentaire pour cette tâche</p>
                  <p className="text-xs text-gray-400 mt-1">Soyez le premier à commenter</p>
                </div>
              )}
            </div>
            
            {/* Formulaire d'ajout de commentaire */}
            {!isReadOnlyMode && (
              <div className="border-t pt-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        ref={commentInputRef}
                        value={newComment}
                        onChange={handleCommentChange}
                        placeholder="Écrivez votre commentaire... Tapez @ pour mentionner"
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      
                      {/* Suggestions de mentions */}
                      {showMentionSuggestions && (
                        <div className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                          {users
                            .filter(user => 
                              user.name && user.name.toLowerCase().includes(mentionSearch.toLowerCase())
                            )
                            .map(user => (
                              <div 
                                key={user.id}
                                onClick={() => insertMention(user)}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                              >
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 text-xs font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm">{user.name}</span>
                              </div>
                            ))}
                          {users.filter(user => 
                            user.name && user.name.toLowerCase().includes(mentionSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Aucun utilisateur trouvé
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={addComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Message en mode lecture seule */}
            {isReadOnlyMode && (
              <div className="border-t pt-4">
                <div className="text-center py-4 text-gray-500">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg">
                    <div className="w-4 h-4 bg-amber-600 rounded-full"></div>
                    <span className="text-sm">Vous ne pouvez pas commenter ce DAO (vous n'êtes pas le chef)</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modal commentaire global */}
      {showCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Header modal */}
            <div className="border-b p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold">Ajouter un commentaire</h3>
                  <p className="text-sm text-gray-500">Partagez vos pensées avec l'équipe</p>
                </div>
              </div>
              <button onClick={() => setShowCommentModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu modal */}
            <div className="p-6">
              <textarea
                ref={commentInputRef}
                value={globalComment}
                onChange={handleCommentChange}
                placeholder="Écrivez votre commentaire ici... Tapez @ pour mentionner quelqu'un"
                className="w-full p-3 border rounded-lg resize-none"
                rows={4}
              />
              
              {/* Suggestions de mentions */}
              {showMentionSuggestions && (
                <div className="absolute z-20 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {users.filter(u => 
                    u.name.toLowerCase().includes(mentionSearch.toLowerCase()) && 
                    u.id !== currentUser?.id
                  ).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => insertMention(user)}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">Membre de l'équipe</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowCommentModal(false)}>
                  Annuler
                </button>
                <button onClick={addGlobalComment} disabled={!globalComment.trim()}>
                  <Send size={16} /> Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
