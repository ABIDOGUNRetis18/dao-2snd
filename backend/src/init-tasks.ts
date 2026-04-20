import { query } from './utils/database';

async function initTaskTables() {
  try {
    console.log('Vérification et création des tables task et tasks...');
    
    // Vérifier si la table task existe
    const taskTableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'task'
      )
    `);

    if (!taskTableExists.rows[0].exists) {
      console.log('Création de la table task...');
      await query(`
        CREATE TABLE task (
          id SERIAL PRIMARY KEY,
          nom VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insérer les 15 tâches spécifiques
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
      `);
      
      console.log('15 tâches spécifiques insérées avec succès');
    } else {
      console.log('Table task existe déjà');
    }

    // Vérifier si la table tasks existe
    const tasksTableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      )
    `);

    if (!tasksTableExists.rows[0].exists) {
      console.log('Création de la table tasks...');
      await query(`
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          dao_id INTEGER NOT NULL REFERENCES daos(id) ON DELETE CASCADE,
          id_task INTEGER REFERENCES task(id),
          titre VARCHAR(255) NOT NULL,
          description TEXT,
          statut VARCHAR(20) NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire', 'en_cours', 'termine')),
          priorite VARCHAR(10) NOT NULL DEFAULT 'moyenne' CHECK (priorite IN ('basse', 'moyenne', 'haute')),
          date_echeance DATE,
          assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
          progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
          date_creation DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Table tasks créée avec succès');
    } else {
      console.log('Table tasks existe déjà');
    }

    // Vérifier les données
    const taskCount = await query('SELECT COUNT(*) as count FROM task');
    console.log(`Nombre de modèles de tâches: ${taskCount.rows[0].count}`);

    const tasksCount = await query('SELECT COUNT(*) as count FROM tasks');
    console.log(`Nombre d'instances de tâches: ${tasksCount.rows[0].count}`);

    console.log('Initialisation terminée avec succès!');
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

initTaskTables().then(() => {
  process.exit(0);
});
