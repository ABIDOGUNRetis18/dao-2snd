const { Client } = require('pg');

async function checkNewTask() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'dao',
    user: 'erwann',
    password: 'erwann'
  });

  try {
    await client.connect();
    
    const result = await client.query('SELECT * FROM task ORDER BY id DESC LIMIT 5');
    console.log('📋 5 dernières tâches dans la table task:');
    result.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.nom}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

checkNewTask();
