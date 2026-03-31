"use client";

import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CreateDAO() {
  const [generatedNumber, setGeneratedNumber] = useState("");
  const [dateDepot, setDateDepot] = useState("");
  const [objet, setObjet] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [autorite, setAutorite] = useState("");
  const [chefEquipe, setChefEquipe] = useState("");
  const [membres, setMembres] = useState<string[]>([]);
  const [users, setUsers] = useState<
    Array<{ id: number; username: string; role: string }>
  >([]);
  const [teamLeaders, setTeamLeaders] = useState<
    Array<{ id: number; username: string; role: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [membresOpen, setMembresOpen] = useState(false);
  const membresRef = useRef<HTMLDivElement | null>(null);
  const membresButtonRef = useRef<HTMLButtonElement | null>(null);
  const [membresFlipUp, setMembresFlipUp] = useState(false);
  const [groupement, setGroupement] = useState<string>("");
  const [nomPartenaire, setNomPartenaire] = useState("");
  const [typeDao, setTypeDao] = useState<string>("");
  const [typeDaoOptions, setTypeDaoOptions] = useState<Array<{ value: string; label: string; description: string }>>([]);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeCode, setNewTypeCode] = useState("");
  const [typesExpanded, setTypesExpanded] = useState(true);
  const groupementOptions = [
    { value: "oui", label: "Oui", description: "DAO avec groupement d'entreprises" },
    { value: "non", label: "Non", description: "DAO sans groupement" }
  ];

  useEffect(() => {
    // Charger les types de DAO depuis l'API
    loadDaoTypes();
    
    // Récupérer le prochain numéro DAO depuis la base de données
    (async () => {
      try {
        console.log("=== DÉBOGAGE NUMÉRO DAO - DÉBUT ===");
        console.log("AVANT appel API - generatedNumber:", generatedNumber);
        
        const res = await fetch("/api/dao/next-number");
        console.log("Status API:", res.status);
        
        if (!res.ok) {
          console.error("Erreur lors de la récupération du prochain numéro DAO:", await res.text());
          // En cas d'erreur, utiliser un format par défaut
          const year = new Date().getFullYear();
          const num = `DAO-${year}-001`;
          console.log("API erreur - Utilisation par défaut:", num);
          setGeneratedNumber(num);
          return;
        }
        
        const data = await res.json();
        console.log("Réponse API complète:", JSON.stringify(data, null, 2));
        
        if (data.success && data.numero) {
          console.log("Prochain numéro DAO récupéré:", data.numero);
          console.log("AVANT setGeneratedNumber - generatedNumber:", generatedNumber);
          setGeneratedNumber(data.numero);
          console.log("APRÈS setGeneratedNumber - generatedNumber:", generatedNumber);
        } else {
          // Si pas de numéro retourné, utiliser un format par défaut
          const year = new Date().getFullYear();
          const num = `DAO-${year}-001`;
          console.log("API sans numéro - Utilisation par défaut:", num);
          setGeneratedNumber(num);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du numéro DAO:", error);
        // En cas d'erreur, utiliser un format par défaut
        const year = new Date().getFullYear();
        const num = `DAO-${year}-001`;
        console.log("Exception - Utilisation par défaut:", num);
        setGeneratedNumber(num);
      }
      
      console.log("=== DÉBOGAGE NUMÉRO DAO - FIN ===");
    })();

    // Charger utilisateurs (endpoint existant attendu : /api/users)
    (async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) {
          console.error("Erreur lors de la récupération des utilisateurs:", await res.text());
          return;
        }
        const data = await res.json();
        console.log("Données brutes de l'API:", JSON.stringify(data, null, 2));
        
        // Vérifier la structure des données
        const usersData = Array.isArray(data) ? data : (data.data || []);
        console.log("Liste des utilisateurs (après extraction):", JSON.stringify(usersData, null, 2));
        
        // Afficher les clés du premier utilisateur (si disponible)
        if (usersData.length > 0) {
          console.log("Clés du premier utilisateur:", Object.keys(usersData[0]));
          console.log("Valeurs du premier utilisateur:", JSON.stringify(usersData[0], null, 2));
          
          // Afficher les rôles disponibles
          const roles = [...new Set(usersData.map((u: any) => ({
            role_id: u.role_id,
            roleName: u.roleName,
            role: u.role                                                  
          })))];
          console.log("Rôles trouvés dans les données:", JSON.stringify(roles, null, 2));
        }
        
        // Fonction pour obtenir le nom du rôle en fonction de l'ID
        const getRoleName = (roleId: string | number): string => {
          const id = String(roleId);
          switch (id) {
            case '1': return 'Directeur';
            case '2': return 'Admin';
            case '3': return 'ChefProjet';
            case '4': return 'MembreEquipe';
            case '5': return 'Lecteur';
            default: return 'Utilisateur';
          }
        };

        console.log("=== DÉBOGAGE UTILISATEURS - DÉBUT ===");
        console.log("Nombre total d'utilisateurs:", usersData.length);
        
        // Vérifier spécifiquement l'utilisateur 41
        const user41 = usersData.find((u: any) => u.id === 41);
        console.log("Utilisateur 41 trouvé:", user41);
        if (user41) {
          console.log("Détails utilisateur 41:", {
            id: user41.id,
            username: user41.username,
            email: user41.email,
            role_id: user41.role_id,
            role: user41.role,
            roleName: user41.roleName
          });
        }
        
        // Afficher tous les utilisateurs avec leurs rôles
        console.log("Liste complète des utilisateurs:");
        usersData.forEach((u: any, index: number) => {
          console.log(`${index + 1}. ID: ${u.id}, Username: ${u.username}, Role ID: ${u.role_id}, Role: ${u.role}`);
        });
        
        const membersList = usersData
          .filter((u: any) => {
            const roleId = Number(u.role_id || u.role);
            // Exclure les rôles lecteur (5) et directeur (1)
            const isExcluded = roleId === 1 || roleId === 5;
            if (isExcluded) {
              console.log(`Utilisateur exclu: ${u.username} (ID: ${u.id}, Rôle: ${roleId} - ${getRoleName(roleId)})`);
            }
            return !isExcluded;
          })
          .map((u: any) => {
            const roleData = {
              id: u.id,
              username: u.username || u.email || `user-${u.id}`,
              role: u.roleName || getRoleName(u.role_id || u.role),
              role_id: u.role_id || u.role
            };
            
            // Log spécifique pour l'utilisateur 41
            if (u.id === 41) {
              console.log("=== TRANSFORMATION UTILISATEUR 41 ===");
              console.log("Données brutes:", u);
              console.log("roleName:", u.roleName);
              console.log("role_id:", u.role_id);
              console.log("role:", u.role);
              console.log("getRoleName result:", getRoleName(u.role_id || u.role));
              console.log("Données transformées:", roleData);
              console.log("=== FIN TRANSFORMATION UTILISATEUR 41 ===");
            }
            
            return roleData;
          });
        
        console.log("Liste des membres générée:", membersList);
        console.log("=== DÉBOGAGE UTILISATEURS - FIN ===");
        
        setUsers(membersList);
        
        // Log pour vérifier après setUsers
        setTimeout(() => {
          console.log("=== VÉRIFICATION APRÈS SETUSERS ===");
          console.log("State users actuel:", membersList.filter((u: any) => u.id === 41));
          console.log("=== FIN VÉRIFICATION SETUSERS ===");
        }, 100);

        // Pour les chefs d'équipe (rôles 2 ou 3)
        const teamLeadersList = usersData
          .filter((u: any) => {
            const roleId = Number(u.role_id || u.role);
            return roleId === 2 || roleId === 3;
          })
          .map((u: any) => ({
            id: u.id,
            username: u.username || u.email || `user-${u.id}`,
            role: getRoleName(u.role_id || u.role),
            role_id: u.role_id || u.role
          }));
        console.log("Chefs d'équipe:", teamLeadersList);
        setTeamLeaders(teamLeadersList);
      } catch (err) {
        console.error("Erreur lors du chargement des utilisateurs:", err);
        // En cas d'erreur on laisse la liste vide
      }
    })();
  }, []);

  async function loadDaoTypes() {
    try {
      console.log("Chargement des types de DAO...");
      const res = await fetch("/api/dao-types");
      if (!res.ok) {
        console.error("Erreur lors de la récupération des types de DAO:", await res.text());
        return;
      }
      const data = await res.json();
      console.log("Données reçues:", data);
      if (data.success && data.data) {
        const types = data.data.map((type: any) => ({
          value: type.code,
          label: type.libelle,
          description: type.description || ""
        }));
        console.log("Types transformés:", types);
        setTypeDaoOptions(types);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des types de DAO:", err);
    }
  }

  async function addNewType() {
    try {
      if (!newTypeCode) {
        setError("Le code du type est requis");
        return;
      }

      const res = await fetch("/api/dao-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: newTypeCode.toUpperCase(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || "Erreur lors de la création du type");
        return;
      }

      // Réinitialiser le formulaire
      setNewTypeCode("");
      setShowAddTypeModal(false);
      setError(null);

      // Recharger les types
      await loadDaoTypes();
      
      // Sélectionner automatiquement le nouveau type
      setTypeDao(newTypeCode.toUpperCase());
      
      alert("Type de DAO créé avec succès");
    } catch (err) {
      console.error("Error creating DAO type:", err);
      setError("Erreur réseau lors de la création du type");
    }
  }

  const toggleMembre = (id: number) => {
    console.log("=== TOGGLE MEMBRE ===");
    console.log("ID cliqué:", id);
    console.log("membres avant:", membres);
    console.log("membres.includes(String(id)):", membres.includes(String(id)));
    
    const s = membres.includes(String(id))
      ? membres.filter((m) => m !== String(id))
      : [...membres, String(id)];
    
    console.log("membres après:", s);
    console.log("=== FIN TOGGLE MEMBRE ===");
    setMembres(s);
  };

  // Fermer la liste des membres si clic à l'extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        membresRef.current &&
        !membresRef.current.contains(e.target as Node)
      ) {
        setMembresOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lors de l'ouverture, déterminer si on doit 'flip' le dropdown vers le haut
  const openMembres = () => {
    if (!membresButtonRef.current) {
      setMembresOpen((v) => !v);
      return;
    }
    const rect = membresButtonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuEstimatedHeight = 260; // correspond à maxHeight + padding
    // Si pas assez d'espace en bas mais assez en haut => ouvrir vers le haut
    if (spaceBelow < menuEstimatedHeight && spaceAbove > menuEstimatedHeight) {
      setMembresFlipUp(true);
    } else {
      setMembresFlipUp(false);
    }
    setMembresOpen((v) => !v);
  };

  const validate = () => {
    console.log("=== DÉBUT VALIDATION ===");
    console.log("dateDepot:", dateDepot);
    console.log("typeDao:", typeDao);
    console.log("objet:", objet);
    console.log("description:", description);
    console.log("reference:", reference);
    console.log("autorite:", autorite);
    console.log("chefEquipe:", chefEquipe);
    console.log("membres:", membres);
    console.log("membres.length:", membres.length);
    console.log("groupement:", groupement);
    console.log("nomPartenaire:", nomPartenaire);
    console.log("=== FIN VALIDATION ===");
    
    if (!dateDepot) return "La date de dépôt est requise.";
    if (!typeDao) return "Le type de DAO est requis.";
    if (!objet) return "L'objet est requis.";
    if (description.trim().length < 5)
      return "La description doit contenir au moins 5 caractères.";
    if (!reference) return "La référence est requise.";
    if (!autorite) return "L'autorité contractante est requise.";
    if (!chefEquipe) return "Le chef d'équipe doit être assigné.";
    if (membres.length === 0)
      return "Au moins un membre d'équipe doit être sélectionné.";
    
    // Validation dynamique du groupement
    if (groupement === "oui" && !nomPartenaire.trim()) {
      return "Le nom de l'entreprise partenaire est requis lorsque le groupement est sélectionné.";
    }
    
    return null;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    // Exemple de payload (le numéro sera généré côté serveur)
    const payload = {
      date_depot: dateDepot,
      typeDao,
      objet,
      description,
      reference,
      autorite,
      chefEquipe,
      membres,
      groupement,
      nomPartenaire: groupement === "oui" ? nomPartenaire : null,
    };

    console.log("=== PAYLOAD ENVOYÉ ===");
    console.log("Payload complet:", JSON.stringify(payload, null, 2));
    console.log("membres dans payload:", membres);
    console.log("membres.length dans payload:", membres.length);
    console.log("=== FIN PAYLOAD ===");

    try {
      const res = await fetch("/api/dao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || "Erreur lors de la création du DAO");
        return;
      }

      const data = await res.json();
      alert("DAO créé avec succès : " + data.numero);
      // Rediriger vers la liste des DAO
      window.location.href = "/dash/admin";
    } catch (err) {
      console.error("Error creating DAO:", err);
      setError("Erreur réseau lors de la création du DAO");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Créer un nouveau DAO</h1>
            <p className="text-slate-500 text-sm">Saisissez les informations du nouveau dossier d'appel d'offres</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="space-y-6">
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Numéro de liste (automatique)
            </label>
            <input
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700"
              value={generatedNumber}
              readOnly
            />
            <p className="text-xs text-slate-500 mt-1">
              Numéro généré automatiquement depuis la base de données
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type de DAO *</label>
            
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                onClick={() => setTypesExpanded(!typesExpanded)}
                title={typesExpanded ? "Replier les types" : "Déplier les types"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typesExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
              <span className="text-slate-500 text-sm">Types disponibles</span>
              <button
                type="button"
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                onClick={() => setShowAddTypeModal(true)}
                title="Ajouter un nouveau type de DAO"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {typesExpanded && (
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                {typeDaoOptions.map((option) => (
                  <div key={option.value} className="mb-2 last:mb-0">
                    <label className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="typeDao"
                        value={option.value}
                        checked={typeDao === option.value}
                        onChange={() => setTypeDao(option.value)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-slate-500">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Type de groupement</label>
            
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              {groupementOptions.map((option) => (
                <div key={option.value} className="mb-2 last:mb-0">
                  <label className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="groupement"
                      value={option.value}
                      checked={groupement === option.value}
                      onChange={() => {
                        setGroupement(option.value);
                        if (option.value === "non") {
                          setNomPartenaire("");
                        }
                      }}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        {option.label}
                      </div>
                      <div className="text-sm text-slate-500">
                        {option.description}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Chef Projet *</label>
            <select
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              value={chefEquipe}
              onChange={(e) => setChefEquipe(e.target.value)}
              required
            >
              <option value="">Sélectionnez un chef Projet</option>
              {teamLeaders.length > 0 ? (
                teamLeaders.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))
              ) : (
                <option disabled>Aucun chef d'équipe disponible</option>
              )}
            </select>
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

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <Link
              to="/admin"
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Créer le DAO
            </button>
          </div>
        </div>
      </form>

      {/* Modal pour ajouter un nouveau type de DAO */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Ajouter un nouveau type de DAO</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setShowAddTypeModal(false);
                  setNewTypeCode("");
                  setError(null);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Code du type de DAO *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newTypeCode}
                  onChange={(e) => setNewTypeCode(e.target.value)}
                  placeholder="Ex: NOUVEAU"
                  maxLength={20}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Lettres majuscules et chiffres uniquement
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200">
              <button
                type="button"
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
                onClick={() => {
                  setShowAddTypeModal(false);
                  setNewTypeCode("");
                  setError(null);
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                onClick={addNewType}
              >
                Créer le type
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}