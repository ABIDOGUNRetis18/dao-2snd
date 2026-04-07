const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'dao',
  user: 'erwann',
  password: 'erwann'
});

async function createTestUsers() {
  try {
    await client.connect();
    console.log('✅ Connexion réussie');

    const testUsers = [
      { username: 'directeur_test', email: 'directeur@test.com', password: 'test123', role_id: 1, role_name: 'Directeur Général' },
      { username: 'admin_test', email: 'admin@test.com', password: 'test123', role_id: 2, role_name: 'Administrateur' },
      { username: 'chef_projet_test', email: 'chef@test.com', password: 'test123', role_id: 3, role_name: 'Chef de Projet' },
      { username: 'membre_test', email: 'membre@test.com', password: 'test123', role_id: 4, role_name: 'Membre d\'Équipe' },
      { username: 'lecteur_test', email: 'lecteur@test.com', password: 'test123', role_id: 5, role_name: 'Lecteur' }
    ];

    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      try {
        const result = await client.query(
          'INSERT INTO users (username, email, password, role_id, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id, username',
          [user.username, user.email, hashedPassword, user.role_id]
        );
        
        console.log(`✅ ${user.role_name} créé: ${result.rows[0].username} (ID: ${result.rows[0].id})`);
      } catch (error) {
        if (error.code === '23505') { // Code d'erreur pour duplicate key
          console.log(`ℹ️  ${user.role_name} existe déjà: ${user.username}`);
        } else {
          console.log(`❌ Erreur lors de la création de ${user.username}:`, error.message);
        }
      }
    }

    console.log('\n📝 Identifiants de connexion créés:');
    console.log('🎯 Directeur Général: directeur_test / test123');
    console.log('👨‍💼 Administrateur: admin_test / test123');
    console.log('👨‍💼 Chef de Projet: chef_projet_test / test123');
    console.log('👥 Membre d\'Équipe: membre_test / test123');
    console.log('📖 Lecteur: lecteur_test / test123');
    
    console.log('\n🎯 Pages de redirection:');
    console.log('directeur_test → /admin/directeur-general');
    console.log('admin_test → /admin/directeur-general');
    console.log('chef_projet_test → /admin/chef-projet');
    console.log('membre_test → /admin/membre-equipe');
    console.log('lecteur_test → /admin/lecteur');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

createTestUsers();
