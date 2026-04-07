const { Client } = require('pg');

async function finalVerification() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'dao',
    user: 'erwann',
    password: 'erwann'
  });

  try {
    await client.connect();
    console.log('✅ Vérification finale...');

    // Lister toutes les tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%task%'
      ORDER BY table_name
    `);

    console.log('\n📋 Tables contenant "task":');
    if (tables.rowCount === 0) {
      console.log('Aucune table trouvée');
    } else {
      tables.rows.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }

    // Vérifier le contenu de la table task
    const taskContent = await client.query(`
      SELECT id, nom 
      FROM task 
      ORDER BY id DESC 
      LIMIT 5
    `);

    console.log('\n📋 5 dernières tâches dans la table task:');
    taskContent.rows.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task.id} - ${task.nom}`);
    });

    console.log('\n🎉 Nettoyage terminé ! Seule la table task (sans S) existe maintenant.');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

finalVerification();
