const { Client } = require('pg');

async function testApiProgress() {
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

    // Simuler la mise à jour via API (sans authentification pour le test)
    const result = await client.query(`
      UPDATE task 
      SET progress = $1, statut = $2
      WHERE id = $3
      RETURNING id, nom, progress, statut, dao_id
    `, [50, 'en_cours', 2]);

    console.log('✅ Simulation API - Tâche mise à jour:');
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Nom: ${result.rows[0].nom}`);
    console.log(`Progress: ${result.rows[0].progress}%`);
    console.log(`Statut: ${result.rows[0].statut}`);
    console.log(`DAO ID: ${result.rows[0].dao_id}`);

    // Vérifier l'état final
    const finalCheck = await client.query(`
      SELECT 
        t.id, t.nom, t.progress, t.statut,
        d.numero as dao_numero, d.objet as dao_objet
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      WHERE t.id IN (1, 2)
      ORDER BY t.id
    `);

    console.log('\n📋 État final des tâches:');
    finalCheck.rows.forEach(task => {
      console.log(`DAO ${task.dao_numero}: ${task.nom} (${task.progress}% - ${task.statut})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

testApiProgress();
