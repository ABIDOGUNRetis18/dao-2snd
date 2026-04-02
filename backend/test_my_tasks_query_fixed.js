const { Client } = require('pg');

async function testMyTasksQueryFixed() {
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

    // Tester la requête corrigée du contrôleur
    const result = await client.query(`
      SELECT 
        t.id,
        t.nom as titre,
        t.dao_id,
        d.numero as dao_numero,
        d.objet as dao_objet,
        null as assigned_to,
        null as assigned_username,
        null as statut,
        null as progress,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      WHERE d.chef_id = $1
      ORDER BY t.id DESC
    `, [11]);

    console.log(`📋 Tâches trouvées pour l'admin: ${result.rowCount}`);
    result.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.titre} (DAO: ${task.dao_numero})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

testMyTasksQueryFixed();
