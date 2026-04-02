const { Client } = require('pg');

async function simpleCheck() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'dao',
    user: 'erwann',
    password: 'erwann'
  });

  try {
    await client.connect();
    
    // Requête simple pour voir les 5 dernières tâches
    const result = await client.query(`
      SELECT id, titre, created_at 
      FROM tasks 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('📋 5 dernières tâches dans la table TASKS:');
    result.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.titre}`);
      console.log(`   Créée: ${task.created_at}\n`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

simpleCheck();
