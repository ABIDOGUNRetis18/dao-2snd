const { Client } = require('pg');

async function dropTasksTable() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'dao',
    user: 'erwann',
    password: 'erwann'
  });

  try {
    await client.connect();
    console.log('✅ Connexion à PostgreSQL réussie');

    // Vérifier si la table tasks existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('🗑️ Suppression de la table tasks (avec S)...');
      
      // Supprimer la table tasks avec CASCADE pour supprimer aussi les contraintes
      await client.query('DROP TABLE IF EXISTS tasks CASCADE');
      
      console.log('✅ Table tasks supprimée avec succès');
    } else {
      console.log('ℹ️ La table tasks n\'existe pas déjà');
    }

    // Vérifier l'état final
    const finalCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('task', 'tasks')
      ORDER BY table_name
    `);

    console.log('\n📋 Tables restantes:');
    if (finalCheck.rowCount === 0) {
      console.log('Aucune des tables task/tasks trouvée');
    } else {
      finalCheck.rows.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }

    // Vérifier le contenu de la table task
    const taskCount = await client.query('SELECT COUNT(*) as count FROM task');
    console.log(`\n📊 Table task contient: ${taskCount.rows[0].count} tâches`);

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  } finally {
    await client.end();
  }
}

dropTasksTable();
