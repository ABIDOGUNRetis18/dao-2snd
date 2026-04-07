const { Client } = require('pg');

async function addProgressToTask() {
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

    // Ajouter les colonnes progress et statut à la table task
    try {
      await client.query('ALTER TABLE task ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)');
      console.log('✅ Colonne progress ajoutée');
    } catch (error) {
      if (error.message.includes('column "progress" already exists')) {
        console.log('ℹ️ La colonne progress existe déjà');
      } else {
        throw error;
      }
    }

    try {
      await client.query('ALTER TABLE task ADD COLUMN statut VARCHAR(20) DEFAULT \'a_faire\' CHECK (statut IN (\'a_faire\', \'en_cours\', \'termine\'))');
      console.log('✅ Colonne statut ajoutée');
    } catch (error) {
      if (error.message.includes('column "statut" already exists')) {
        console.log('ℹ️ La colonne statut existe déjà');
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
    const sample = await client.query('SELECT id, nom, progress, statut FROM task ORDER BY id LIMIT 3');
    console.log('\n📋 Exemples de tâches:');
    sample.rows.forEach(task => {
      console.log(`ID: ${task.id} - ${task.nom} (Progress: ${task.progress}%, Statut: ${task.statut})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

addProgressToTask();
