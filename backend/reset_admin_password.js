const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
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

    // Réinitialiser le mot de passe de l'admin avec un mot de passe sécurisé
    const newPassword = 'AdminDAO2026!Secure';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const result = await client.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username, email',
      [hashedPassword, 'admin']
    );
    
    console.log('✅ Mot de passe admin changé avec succès');
    console.log('🔑 Nouveau mot de passe: AdminDAO2026!Secure');
    console.log('⚠️  Changez-le immédiatement via l\'interface!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

resetAdminPassword();
