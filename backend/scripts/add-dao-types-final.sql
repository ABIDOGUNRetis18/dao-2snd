-- Script SQL final pour ajouter les types de DAO
-- Utilise uniquement les colonnes existantes de la table dao_types
-- À exécuter avec: psql -h localhost -p 5432 -U erwann -d dao -f scripts/add-dao-types-final.sql

-- Insérer les types de DAO avec ON CONFLICT pour éviter les doublons
INSERT INTO dao_types (code, libelle, description) 
VALUES 
    ('AAO', 'Appel d''offres ouvert', 'Procédure de passation ouverte à tous les candidats')
ON CONFLICT (code) DO UPDATE SET 
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description;

INSERT INTO dao_types (code, libelle, description) 
VALUES 
    ('AMI', 'Appel à manifestation d''intérêt', 'Consultation préalable pour évaluer l''intérêt du marché')
ON CONFLICT (code) DO UPDATE SET 
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description;

INSERT INTO dao_types (code, libelle, description) 
VALUES 
    ('DC', 'Demande de concurrence', 'Procédure simplifiée pour les marchés de faible montant')
ON CONFLICT (code) DO UPDATE SET 
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description;

INSERT INTO dao_types (code, libelle, description) 
VALUES 
    ('DP', 'Dialogue compétitif', 'Procédure complexe avec dialogue entre acheteur et candidats')
ON CONFLICT (code) DO UPDATE SET 
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description;

-- Afficher les types de DAO après insertion
SELECT 
    id,
    code,
    libelle,
    description,
    created_at
FROM dao_types 
ORDER BY code;
