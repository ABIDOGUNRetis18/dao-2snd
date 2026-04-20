-- Initialisation PostgreSQL pour DAO 2SND

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (id, name) VALUES
  (1, 'super_admin'),
  (2, 'admin'),
  (3, 'chef_projet'),
  (4, 'membre_equipe'),
  (5, 'lecteur')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  url_photo TEXT,
  role_id INTEGER NOT NULL DEFAULT 2 REFERENCES roles(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(120) PRIMARY KEY,
  team_code VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id VARCHAR(120) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS dao_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO dao_types (code, libelle, description) VALUES
  ('AAO', 'Appel d''offres ouvert', 'Procédure de passation ouverte à tous les candidats'),
  ('AMI', 'Appel à manifestation d''intérêt', 'Consultation préalable pour évaluer l''intérêt du marché'),
  ('DC', 'Demande de concurrence', 'Procédure simplifiée pour les marchés de faible montant'),
  ('DP', 'Dialogue compétitif', 'Procédure complexe avec dialogue entre acheteur et candidats')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS dao_sequences (
  year INTEGER PRIMARY KEY,
  seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daos (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  date_depot DATE,
  objet TEXT NOT NULL,
  description TEXT,
  reference VARCHAR(255),
  autorite VARCHAR(255),
  statut VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
  chef_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  chef_projet_nom VARCHAR(255),
  team_id VARCHAR(120) REFERENCES teams(id) ON DELETE SET NULL,
  groupement VARCHAR(10),
  nom_partenaire VARCHAR(255),
  type_dao VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dao_members (
  id SERIAL PRIMARY KEY,
  dao_id INTEGER NOT NULL REFERENCES daos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (dao_id, user_id)
);

-- Cette table est utilisée à la fois comme catalogue de tâches modèles
-- (lignes avec dao_id NULL) et comme tâches liées à un DAO (dao_id non NULL)
CREATE TABLE IF NOT EXISTS task (
  id SERIAL PRIMARY KEY,
  dao_id INTEGER REFERENCES daos(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  statut VARCHAR(30) DEFAULT 'a_faire',
  progress INTEGER DEFAULT 0,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table d'instances de tâches détaillées
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  dao_id INTEGER NOT NULL REFERENCES daos(id) ON DELETE CASCADE,
  id_task INTEGER REFERENCES task(id),
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  statut VARCHAR(30) DEFAULT 'a_faire',
  priorite VARCHAR(20) DEFAULT 'moyenne',
  date_echeance DATE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  progress INTEGER DEFAULT 0,
  date_creation DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES task(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentioned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  mentioned_user_name VARCHAR(100),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_dao_id ON task(dao_id);
CREATE INDEX IF NOT EXISTS idx_task_assigned_to ON task(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_dao_id ON tasks(dao_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dao_id_assigned_to ON tasks(dao_id, assigned_to);

-- Insérer les 15 tâches modèles uniquement si absentes
INSERT INTO task (id, dao_id, nom, statut, progress)
SELECT x.id, NULL, x.nom, 'a_faire', 0
FROM (
  VALUES
    (1, 'Résumé sommaire DAO et Création du drive'),
    (2, 'Demande de caution et garanties'),
    (3, 'Identification et renseignement des profils dans le drive'),
    (4, 'Identification et renseignement des ABE dans le drive'),
    (5, 'Légalisation des ABE, diplômes, certificats, attestations et pièces administratives requis'),
    (6, 'Indication directive d''élaboration de l''offre financier'),
    (7, 'Elaboration de la méthodologie'),
    (8, 'Planification prévisionnelle'),
    (9, 'Identification des références précises des équipements et matériels'),
    (10, 'Demande de cotation'),
    (11, 'Elaboration du squelette des offres'),
    (12, 'Rédaction du contenu des OF et OT'),
    (13, 'Contrôle et validation des offres'),
    (14, 'Impression et présentation des offres'),
    (15, 'Dépôt des offres et clôture')
) AS x(id, nom)
WHERE NOT EXISTS (
  SELECT 1 FROM task t WHERE t.id = x.id
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_teams_updated_at ON teams;
CREATE TRIGGER trg_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_daos_updated_at ON daos;
CREATE TRIGGER trg_daos_updated_at
BEFORE UPDATE ON daos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_task_updated_at ON task;
CREATE TRIGGER trg_task_updated_at
BEFORE UPDATE ON task
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON notifications;
CREATE TRIGGER trg_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_messages_updated_at ON messages;
CREATE TRIGGER trg_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dao_types_updated_at ON dao_types;
CREATE TRIGGER trg_dao_types_updated_at
BEFORE UPDATE ON dao_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
