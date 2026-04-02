const { Client } = require('pg');

async function testAPITaskCreation() {
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

    // Compter les tâches avant
    const beforeCount = await client.query('SELECT COUNT(*) as count FROM tasks WHERE dao_id = 1');
    console.log(`📊 Avant test API: ${beforeCount.rows[0].count} tâches`);

    // Simuler une création via l'API
    const taskName = `Tâche test API ${Date.now()}`;
    console.log(`🔄 Création de la tâche: ${taskName}`);
    
    const result = await client.query(`
      INSERT INTO tasks (dao_id, titre, statut, progress, created_at, updated_at)
      VALUES ($1, $2, 'a_faire', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, titre, created_at
    `, [1, taskName]);

    console.log(`✅ Tâche créée: ID ${result.rows[0].id} - ${result.rows[0].titre}`);

    // Compter les tâches après
    const afterCount = await client.query('SELECT COUNT(*) as count FROM tasks WHERE dao_id = 1');
    console.log(`📊 Après test API: ${afterCount.rows[0].count} tâches`);

    // Vérifier que la tâche est bien là
    const verifyTask = await client.query('SELECT * FROM tasks WHERE id = $1', [result.rows[0].id]);
    if (verifyTask.rowCount > 0) {
      console.log('✅ Tâche vérifiée dans la base de données');
      console.log(`📋 Détails: ${verifyTask.rows[0].titre}`);
    } else {
      console.log('❌ Tâche non trouvée dans la base de données');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

testAPITaskCreation();
