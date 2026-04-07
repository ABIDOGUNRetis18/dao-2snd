const { Client } = require('pg');

async function assignTasksToAdmin() {
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

    // Assigner quelques tâches à l'admin (ID: 11)
    const tasksToAssign = [1, 2, 3]; // IDs des tâches à assigner
    
    for (const taskId of tasksToAssign) {
      const result = await client.query(`
        UPDATE task 
        SET assigned_to = $1
        WHERE id = $2
        RETURNING id, nom, assigned_to
      `, [11, taskId]);

      console.log(`✅ Tâche assignée: ID ${result.rows[0].id} - ${result.rows[0].nom}`);
    }

    // Vérifier les tâches assignées à l'admin
    const checkResult = await client.query(`
      SELECT 
        t.id, 
        t.nom, 
        t.progress,
        t.statut,
        d.numero as dao_numero,
        u.username as assigned_username
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = 11
      ORDER BY t.id
    `);

    console.log(`\n📋 Tâches assignées à l'admin (${checkResult.rowCount} tâches):`);
    checkResult.rows.forEach((task, index) => {
      console.log(`${index + 1}. ${task.dao_numero}: ${task.nom}`);
      console.log(`   Progress: ${task.progress}%, Statut: ${task.statut}`);
      console.log(`   Assigné à: ${task.assigned_username}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

assignTasksToAdmin();
