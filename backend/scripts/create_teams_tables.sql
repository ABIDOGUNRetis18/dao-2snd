-- Script de création des tables teams et team_members
-- Pour correspondre à la documentation de gestion des équipes

-- Table des équipes
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(100) PRIMARY KEY,        -- UUID unique
  team_code VARCHAR(100) UNIQUE,      -- TEAM-timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison équipe-membres
CREATE TABLE IF NOT EXISTS team_members (
  team_id VARCHAR(100),
  user_id BIGINT UNSIGNED,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by BIGINT UNSIGNED,
  PRIMARY KEY (team_id, user_id),      -- Composite key
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Ajouter team_id à la table daos si ce n'est pas déjà fait
ALTER TABLE daos 
ADD COLUMN IF NOT EXISTS team_id VARCHAR(100) 
REFERENCES teams(id) ON DELETE SET NULL;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_daos_team_id ON daos(team_id);

-- Fonction pour créer une équipe automatiquement
CREATE OR REPLACE FUNCTION create_team_for_dao()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer un ID d'équipe unique et un code
  NEW.team_id = gen_random_uuid()::VARCHAR;
  
  -- Insérer dans la table teams
  INSERT INTO teams (id, team_code) 
  VALUES (NEW.team_id, 'TEAM-' || EXTRACT(EPOCH FROM NOW())::BIGINT);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement une équipe lors de la création d'un DAO
DROP TRIGGER IF EXISTS trigger_create_team_for_dao ON daos;
CREATE TRIGGER trigger_create_team_for_dao
BEFORE INSERT ON daos
FOR EACH ROW
WHEN (NEW.team_id IS NULL)
EXECUTE FUNCTION create_team_for_dao();

-- Fonction pour ajouter un membre à une équipe
CREATE OR REPLACE FUNCTION add_team_member(team_id_param VARCHAR(100), user_id_param BIGINT, assigned_by_param BIGINT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, assigned_by)
  VALUES (team_id_param, user_id_param, assigned_by_param)
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les membres d'une équipe
CREATE OR REPLACE FUNCTION get_team_members(team_id_param VARCHAR(100))
RETURNS TABLE(
  user_id BIGINT,
  username VARCHAR,
  email VARCHAR,
  role_id INTEGER,
  assigned_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.email,
    u.role_id,
    tm.assigned_at
  FROM team_members tm
  JOIN users u ON tm.user_id = u.id
  WHERE tm.team_id = team_id_param
  ORDER BY tm.assigned_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Tables teams et team_members créées avec succès';
  RAISE NOTICE 'Trigger create_team_for_dao installé';
  RAISE NOTICE 'Fonctions d''équipe créées';
END $$;
