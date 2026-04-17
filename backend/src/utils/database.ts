import { Pool, PoolClient } from 'pg';

// Configuration de la base de données
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dao',
  user: process.env.DB_USER || 'erwann',
  password: process.env.DB_PASSWORD || 'erwann',
  max: 20, // Maximum nombre de connexions dans le pool
  idleTimeoutMillis: 30000, // Temps avant qu'une connexion inactive soit fermée
  connectionTimeoutMillis: 2000, // Temps d'attente pour obtenir une connexion
};

console.log('Configuration DB:', {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  password: poolConfig.password ? '***' : 'EMPTY'
});

// Créer le pool de connexions
const pool = new Pool(poolConfig);

// Gestion des erreurs du pool
pool.on('error', (err) => {
  console.error('Erreur inattendue sur le pool de connexions PostgreSQL:', err);
});

export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    // S'assurer que le mot de passe est une chaîne vide et non undefined
    if (poolConfig.password === undefined) {
      poolConfig.password = '';
    }
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query exécutée', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la query:', error);
    throw error;
  }
};

export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

export async function initializeDatabase() {
  try {
    // Test de connexion
    const client = await getClient();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Connexion à PostgreSQL réussie');

    // Création des tables si elles n'existent pas
    await createTables();
    console.log('Tables initialisées avec succès');

    // Création des tables de tâches (nouveau système à deux niveaux)
    await createTaskModelsTable();
    await createTasksTable();
    console.log('Tables de tâches créées avec succès');

    // Création des utilisateurs par défaut
    await createDefaultUsers();
    console.log('Utilisateurs par défaut créés');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

async function createTables() {
  // La base de données existe déjà avec votre structure
  // On ne crée que les tables manquantes si nécessaire
  console.log('📋 Utilisation de la base de données existante');
  
  // Créer la table des tâches si elle n'existe pas
  await createTasksTable();
  console.log('✅ Tables initialisées avec succès');
}

async function createDefaultUsers() {
  const bcrypt = require('bcryptjs');
  
  // Vérifier si l'utilisateur admin existe déjà
  const existingAdmin = await query(
    'SELECT id FROM users WHERE username = $1',
    ['admin']
  );

  if (existingAdmin.rowCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Adapter à votre structure de table (sans full_name, avec role_id)
    await query(`
      INSERT INTO users (username, email, password, role_id)
      VALUES ($1, $2, $3, $4)
    `, [
      'admin',
      'admin@dao.com',
      hashedPassword,
      2 // role_id pour Administrateur (d'après votre schéma)
    ]);
    
    console.log('✅ Utilisateur admin créé');
  } else {
    console.log('ℹ️ Utilisateur admin existe déjà');
  }
}

export async function createTaskModelsTable() {
  try {
    // Vérifier si la table task (modèles) existe déjà
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'task'
      )
    `);

    if (result.rows[0].exists) {
      console.log('Table task (modèles) existe déjà');
      return;
    }

    // Créer la table task (modèles de tâches)
    await query(`
      CREATE TABLE task (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insérer les 15 tâches spécifiques selon la documentation
    await query(`
      INSERT INTO task (id, nom) VALUES 
      (1, 'Résumé sommaire DAO et Création du drive'),
      (2, 'Demande de caution et garanties'),
      (3, 'Identification et renseignement des profils dans le drive'),
      (4, 'Identification et renseignement des ABE dans le drive'),
      (5, 'Légalisation des ABE, diplômes, certificats, attestations et pièces administratives'),
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
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('Table task (modèles) créée avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de la table task (modèles):', error);
    throw error;
  }
}

export async function createTasksTable() {
  try {
    // Vérifier si la table tasks (instances) existe déjà
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      )
    `);

    if (result.rows[0].exists) {
      console.log('Table tasks (instances) existe déjà');
      return;
    }

    // Créer la table tasks (instances concrètes) avec contraintes d'isolation
    await query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        dao_id INTEGER NOT NULL REFERENCES daos(id) ON DELETE CASCADE,
        id_task INTEGER REFERENCES task(id),  -- Lien vers le modèle
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        statut VARCHAR(20) NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire', 'en_cours', 'termine')),
        priorite VARCHAR(10) NOT NULL DEFAULT 'moyenne' CHECK (priorite IN ('basse', 'moyenne', 'haute')),
        date_echeance DATE,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        date_creation DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Contraintes d'isolation
        CONSTRAINT tasks_dao_id_not_null CHECK (dao_id IS NOT NULL),
        CONSTRAINT tasks_dao_id_positive CHECK (dao_id > 0)
      )
    `);

    // Index pour optimiser les performances et garantir l'isolation
    await query(`
      CREATE INDEX idx_tasks_dao_id ON tasks(dao_id)
    `);
    
    await query(`
      CREATE INDEX idx_tasks_dao_id_assigned_to ON tasks(dao_id, assigned_to)
    `);

    console.log('Table tasks (instances) créée avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de la table tasks (instances):', error);
    throw error;
  }
}

// Fermer proprement le pool lors de l'arrêt du serveur
process.on('SIGINT', async () => {
  console.log('Fermeture du pool de connexions PostgreSQL...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Fermeture du pool de connexions PostgreSQL...');
  await pool.end();
  process.exit(0);
});
