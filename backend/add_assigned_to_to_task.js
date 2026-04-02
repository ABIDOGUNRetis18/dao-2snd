const { Client } = require('pg');

async function addAssignedToToTask() {
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

    // Ajouter la colonne assigned_to à la table task
    try {
      await client.query('ALTER TABLE task ADD COLUMN assigned_to INTEGER REFERENCES users(id)');
      console.log('✅ Colonne assigned_to ajoutée');
    } catch (error) {
      if (error.message.includes('column "assigned_to" already exists')) {
        console.log('ℹ️ La colonne assigned_to existe déjà');
      } else {
        throw error;
      }
    }

    // Vérifier la structure finale
    const structure = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'task'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Structure finale de la table task:');
    structure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable}) ${col.column_default || ''}`);
    });

    // Vérifier quelques tâches
    const sample = await client.query('SELECT id, nom, assigned_to FROM task ORDER BY id LIMIT 3');
    console.log('\n📋 Exemples de tâches:');
    sample.rows.forEach(task => {
      console.log(`ID: ${task.id} - ${task.nom} (Assigné à: ${task.assigned_to || 'Personne'})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

addAssignedToToTask();
