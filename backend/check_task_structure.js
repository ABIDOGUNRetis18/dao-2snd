const { Client } = require('pg');

async function checkTaskStructure() {
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

    // Vérifier la structure de la table task
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'task'
      ORDER BY ordinal_position
    `);

    console.log('📋 Structure de la table task:');
    structure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable}) ${col.column_default || ''}`);
    });

    // Voir le contenu actuel
    const content = await client.query('SELECT * FROM task ORDER BY id LIMIT 5');
    console.log('\n📋 Contenu actuel de la table task:');
    content.rows.forEach((row, index) => {
      console.log(`${index + 1}.`, row);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

checkTaskStructure();
