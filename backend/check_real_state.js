const { Client } = require('pg');

async function checkRealState() {
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

    // Vérifier si la table tasks existe vraiment
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      );
    `);

    console.log(`📋 Table tasks existe: ${tableCheck.rows[0].exists}`);

    if (tableCheck.rows[0].exists) {
      // Compter les tâches
      const count = await client.query('SELECT COUNT(*) as count FROM tasks');
      console.log(`📊 Nombre de tâches: ${count.rows[0].count}`);

      // Voir les dernières tâches
      const latest = await client.query(`
        SELECT id, titre, created_at 
        FROM tasks 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      console.log('\n📋 Dernières tâches:');
      latest.rows.forEach((task, index) => {
        console.log(`${index + 1}. ID: ${task.id} - ${task.titre}`);
      });
    } else {
      console.log('❌ La table tasks n\'existe pas vraiment');
      
      // Recréer la table tasks
      console.log('🔧 Recréation de la table tasks...');
      await client.query(`
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          dao_id INTEGER NOT NULL REFERENCES daos(id) ON DELETE CASCADE,
          titre VARCHAR(255) NOT NULL,
          description TEXT,
          statut VARCHAR(20) NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire', 'en_cours', 'termine')),
          priorite VARCHAR(10) NOT NULL DEFAULT 'moyenne' CHECK (priorite IN ('basse', 'moyenne', 'haute')),
          date_echeance DATE,
          assigned_to INTEGER,
          progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Table tasks recréée');
      
      // Ajouter les 15 tâches de base pour chaque DAO de l'admin
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

      // Récupérer les DAO de l'admin
      const daos = await client.query('SELECT id, numero FROM daos WHERE chef_id = 11');
      
      for (const dao of daos.rows) {
        console.log(`📋 Ajout des 15 tâches pour DAO ${dao.numero}`);
        
        for (const task of tasks) {
          await client.query(`
            INSERT INTO tasks (dao_id, titre, statut, progress, created_at, updated_at)
            VALUES ($1, $2, 'a_faire', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [dao.id, task]);
        }
      }
      
      console.log('✅ Toutes les tâches ont été recréées');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

checkRealState();
