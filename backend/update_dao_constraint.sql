-- Script pour mettre à jour la contrainte daos_statut_check
-- Permet d'utiliser les nouveaux statuts de DAO

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE daos DROP CONSTRAINT IF EXISTS daos_statut_check;

-- 2. Ajouter la nouvelle contrainte avec les bons statuts
ALTER TABLE daos 
ADD CONSTRAINT daos_statut_check 
CHECK (statut IN ('EN_ATTENTE', 'EN_COURS', 'A_RISQUE', 'TERMINEE', 'ARCHIVE', 'actif', 'inactif'));

-- 3. Mettre à jour les DAOs avec les anciens statuts vers les nouveaux
UPDATE daos SET statut = 'EN_COURS' WHERE statut = 'actif';
UPDATE daos SET statut = 'ARCHIVE' WHERE statut = 'archive';
UPDATE daos SET statut = 'EN_ATTENTE' WHERE statut = 'inactif';

-- 4. Vérifier la mise à jour
SELECT statut, COUNT(*) as count 
FROM daos 
GROUP BY statut 
ORDER BY count DESC;

-- 5. Appliquer la nouvelle logique à tous les DAOs
-- (Ceci sera fait par l'endpoint /api/dao/admin/update-dao-status)
