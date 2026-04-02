const { Client } = require('pg');

async function checkNotificationsAndComments() {
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

    // Vérifier les tables existantes
    const tablesQuery = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📋 Tables existantes:');
    tablesQuery.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Vérifier spécifiquement les tables notifications et messages/comments
    const notificationsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);

    const messagesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      );
    `);

    const commentsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'comments'
      );
    `);

    console.log(`\n📊 Table notifications existe: ${notificationsCheck.rows[0].exists}`);
    console.log(`📊 Table messages existe: ${messagesCheck.rows[0].exists}`);
    console.log(`📊 Table comments existe: ${commentsCheck.rows[0].exists}`);

    // Si les tables n'existent pas, créer la structure de base
    if (!notificationsCheck.rows[0].exists) {
      console.log('\n🔧 Création de la table notifications...');
      await client.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL DEFAULT 'info',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Table notifications créée');
    }

    if (!messagesCheck.rows[0].exists && !commentsCheck.rows[0].exists) {
      console.log('\n🔧 Création de la table messages...');
      await client.query(`
        CREATE TABLE messages (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          mentioned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          mentioned_user_name VARCHAR(255),
          is_public BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Table messages créée');
    }

    // Vérifier la structure finale
    const finalTablesQuery = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('notifications', 'messages', 'comments')
      ORDER BY table_name
    `);

    console.log('\n📋 Tables de notifications/messages finales:');
    finalTablesQuery.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

checkNotificationsAndComments();
