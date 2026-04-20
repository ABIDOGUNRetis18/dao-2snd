// Utils pour la gestion des statuts selon les rôles

export interface StatusDisplay {
  label: string;
  className?: string;
  color?: string;
  bgColor?: string;
}

export interface DAO {
  id: number;
  numero: string;
  objet: string;
  statut: string;
  date_depot?: string;
  created_at?: string;
  chef_id?: number;
  chef_projet_nom?: string;
}

// Logique ADMIN - Vision complète avec logique date
export const computeAdminStatus = (dao: DAO): StatusDisplay => {
  const today = new Date();
  const rawStatut = String(dao.statut || "").toUpperCase();

  // 1) Si TERMINEE -> vert
  if (rawStatut === "TERMINEE" || rawStatut === "TERMINE") {
    return { label: "Terminée", className: "bg-green-100 text-green-800" };
  }

  // 2) Si pas de date dépôt -> En cours par défaut
  if (!dao.date_depot) {
    return { label: "En cours", className: "bg-yellow-100 text-yellow-800" };
  }

  // 3) Logique basée sur date de dépôt
  const dateDepot = new Date(dao.date_depot);
  const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= 5) {
    return { label: "EN COURS", className: "bg-yellow-100 text-yellow-800" };
  }
  
  if (diffDays <= 3) {
    return { label: "À risque", className: "bg-red-100 text-red-800" };
  }

  return { label: "En cours", className: "bg-yellow-100 text-yellow-800" };
};

// Logique CHEF DE PROJET - Vision simplifiée
export const computeChefStatus = (dao: DAO): StatusDisplay => {
  const rawStatut = String(dao.statut || "").toLowerCase();

  // Si terminé -> vert
  if (rawStatut === "termine" || rawStatut === "terminée") {
    return { label: "Terminée", className: "badge bg-success text-white" };
  }

  // Si à risque -> rouge
  if (rawStatut === "arisque" || rawStatut === "à risque") {
    return { label: "À risque", className: "badge bg-danger text-white" };
  }

  // Sinon, en cours -> jaune
  return { label: "En cours", className: "badge bg-warning text-dark" };
};

// Logique DIRECTEUR GÉNÉRAL - Vision stratégique
export const computeDGStatus = (dao: DAO): StatusDisplay => {
  const statut = String(dao.statut || "").toUpperCase();
  
  if (statut === "TERMINEE" || statut === "TERMINE") {
    return { label: "Terminée", color: "#22c55e", bgColor: "#f0fdf4" };
  }
  
  if (!dao.date_depot) {
    return { label: "En cours", color: "#eab308", bgColor: "#fefce8" };
  }
  
  const dateDepot = new Date(dao.date_depot);
  const today = new Date();
  const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 3) {
    return { label: "À risque", color: "#ef4444", bgColor: "#fef2f2" };
  }
  
  return { label: "En cours", color: "#eab308", bgColor: "#fefce8" };
};

// Logique LECTEUR - Vision limitée
export const computeLecteurStatus = (dao: DAO): StatusDisplay => {
  const rawStatut = String(dao.statut || "").toUpperCase();

  // 1) Si terminé -> vert
  if (rawStatut === "TERMINEE" || rawStatut === "TERMINE") {
    return { label: "Terminée", className: "bg-green-100 text-green-800" };
  }

  // 2) Logique sur date de dépôt
  if (!dao.date_depot) {
    return { label: "En cours", className: "bg-yellow-100 text-yellow-800" };
  }

  const dateDepot = new Date(dao.date_depot);
  const today = new Date();
  const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= 5 || diffDays === 4) {
    return { label: "EN COURS", className: "bg-yellow-100 text-yellow-800" };
  }

  if (diffDays <= 3) {
    return { label: "À risque", className: "bg-red-100 text-red-800" };
  }

  return { label: "En cours", className: "bg-yellow-100 text-yellow-800" };
};

// Fonction générique pour déterminer la logique selon le rôle
export const computeStatusByRole = (dao: DAO, userRole: string): StatusDisplay => {
  switch (userRole.toLowerCase()) {
    case 'admin':
    case 'administrateur':
      return computeAdminStatus(dao);
    
    case 'chef':
    case 'chef de projet':
      return computeChefStatus(dao);
    
    case 'dg':
    case 'directeur général':
    case 'directeur_general':
      return computeDGStatus(dao);
    
    case 'lecteur':
      return computeLecteurStatus(dao);
    
    default:
      // Par défaut, utiliser la logique admin
      return computeAdminStatus(dao);
  }
};
