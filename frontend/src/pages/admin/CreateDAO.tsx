"use client";

import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Animation CSS pour le fadeIn
const fadeInStyle = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in;
  }
`;

export default function CreateDAO() {
  // Injecter l'animation CSS
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = fadeInStyle;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

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
  const [chefOpen, setChefOpen] = useState(false);
  const [typeDaoOpen, setTypeDaoOpen] = useState(false);
  const membresRef = useRef<HTMLDivElement | null>(null);
  const membresButtonRef = useRef<HTMLButtonElement | null>(null);
  const chefRef = useRef<HTMLDivElement | null>(null);
  const chefButtonRef = useRef<HTMLButtonElement | null>(null);
  const typeDaoRef = useRef<HTMLDivElement | null>(null);
  const typeDaoButtonRef = useRef<HTMLButtonElement | null>(null);
  const [membresFlipUp, setMembresFlipUp] = useState(false);
  const [chefFlipUp, setChefFlipUp] = useState(false);
  const [typeDaoFlipUp, setTypeDaoFlipUp] = useState(false);
  const [groupement, setGroupement] = useState<string>("");
  const [nomPartenaire, setNomPartenaire] = useState("");
  const [typeDao, setTypeDao] = useState<string>("");
  const [typeDaoOptions, setTypeDaoOptions] = useState<Array<{ value: string; label: string; description: string }>>([]);
  const groupementOptions = [
    { value: "oui", label: "Oui", description: "DAO avec groupement d'entreprises" },
    { value: "non", label: "Non", description: "DAO sans groupement" }
  ];

  async function loadDaoTypes() {
    try {
      console.log("=== CHARGEMENT TYPES DAO - NOUVELLE API ===");
      
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:3001/api/dao/types", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        console.error("Erreur lors du chargement des types de DAO:", await res.text());
        // Utiliser les données par défaut en cas d'erreur
        const testTypes = [
          { value: 'AAO', label: 'Appel d\'offres ouvert', description: 'Procédure de passation ouverte à tous les candidats' },
          { value: 'AMI', label: 'Appel à manifestation d\'intérêt', description: 'Consultation préalable pour évaluer l\'intérêt du marché' },
          { value: 'DC', label: 'Demande de concurrence', description: 'Procédure simplifiée pour les marchés de faible montant' },
          { value: 'DP', label: 'Dialogue compétitif', description: 'Procédure complexe avec dialogue entre acheteur et candidats' }
        ];
        setTypeDaoOptions(testTypes);
        return;
      }
      
      const data = await res.json();
      console.log("Données types DAO reçues:", data);
      
      // Gérer différentes structures de réponse possibles
      let typesArray = [];
      
      if (data.success && data.data && data.data.types && Array.isArray(data.data.types)) {
        typesArray = data.data.types;
      }
      // Si data est directement un tableau
      else if (Array.isArray(data)) {
        typesArray = data;
      }
      
      console.log("Types array après traitement:", typesArray);
      
      if (typesArray.length > 0) {
        const types = typesArray.map((type: any) => ({
          value: type.code || type.value,
          label: type.libelle || type.label,
          description: type.description || ""
        }));
        console.log("Types transformés:", types);
        setTypeDaoOptions(types);
      } else {
        // Utiliser les données par défaut si aucun type trouvé
        console.log("Aucun type trouvé, utilisation des données par défaut");
        const testTypes = [
          { value: 'AAO', label: 'Appel d\'offres ouvert', description: 'Procédure de passation ouverte à tous les candidats' },
          { value: 'AMI', label: 'Appel à manifestation d\'intérêt', description: 'Consultation préalable pour évaluer l\'intérêt du marché' },
          { value: 'DC', label: 'Demande de concurrence', description: 'Procédure simplifiée pour les marchés de faible montant' },
          { value: 'DP', label: 'Dialogue compétitif', description: 'Procédure complexe avec dialogue entre acheteur et candidats' }
        ];
        setTypeDaoOptions(testTypes);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des types de DAO:", err);
      // Utiliser les données de test en cas d'erreur
      const testTypes = [
        { value: 'AAO', label: 'Appel d\'offres ouvert', description: 'Procédure de passation ouverte à tous les candidats' },
        { value: 'AMI', label: 'Appel à manifestation d\'intérêt', description: 'Consultation préalable pour évaluer l\'intérêt du marché' },
        { value: 'DC', label: 'Demande de concurrence', description: 'Procédure simplifiée pour les marchés de faible montant' },
        { value: 'DP', label: 'Dialogue compétitif', description: 'Procédure complexe avec dialogue entre acheteur et candidats' }
      ];
      setTypeDaoOptions(testTypes);
    }
  }

  useEffect(() => {
    // Charger les types de DAO depuis la nouvelle API
    loadDaoTypes();
    
    // Charger toutes les données en parallèle
    const loadData = async () => {
      try {
        // Récupérer le prochain numéro DAO depuis la nouvelle API (prévisualisation)
        (async () => {
          try {
            console.log("=== DÉBOGAGE NUMÉRO DAO - DÉBUT ===");
            console.log("AVANT appel API - generatedNumber:", generatedNumber);
            
            const token = localStorage.getItem('token');
            const res = await fetch("http://localhost:3001/api/dao/next-number", {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log("Status API:", res.status);
            
            if (!res.ok) {
              console.error("Erreur lors de la récupération du prochain numéro DAO:", await res.text());
              // Fallback si erreur API
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
              // Fallback si pas de numéro retourné
              const year = new Date().getFullYear();
              const num = `DAO-${year}-001`;
              console.log("API sans numéro - Utilisation par défaut:", num);
              setGeneratedNumber(num);
            }
          } catch (error) {
            console.error("Erreur lors de la récupération du numéro DAO:", error);
            // Fallback en cas d'exception
            const year = new Date().getFullYear();
            const num = `DAO-${year}-001`;
            console.log("Exception - Utilisation par défaut:", num);
            setGeneratedNumber(num);
          }
          
          console.log("=== DÉBOGAGE NUMÉRO DAO - FIN ===");
        })();
        
        const [usersResponse] = await Promise.all([
          fetch("http://localhost:3001/api/users", {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);

        // Traiter la réponse des utilisateurs
        if (!usersResponse.ok) {
          console.error("Erreur lors de la récupération des utilisateurs:", await usersResponse.text());
          return;
        }
        
        const usersData = await usersResponse.json();
        console.log("Données brutes de l'API:", JSON.stringify(usersData, null, 2));
        
        // Vérifier la structure des données
        const usersArray = Array.isArray(usersData) ? usersData : (usersData.data?.users || usersData.users || []);
        console.log("Liste des utilisateurs (après extraction):", JSON.stringify(usersArray, null, 2));
        
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
        console.log("Nombre total d'utilisateurs:", usersArray.length);
        
        const membersList = usersArray
          .filter((u: any) => {
            const roleId = Number(u.role_id || u.role);
            return roleId !== 1 && roleId !== 5; // Exclure Directeur et Lecteur
          })
          .map((u: any) => ({
            id: Number(u.id),
            username: u.username || u.email || `user-${u.id}`,
            role: getRoleName(u.role_id || u.role),
            role_id: u.role_id || u.role
          }));

        const teamLeadersList = usersArray
          .filter((u: any) => {
            const roleId = Number(u.role_id || u.role);
            return roleId === 2 || roleId === 3; // Admin et ChefProjet
          })
          .map((u: any) => ({
            id: Number(u.id),
            username: u.username || u.email || `user-${u.id}`,
            role: getRoleName(u.role_id || u.role),
            role_id: u.role_id || u.role
          }));

        console.log("Membres:", membersList);
        console.log("Chefs d'équipe:", teamLeadersList);
        setUsers(membersList);
        setTeamLeaders(teamLeadersList);
        
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    loadData();
  }, []);

  const toggleMembre = (id: number) => {
    console.log("=== TOGGLE MEMBRE ===");
    console.log("ID cliqué:", id);
    console.log("membres avant:", membres);
    console.log("membres.includes(String(id)):", membres.includes(String(id)));
    
    const s = membres.includes(String(id))
      ? membres.filter((m) => m !== String(id))
      : [...membres, String(id)];
    
    console.log("membres après:", s);
    setMembres(s);
  };

  const toggleChef = (id: number) => {
    // Pour le chef de projet, on ne peut en sélectionner qu'un seul
    setChefEquipe(String(id));
    setChefOpen(false);
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
      if (
        chefRef.current &&
        !chefRef.current.contains(e.target as Node)
      ) {
        setChefOpen(false);
      }
      if (
        typeDaoRef.current &&
        !typeDaoRef.current.contains(e.target as Node)
      ) {
        setTypeDaoOpen(false);
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

  const openChef = () => {
    if (!chefButtonRef.current) {
      setChefOpen((v) => !v);
      return;
    }
    const rect = chefButtonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuEstimatedHeight = 260;
    if (spaceBelow < menuEstimatedHeight && spaceAbove > menuEstimatedHeight) {
      setChefFlipUp(true);
    } else {
      setChefFlipUp(false);
    }
    setChefOpen((v) => !v);
  };

  const openTypeDao = () => {
    if (!typeDaoButtonRef.current) {
      setTypeDaoOpen((v) => !v);
      return;
    }
    const rect = typeDaoButtonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuEstimatedHeight = 260;
    if (spaceBelow < menuEstimatedHeight && spaceAbove > menuEstimatedHeight) {
      setTypeDaoFlipUp(true);
    } else {
      setTypeDaoFlipUp(false);
    }
    setTypeDaoOpen((v) => !v);
  };

  const toggleTypeDao = (value: string) => {
    setTypeDao(value);
    setTypeDaoOpen(false);
  };

  const validate = () => {
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

    // Trouver le nom du chef de projet sélectionné
    const selectedChef = teamLeaders.find(leader => leader.id === Number(chefEquipe));
    const chefProjetNom = selectedChef ? selectedChef.username : '';

    // Validation des champs requis
    if (!reference.trim()) {
      setError("La référence est requise");
      return;
    }
    if (!objet.trim()) {
      setError("L'objet est requis");
      return;
    }
    if (!autorite.trim()) {
      setError("L'autorité est requise");
      return;
    }
    if (!chefEquipe) {
      setError("Le chef de projet est requis");
      return;
    }

    // Payload pour la nouvelle API (corrigé pour correspondre au backend)
    const payload = {
      reference: reference.trim(),
      objet: objet.trim(),
      description: description.trim(),
      autorite: autorite.trim(),
      chef_id: Number(chefEquipe),
      chef_projet_nom: chefProjetNom,
      date_depot: dateDepot,
      type_dao: typeDao,
      groupement: groupement,
      nom_partenaire: groupement === "oui" ? nomPartenaire : null,
      membres: membres,
    };

    console.log("=== PAYLOAD ENVOYÉ ===");
    console.log("Payload complet:", JSON.stringify(payload, null, 2));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:3001/api/dao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Erreur lors de la création du DAO");
        return;
      }

      const data = await response.json();
      alert("DAO créé avec succès : " + data.numero);
      // Rediriger vers la liste des DAO
      window.location.href = "/admin";
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
      </div>
    </div>
  )
}