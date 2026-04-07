const { Client } = require('pg');

async function testTaskCreation() {
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

    // État initial des tâches
    const beforeResult = await client.query('SELECT COUNT(*) as count FROM tasks WHERE dao_id = 1');
    console.log(`📊 Avant création: ${beforeResult.rows[0].count} tâches`);

    // Créer une nouvelle tâche directement dans la base
    const newTask = await client.query(`
      INSERT INTO tasks (dao_id, titre, statut, progress, created_at, updated_at)
      VALUES ($1, $2, 'a_faire', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, titre, created_at
    `, [1, 'Tâche de test directe']);

    console.log(`✅ Tâche créée: ID ${newTask.rows[0].id} - ${newTask.rows[0].titre}`);

    // État après création
    const afterResult = await client.query('SELECT COUNT(*) as count FROM tasks WHERE dao_id = 1');
    console.log(`📊 Après création: ${afterResult.rows[0].count} tâches`);

    // Vérifier les 5 dernières tâches
    const latestTasks = await client.query(`
      SELECT id, titre, created_at 
      FROM tasks 
      WHERE dao_id = 1 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('\n📋 5 dernières tâches:');
    latestTasks.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.titre} (${task.created_at})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

testTaskCreation();
