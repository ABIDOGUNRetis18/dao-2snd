const { Client } = require('pg');

async function setupTestData() {
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

    // Récupérer l'admin
    const adminResult = await client.query('SELECT id, username FROM users WHERE username = $1', ['test_admin_final']);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Admin non trouvé');
      return;
    }
    
    const adminId = adminResult.rows[0].id;
    console.log(`✅ Admin trouvé: ID ${adminId}`);

    // Créer un DAO simple
    const reference = 'DAO-FINAL-TEST-' + Date.now();
    const objet = 'DAO test final';
    const chef_projet_nom = 'Admin Test';
    const date_depot = new Date().toISOString().split('T')[0];
    
    const daoResult = await client.query(
      'INSERT INTO daos (reference, objet, chef_id, chef_projet_nom, date_depot, statut, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING id, numero',
      [reference, objet, adminId, chef_projet_nom, date_depot, 'EN_COURS']
    );
    
    const dao = daoResult.rows[0];
    console.log(`✅ DAO créé: ${dao.numero} (ID: ${dao.id})`);

    // Récupérer 2 membres
    const membersResult = await client.query("SELECT id, username FROM users WHERE username LIKE '%_final' AND role_id = 4 LIMIT 2");
    console.log(`📋 ${membersResult.rows.length} membres trouvés`);

    // Assigner 3 tâches
    const tasksResult = await client.query('SELECT id, nom FROM task WHERE dao_id = $1 ORDER BY id LIMIT 3', [dao.id]);
    console.log(`📋 ${tasksResult.rows.length} tâches trouvées`);

    for (let i = 0; i < tasksResult.rows.length && i < membersResult.rows.length; i++) {
      const task = tasksResult.rows[i];
      const assigneeId = membersResult.rows[i].id;
      
      await client.query('UPDATE task SET assigned_to = $1 WHERE id = $2', [assigneeId, task.id]);
      
      const assigneeName = membersResult.rows.find(m => m.id === assigneeId)?.username;
      console.log(`✅ Tâche "${task.nom}" assignée à ${assigneeName}`);
    }

    console.log('\n✅ Configuration de test terminée !');
    console.log('📝 Utilisateurs créés:');
    console.log('  Admin: test_admin_final / admin123');
    console.log('  Membres: membre1_final / member123, membre2_final / member123');
    console.log('\n🎯 DAO créé avec tâches assignées');
    console.log('  Allez dans "Tous les DAO" et cliquez sur le DAO pour voir l\'assignation');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

setupTestData();
