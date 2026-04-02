const { Client } = require('pg');

async function createTestTasks() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'dao',
    user: 'erwann',
    password: 'erwann'
  });

  try {
    await client.connect();
    console.log('✅ Connexion réussie');

    // Créer 15 tâches de test pour le DAO ID 1 (admin)
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

    for (let i = 0; i < tasks.length; i++) {
      await client.query(
        `INSERT INTO tasks (dao_id, titre, statut, progress, created_at, updated_at) 
         VALUES ($1, $2, 'a_faire', 0, NOW(), NOW())`,
        [1, tasks[i]]
      );
    }

    console.log('✅ 15 tâches de test créées pour le DAO ID 1');

    // Vérifier les tâches créées
    const result = await client.query(
      'SELECT id, titre FROM tasks WHERE dao_id = $1 ORDER BY id',
      [1]
    );
    console.log('\nTâches créées:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

createTestTasks();
