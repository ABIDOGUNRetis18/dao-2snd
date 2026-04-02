const { Client } = require('pg');

async function insertSpecificTasks() {
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

    // Récupérer le premier DAO (admin)
    const daoResult = await client.query('SELECT id FROM daos ORDER BY id LIMIT 1');
    
    if (daoResult.rowCount === 0) {
      console.log('❌ Aucun DAO trouvé');
      return;
    }

    const daoId = daoResult.rows[0].id;
    console.log(`📋 Utilisation du DAO ID ${daoId}`);

    // Supprimer les tâches existantes pour ce DAO
    const deleteResult = await client.query('DELETE FROM tasks WHERE dao_id = $1', [daoId]);
    console.log(`🗑️ ${deleteResult.rowCount} anciennes tâches supprimées`);

    // Insérer les 15 nouvelles tâches
    for (let i = 0; i < tasks.length; i++) {
      await client.query(`
        INSERT INTO tasks (dao_id, titre, statut, progress, created_at, updated_at)
        VALUES ($1, $2, 'a_faire', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [daoId, tasks[i]]);
      console.log(`✅ Tâche ${i + 1} insérée: ${tasks[i]}`);
    }

    console.log(`\n🎉 15 tâches spécifiques insérées avec succès pour le DAO ID ${daoId}`);

    // Vérification finale
    const finalCheck = await client.query(`
      SELECT t.id, t.titre, t.dao_id, d.numero 
      FROM tasks t 
      JOIN daos d ON t.dao_id = d.id 
      WHERE t.dao_id = $1
      ORDER BY t.id
    `, [daoId]);

    console.log('\n📊 Tâches insérées:');
    finalCheck.rows.forEach((task, index) => {
      console.log(`${index + 1}. ${task.titre}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error);
  } finally {
    await client.end();
  }
}

insertSpecificTasks();
