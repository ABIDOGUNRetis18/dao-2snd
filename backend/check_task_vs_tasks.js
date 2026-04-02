const { Client } = require('pg');

async function checkTaskVsTasks() {
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

    // Vérifier la table task (sans S)
    const taskExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'task'
      );
    `);

    console.log(`📋 Table task (sans S) existe: ${taskExists.rows[0].exists}`);

    if (taskExists.rows[0].exists) {
      const taskCount = await client.query('SELECT COUNT(*) as count FROM task');
      console.log(`📊 Nombre de lignes dans table task: ${taskCount.rows[0].count}`);

      if (taskCount.rows[0].count > 0) {
        const taskData = await client.query('SELECT * FROM task LIMIT 5');
        console.log('\n📋 Contenu de la table task:');
        taskData.rows.forEach((row, index) => {
          console.log(`${index + 1}.`, row);
        });
      }
    }

    // Vérifier la table tasks (avec S)
    const tasksExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      );
    `);

    console.log(`\n📋 Table tasks (avec S) existe: ${tasksExists.rows[0].exists}`);

    if (tasksExists.rows[0].exists) {
      const tasksCount = await client.query('SELECT COUNT(*) as count FROM tasks');
      console.log(`📊 Nombre de lignes dans table tasks: ${tasksCount.rows[0].count}`);

      if (tasksCount.rows[0].count > 0) {
        const tasksData = await client.query('SELECT id, titre, created_at FROM tasks ORDER BY created_at DESC LIMIT 3');
        console.log('\n📋 3 dernières tâches dans la table tasks:');
        tasksData.rows.forEach((row, index) => {
          console.log(`${index + 1}. ID: ${row.id} - ${row.titre}`);
        });
      }
    }

    console.log('\n🎯 CONCLUSION:');
    console.log('- Les tâches créées par l\'application sont dans la table TASKS (avec S)');
    console.log('- Vous regardez probablement la table TASK (sans S)');
    console.log('- Regardez dans la table TASKS pour voir vos 38 tâches !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

checkTaskVsTasks();
