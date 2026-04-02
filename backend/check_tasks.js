const { Client } = require('pg');

async function checkTasks() {
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

    // Vérifier toutes les tâches du DAO ID 1
    const result = await client.query(`
      SELECT id, titre, created_at 
      FROM tasks 
      WHERE dao_id = 1 
      ORDER BY id
    `);

    console.log(`📋 ${result.rowCount} tâches trouvées pour le DAO ID 1:`);
    result.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.titre} (${task.created_at})`);
    });

    // Vérifier s'il y a des tâches récentes (créées après les 15 de base)
    const recentTasks = await client.query(`
      SELECT id, titre, created_at 
      FROM tasks 
      WHERE dao_id = 1 AND id > 45
      ORDER BY id
    `);

    if (recentTasks.rowCount > 0) {
      console.log(`\n🆕 ${recentTasks.rowCount} tâches supplémentaires trouvées:`);
      recentTasks.rows.forEach(task => {
        console.log(`- ID: ${task.id} - ${task.titre}`);
      });
    } else {
      console.log('\n❌ Aucune tâche supplémentaire trouvée (ID > 45)');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

checkTasks();
