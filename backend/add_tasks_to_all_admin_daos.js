const { Client } = require('pg');

async function addTasksToAllAdminDAOs() {
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

    // Liste des 15 tâches spécifiques
    const tasks = [
      'Résumé sommaire DAO et Création du drive',
      'Demande de caution et garanties',
      'Identification et renseignement des profils dans le drive',
      'Identification et renseignement des ABE dans le drive',
      'Légalisation des ABE, diplômes, certificats, attestations et pièces administratives requis',
      'Indication directive d\'élaboration de l\'offre financier',
      'Elaboration de la méthodologie',
      'Planification prévisionnelle',
      'Identification des références précises des équipements et matériels',
      'Demande de cotation',
      'Elaboration du squelette des offres',
      'Rédaction du contenu des OF et OT',
      'Contrôle et validation des offres',
      'Impression et présentation des offres (Valider l\'étiquette)',
      'Dépôt des offres et clôture'
    ];

    // Récupérer l'ID de l'admin (username = 'admin')
    const adminResult = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (adminResult.rowCount === 0) {
      console.log('❌ Admin non trouvé');
      return;
    }

    const adminId = adminResult.rows[0].id;
    console.log(`👤 Admin ID: ${adminId}`);

    // Récupérer tous les DAO où l'admin est chef de projet
    const daosResult = await client.query('SELECT id, numero, objet FROM daos WHERE chef_id = $1', [adminId]);
    
    if (daosResult.rowCount === 0) {
      console.log('❌ Aucun DAO trouvé pour cet admin');
      return;
    }

    console.log(`📋 ${daosResult.rowCount} DAO trouvés pour l'admin`);

    // Pour chaque DAO de l'admin, ajouter les 15 tâches
    for (const dao of daosResult.rows) {
      console.log(`\n🔄 Traitement du DAO ${dao.numero} (ID: ${dao.id})`);

      // Vérifier si des tâches existent déjà pour ce DAO
      const existingTasks = await client.query('SELECT COUNT(*) as count FROM tasks WHERE dao_id = $1', [dao.id]);
      
      if (parseInt(existingTasks.rows[0].count) > 0) {
        console.log(`🗑️ ${existingTasks.rows[0].count} tâches existantes supprimées`);
        await client.query('DELETE FROM tasks WHERE dao_id = $1', [dao.id]);
      }

      // Insérer les 15 tâches pour ce DAO
      for (let i = 0; i < tasks.length; i++) {
        await client.query(`
          INSERT INTO tasks (dao_id, titre, statut, progress, created_at, updated_at)
          VALUES ($1, $2, 'a_faire', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [dao.id, tasks[i]]);
      }

      console.log(`✅ 15 tâches ajoutées pour le DAO ${dao.numero}`);
    }

    // Vérification finale
    console.log('\n📊 Résumé final:');
    const finalCheck = await client.query(`
      SELECT d.id, d.numero, COUNT(t.id) as task_count
      FROM daos d
      LEFT JOIN tasks t ON d.id = t.dao_id
      WHERE d.chef_id = $1
      GROUP BY d.id, d.numero
      ORDER BY d.id
    `, [adminId]);

    console.table(finalCheck.rows);

    console.log(`\n🎉 ${daosResult.rowCount} DAO de l'admin ont maintenant chacun 15 tâches!`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

addTasksToAllAdminDAOs();
