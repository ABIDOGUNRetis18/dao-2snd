const bcrypt = require('bcryptjs');
const { query } = require('./dist/utils/database');

async function checkUsers() {
  try {
    console.log('Vérification des utilisateurs...');
    const users = await query('SELECT id, username, email, role_id FROM users');
    console.table(users.rows);
    
    if (users.rows.length === 0) {
      console.log('Aucun utilisateur trouvé. Création d\'un admin test...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const result = await query(
        'INSERT INTO users (username, email, password, role_id) VALUES ($1, $2, $3, 1) RETURNING id, username, email',
        ['admin', 'admin@example.com', hashedPassword]
      );
      console.log('Admin créé:', result.rows[0]);
    }
    
    console.log('\nVérification des DAO...');
    const daos = await query('SELECT id, numero, objet, chef_id, chef_projet_nom FROM daos ORDER BY id DESC LIMIT 5');
    console.table(daos.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkUsers();
