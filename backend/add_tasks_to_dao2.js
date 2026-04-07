const { Client } = require('pg');

async function addTasksToDao2() {
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

    // Les 15 tâches de base
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

    // Ajouter les 15 tâches au DAO 2
    for (const task of tasks) {
      await client.query(`
        INSERT INTO task (nom, dao_id)
        VALUES ($1, $2)
      `, [task, 2]);
    }

    console.log('✅ 15 tâches ajoutées au DAO 2');

    // Vérifier les tâches par DAO
    const check = await client.query(`
      SELECT t.dao_id, d.numero, COUNT(t.id) as task_count
      FROM task t
      LEFT JOIN daos d ON t.dao_id = d.id
      WHERE t.dao_id IN (1, 2)
      GROUP BY t.dao_id, d.numero
      ORDER BY t.dao_id
    `);

    console.log('\n📊 Répartition des tâches:');
    check.rows.forEach(row => {
      console.log(`DAO ${row.numero} (ID: ${row.dao_id}): ${row.task_count} tâches`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

addTasksToDao2();
