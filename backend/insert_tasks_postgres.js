const { Client } = require('pg');

async function insertTasksDirectly() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'dao',
    user: 'erwann',
    password: 'erwann'
  });

  try {
    await client.connect();
    console.log('✅ Connexion à PostgreSQL réussie');

    // Vérifier d'abord si la table tasks existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📋 Création de la table tasks...');
      await client.query(`
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          dao_id INTEGER NOT NULL REFERENCES daos(id) ON DELETE CASCADE,
          titre VARCHAR(255) NOT NULL,
          description TEXT,
          statut VARCHAR(20) NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire', 'en_cours', 'termine')),
          priorite VARCHAR(10) NOT NULL DEFAULT 'moyenne' CHECK (priorite IN ('basse', 'moyenne', 'haute')),
          date_echeance DATE,
          assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
          progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Table tasks créée');
    }

    // Liste des 15 tâches à insérer
    const tasks = [
      'Analyser les exigences du client',
      'Préparer le cahier des charges',
      'Concevoir l\'architecture technique',
      'Développer la base de données',
      'Créer les API REST',
      'Développer l\'interface utilisateur',
      'Mettre en place l\'authentification',
      'Effectuer les tests unitaires',
      'Rédiger la documentation',
      'Préparer la recette utilisateur',
      'Déployer en environnement de test',
      'Effectuer les tests d\'intégration',
      'Optimiser les performances',
      'Préparer le déploiement production',
      'Former les utilisateurs finaux'
    ];

    // Récupérer les DAO existants pour assigner les tâches
    const daoResult = await client.query('SELECT id FROM daos ORDER BY id LIMIT 1');
    
    if (daoResult.rowCount === 0) {
      console.log('❌ Aucun DAO trouvé. Création d\'un DAO de test...');
      const newDao = await client.query(`
        INSERT INTO daos (numero, objet, reference, autorite, chef_id, chef_projet_nom, statut, created_at)
        VALUES ('DAO-2026-001', 'Test DAO pour tâches', 'DAO-2026-001', 'Autorité Test', 11, 'admin', 'EN_ATTENTE', CURRENT_TIMESTAMP)
        RETURNING id
      `);
      const daoId = newDao.rows[0].id;
      
      // Insérer les tâches pour ce nouveau DAO
      for (let i = 0; i < tasks.length; i++) {
        await client.query(`
          INSERT INTO tasks (dao_id, titre, statut, progress, created_at, updated_at)
          VALUES ($1, $2, 'a_faire', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [daoId, tasks[i]]);
      }
      console.log(`✅ 15 tâches insérées pour le DAO ID ${daoId}`);
    } else {
      const daoId = daoResult.rows[0].id;
      
      // Vérifier si des tâches existent déjà pour ce DAO
      const existingTasks = await client.query('SELECT COUNT(*) as count FROM tasks WHERE dao_id = $1', [daoId]);
      
      if (parseInt(existingTasks.rows[0].count) > 0) {
        console.log(`📋 ${existingTasks.rows[0].count} tâches existent déjà pour le DAO ID ${daoId}`);
        console.log('Suppression des tâches existantes...');
        await client.query('DELETE FROM tasks WHERE dao_id = $1', [daoId]);
      }
      
      // Insérer les 15 tâches
      for (let i = 0; i < tasks.length; i++) {
        await client.query(`
          INSERT INTO tasks (dao_id, titre, statut, progress, created_at, updated_at)
          VALUES ($1, $2, 'a_faire', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [daoId, tasks[i]]);
      }
      console.log(`✅ 15 tâches insérées pour le DAO ID ${daoId}`);
    }

    // Vérification finale
    const finalCheck = await client.query(`
      SELECT t.id, t.titre, t.dao_id, d.numero 
      FROM tasks t 
      JOIN daos d ON t.dao_id = d.id 
      WHERE t.dao_id = (SELECT id FROM daos ORDER BY id LIMIT 1)
      ORDER BY t.id
    `);

    console.log('\n📊 Tâches insérées:');
    console.table(finalCheck.rows);

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error);
  } finally {
    await client.end();
  }
}

insertTasksDirectly();
