const { Client } = require('pg');

async function debugDao2() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'dao',
    user: 'erwann',
    password: 'erwann'
  });

  try {
    await client.connect();
    
    // Vérifier les tâches du DAO 2
    const result = await client.query(`
      SELECT t.id, t.nom, t.dao_id 
      FROM task t
      WHERE t.dao_id = 2
      ORDER BY t.id
    `);

    console.log(`📋 Tâches du DAO 2: ${result.rowCount} tâches`);
    result.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.nom}`);
    });

    // Tester la requête exacte du contrôleur
    const controllerQuery = await client.query(`
      SELECT 
        t.id,
        t.nom as titre,
        null as statut,
        null as priorite,
        null as date_echeance,
        null as assigned_to,
        null as assigned_username,
        null as progress,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
      FROM task t
      WHERE t.dao_id = $1
      ORDER BY t.id ASC
    `, [2]);

    console.log(`\n📋 Requête contrôleur pour DAO 2: ${controllerQuery.rowCount} résultats`);
    controllerQuery.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.titre}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

debugDao2();
