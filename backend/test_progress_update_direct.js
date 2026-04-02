const { Client } = require('pg');

async function testProgressUpdateDirect() {
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

    // Mettre à jour la progression d'une tâche assignée à l'admin
    const result = await client.query(`
      UPDATE task 
      SET progress = $1, statut = $2
      WHERE id = $3 AND assigned_to = $4
      RETURNING id, nom, progress, statut, assigned_to
    `, [75, 'en_cours', 2, 11]);

    console.log('✅ Progression mise à jour:');
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Nom: ${result.rows[0].nom}`);
    console.log(`Progress: ${result.rows[0].progress}%`);
    console.log(`Statut: ${result.rows[0].statut}`);
    console.log(`Assigné à: ${result.rows[0].assigned_to}`);

    // Vérifier toutes les tâches de l'admin
    const checkResult = await client.query(`
      SELECT 
        t.id, t.nom, t.progress, t.statut,
        d.numero as dao_numero
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      WHERE t.assigned_to = 11
      ORDER BY t.id
    `);

    console.log('\n📋 Toutes les tâches assignées à l\'admin:');
    checkResult.rows.forEach((task, index) => {
      console.log(`${index + 1}. ${task.dao_numero}: ${task.nom}`);
      console.log(`   Progress: ${task.progress}%, Statut: ${task.statut}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

testProgressUpdateDirect();
