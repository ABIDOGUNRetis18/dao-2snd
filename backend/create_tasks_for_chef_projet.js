const { Client } = require('pg');

async function createTasksForChefProjet() {
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

    // Créer 15 tâches pour le DAO ID 12 (chef projet)
    const tasks = [
      { nom: 'Analyser les besoins du client', statut: 'termine', progress: 100, assigned_to: 26 },
      { nom: 'Préparer le cahier des charges', statut: 'termine', progress: 100, assigned_to: 26 },
      { nom: 'Concevoir l\'architecture technique', statut: 'en_cours', progress: 75, assigned_to: 26 },
      { nom: 'Développer la base de données', statut: 'en_cours', progress: 60, assigned_to: 26 },
      { nom: 'Créer les API REST', statut: 'en_cours', progress: 45, assigned_to: 26 },
      { nom: 'Développer l\'interface utilisateur', statut: 'a_faire', progress: 0, assigned_to: 26 },
      { nom: 'Mettre en place l\'authentification', statut: 'a_faire', progress: 0, assigned_to: 26 },
      { nom: 'Effectuer les tests unitaires', statut: 'a_faire', progress: 0, assigned_to: 26 },
      { nom: 'Rédiger la documentation', statut: 'a_faire', progress: 0, assigned_to: 26 },
      { nom: 'Préparer la recette utilisateur', statut: 'a_faire', progress: 0, assigned_to: 26 },
      { nom: 'Déployer en environnement de test', statut: 'a_faire', progress: 0, assigned_to: 26 },
      { nom: 'Effectuer les tests d\'intégration', statut: 'a_faire', progress: 0, assigned_to: 26 },
      { nom: 'Optimiser les performances', statut: 'a_faire', progress: 0, assigned_to: 26 },
      { nom: 'Préparer le déploiement production', statut: 'a_faire', progress: 0, assigned_to: 26 },
      { nom: 'Former les utilisateurs finaux', statut: 'a_faire', progress: 0, assigned_to: 26 }
    ];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      await client.query(
        `INSERT INTO task (dao_id, nom, statut, progress, assigned_to) 
         VALUES ($1, $2, $3, $4, $5)`,
        [12, task.nom, task.statut, task.progress, task.assigned_to]
      );
    }

    console.log('✅ 15 tâches créées pour le DAO ID 12 (chef projet)');

    // Vérifier les tâches créées
    const result = await client.query(
      'SELECT id, nom, statut, progress FROM task WHERE dao_id = $1 ORDER BY id',
      [12]
    );
    console.log('\nTâches créées:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

createTasksForChefProjet();
