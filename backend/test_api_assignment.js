const { Client } = require('pg');

async function testApiAssignment() {
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

    // Tester la requête exacte de getTasksByDao
    const tasksResult = await client.query(`
      SELECT 
        t.id,
        t.nom as titre,
        t.progress,
        t.statut,
        t.assigned_to,
        u.username as assigned_username,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
      FROM task t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.dao_id = $1
      ORDER BY t.id ASC
    `, [1]);

    console.log(`📋 Tâches du DAO 1 avec assignations: ${tasksResult.rowCount} tâches`);
    tasksResult.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.titre}`);
      console.log(`   Progress: ${task.progress}%, Statut: ${task.statut}`);
      console.log(`   Assigné à: ${task.assigned_username || 'Personne'} (ID: ${task.assigned_to})`);
      console.log('');
    });

    // Tester la requête de myTasks
    const myTasksResult = await client.query(`
      SELECT 
        t.id,
        t.nom as titre,
        t.dao_id,
        t.progress,
        t.statut,
        t.assigned_to,
        u.username as assigned_username,
        d.numero as dao_numero,
        d.objet as dao_objet,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE d.chef_id = $1
      ORDER BY t.id DESC
      LIMIT 5
    `, [11]);

    console.log(`📋 5 premières tâches de l'admin avec assignations:`);
    myTasksResult.rows.forEach((task, index) => {
      console.log(`${index + 1}. ${task.dao_numero}: ${task.titre}`);
      console.log(`   Progress: ${task.progress}%, Statut: ${task.statut}`);
      console.log(`   Assigné à: ${task.assigned_username || 'Personne'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

testApiAssignment();
