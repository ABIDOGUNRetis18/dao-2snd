const { Client } = require('pg');

async function checkAllTasks() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'dao',
    user: 'erwann',
    password: 'erwann'
  });

  try {
    await client.connect();
    console.log('✅ Connexion à la base de données DAO réussie');

    // Vérifier toutes les tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables disponibles:');
    tables.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    // Vérifier si la table tasks existe
    const taskTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      );
    `);

    if (taskTableExists.rows[0].exists) {
      console.log('\n✅ Table tasks trouvée');
      
      // Compter toutes les tâches
      const totalTasks = await client.query('SELECT COUNT(*) as count FROM tasks');
      console.log(`📊 Total des tâches dans la base: ${totalTasks.rows[0].count}`);

      // Afficher toutes les tâches avec leurs détails
      const allTasks = await client.query(`
        SELECT t.id, t.dao_id, t.titre, t.statut, t.created_at,
               d.numero as dao_numero, d.objet as dao_objet
        FROM tasks t
        LEFT JOIN daos d ON t.dao_id = d.id
        ORDER BY t.created_at DESC
        LIMIT 10
      `);

      console.log('\n📋 10 dernières tâches créées:');
      allTasks.rows.forEach((task, index) => {
        console.log(`${index + 1}. ID: ${task.id} | DAO: ${task.dao_numero || 'N/A'} | Titre: ${task.titre}`);
        console.log(`   Créée le: ${task.created_at}`);
        console.log(`   Statut: ${task.statut}\n`);
      });

      // Vérifier les tâches par DAO
      const tasksByDao = await client.query(`
        SELECT d.id, d.numero, COUNT(t.id) as task_count
        FROM daos d
        LEFT JOIN tasks t ON d.id = t.dao_id
        GROUP BY d.id, d.numero
        ORDER BY d.id
      `);

      console.log('📊 Nombre de tâches par DAO:');
      tasksByDao.rows.forEach(dao => {
        console.log(`DAO ${dao.numero} (ID: ${dao.id}): ${dao.task_count} tâches`);
      });

    } else {
      console.log('\n❌ Table tasks non trouvée dans la base de données');
      
      // Créer la table tasks
      console.log('🔧 Création de la table tasks...');
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
      console.log('✅ Table tasks créée avec succès');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

checkAllTasks();
