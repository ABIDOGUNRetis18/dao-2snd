-- Création de la table de liaison pour les membres d'équipe des DAO
CREATE TABLE IF NOT EXISTS dao_members (
    id SERIAL PRIMARY KEY,
    dao_id INTEGER NOT NULL REFERENCES daos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    UNIQUE(dao_id, user_id) -- Éviter les doublons
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_dao_members_dao_id ON dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user_id ON dao_members(user_id);

-- Fonction pour récupérer les membres d'un DAO
CREATE OR REPLACE FUNCTION get_dao_members(dao_id_param INTEGER)
RETURNS TABLE(
    user_id INTEGER,
    username VARCHAR,
    email VARCHAR,
    role_id INTEGER,
    role_name VARCHAR,
    assigned_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.email,
        u.role_id,
        CASE u.role_id
            WHEN 1 THEN 'Directeur'
            WHEN 2 THEN 'Admin'
            WHEN 3 THEN 'ChefProjet'
            WHEN 4 THEN 'MembreEquipe'
            WHEN 5 THEN 'Lecteur'
            ELSE 'Utilisateur'
        END as role_name,
        dm.assigned_at
    FROM dao_members dm
    JOIN users u ON dm.user_id = u.id
    WHERE dm.dao_id = dao_id_param
    ORDER BY dm.assigned_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter un membre à un DAO
CREATE OR REPLACE FUNCTION add_dao_member(dao_id_param INTEGER, user_id_param INTEGER, assigned_by_param INTEGER DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO dao_members (dao_id, user_id, assigned_by)
    VALUES (dao_id_param, user_id_param, assigned_by_param)
    ON CONFLICT (dao_id, user_id) DO NOTHING;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer un membre d'un DAO
CREATE OR REPLACE FUNCTION remove_dao_member(dao_id_param INTEGER, user_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM dao_members 
    WHERE dao_id = dao_id_param AND user_id = user_id_param;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les DAO d'un utilisateur (membre d'équipe)
CREATE OR REPLACE FUNCTION get_user_dao_memberships(user_id_param INTEGER)
RETURNS TABLE(
    dao_id INTEGER,
    dao_numero VARCHAR,
    dao_objet VARCHAR,
    assigned_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.numero,
        d.objet,
        dm.assigned_at
    FROM dao_members dm
    JOIN daos d ON dm.dao_id = d.id
    WHERE dm.user_id = user_id_param
    ORDER BY dm.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;
