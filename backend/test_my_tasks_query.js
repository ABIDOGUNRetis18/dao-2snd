const { Client } = require('pg');

async function testMyTasksQuery() {
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

    // Tester la requête exacte du contrôleur avec userId = 11 (admin)
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
        t.created_at,
        t.updated_at
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      WHERE d.chef_id = $1
      ORDER BY t.created_at DESC
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

testMyTasksQuery();
