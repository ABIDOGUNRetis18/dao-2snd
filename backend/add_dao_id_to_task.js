const { Client } = require('pg');

async function addDaoIdToTask() {
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

    // Ajouter la colonne dao_id à la table task
    try {
      await client.query('ALTER TABLE task ADD COLUMN dao_id INTEGER REFERENCES daos(id) ON DELETE CASCADE');
      console.log('✅ Colonne dao_id ajoutée à la table task');
    } catch (error) {
      if (error.message.includes('column "dao_id" already exists')) {
        console.log('ℹ️ La colonne dao_id existe déjà');
      } else {
        throw error;
      }
    }

    // Mettre à jour les tâches existantes pour les assigner au DAO 1 (admin)
    const updateResult = await client.query(`
      UPDATE task 
      SET dao_id = 1 
      WHERE dao_id IS NULL
    `);
    console.log(`✅ ${updateResult.rowCount} tâches mises à jour avec dao_id = 1`);

    // Vérifier l'état actuel
    const checkResult = await client.query(`
      SELECT t.id, t.nom, t.dao_id, d.numero 
      FROM task t
      LEFT JOIN daos d ON t.dao_id = d.id
      ORDER BY t.id
      LIMIT 5
    `);

    console.log('\n📋 État actuel de la table task:');
    checkResult.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.nom} (DAO: ${task.numero || 'Non assigné'})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

addDaoIdToTask();
