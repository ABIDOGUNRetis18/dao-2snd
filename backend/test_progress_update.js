const { Client } = require('pg');

async function testProgressUpdate() {
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

    // Mettre à jour la progression d'une tâche
    const result = await client.query(`
      UPDATE task 
      SET progress = $1, statut = $2
      WHERE id = $3
      RETURNING id, nom, progress, statut
    `, [25, 'en_cours', 1]);

    console.log('✅ Tâche mise à jour:');
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Nom: ${result.rows[0].nom}`);
    console.log(`Progress: ${result.rows[0].progress}%`);
    console.log(`Statut: ${result.rows[0].statut}`);

    // Vérifier plusieurs tâches
    const check = await client.query(`
      SELECT id, nom, progress, statut 
      FROM task 
      WHERE dao_id = 1 
      ORDER BY id 
      LIMIT 5
    `);

    console.log('\n📋 État des tâches du DAO 1:');
    check.rows.forEach(task => {
      console.log(`ID: ${task.id} - ${task.nom} (${task.progress}% - ${task.statut})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

testProgressUpdate();
