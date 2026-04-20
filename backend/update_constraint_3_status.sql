-- Script pour simplifier à 3 statuts : EN_COURS, A_RISQUE, TERMINEE

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE daos DROP CONSTRAINT IF EXISTS daos_statut_check;

-- 2. Ajouter la nouvelle contrainte avec seulement 3 statuts
ALTER TABLE daos 
ADD CONSTRAINT daos_statut_check 
CHECK (statut IN ('EN_COURS', 'A_RISQUE', 'TERMINEE'));

-- 3. Mettre à jour tous les DAOs vers les 3 statuts
UPDATE daos SET statut = 'EN_COURS' WHERE statut NOT IN ('EN_COURS', 'A_RISQUE', 'TERMINEE');

-- 4. Vérifier la mise à jour
SELECT statut, COUNT(*) as count 
FROM daos 
GROUP BY statut 
ORDER BY count DESC;
