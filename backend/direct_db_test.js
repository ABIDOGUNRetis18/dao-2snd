const { Client } = require('pg');

async function testDirectConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'dao',
    user: 'erwann',
    password: 'erwann'
  });

  try {
    await client.connect();
    console.log('✅ Connexion directe réussie');

    // Vérifier les utilisateurs
    const users = await client.query('SELECT id, username, email, role_id FROM users');
    console.log('\nUtilisateurs trouvés:');
    console.table(users.rows);

    // Vérifier les DAO
    const daos = await client.query('SELECT id, numero, objet, chef_id, chef_projet_nom FROM daos ORDER BY id DESC LIMIT 5');
    console.log('\nDAO trouvés:');
    console.table(daos.rows);

    // Si pas d'admin, en créer un
    if (users.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const result = await client.query(
        'INSERT INTO users (username, email, password, role_id) VALUES ($1, $2, $3, 1) RETURNING id, username, email',
        ['admin', 'admin@example.com', hashedPassword]
      );
      console.log('\n✅ Admin créé:', result.rows[0]);
    }

    // Si pas de DAO, en créer un pour tester
    if (daos.rows.length === 0) {
      const result = await client.query(
        `INSERT INTO daos (numero, objet, reference, autorite, chef_id, chef_projet_nom, statut, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) RETURNING id, numero, objet`,
        ['DAO-2026-001', 'Test DAO pour admin', 'DAO-2026-001', 'Autorité Test', 1, 'Admin', 'EN_ATTENTE']
      );
      console.log('\n✅ DAO de test créé:', result.rows[0]);
    } else {
      // Mettre à jour le premier DAO pour l'assigner à l'admin
      const firstDao = daos.rows[0];
      await client.query(
        'UPDATE daos SET chef_id = $1, chef_projet_nom = $2 WHERE id = $3',
        [1, 'Admin', firstDao.id]
      );
      console.log(`\n✅ DAO ${firstDao.numero} assigné à l'admin`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

testDirectConnection();
