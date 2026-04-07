const { Client } = require('pg');

async function testAssignment() {
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

    // Récupérer quelques utilisateurs disponibles
    const users = await client.query('SELECT id, username FROM users LIMIT 3');
    console.log('\n👥 Utilisateurs disponibles:');
    users.rows.forEach(user => {
      console.log(`ID: ${user.id} - ${user.username}`);
    });

    // Assigner une tâche à un utilisateur
    const assignResult = await client.query(`
      UPDATE task 
      SET assigned_to = $1
      WHERE id = $2
      RETURNING id, nom, assigned_to
    `, [users.rows[0].id, 1]);

    console.log('\n✅ Tâche assignée:');
    console.log(`ID: ${assignResult.rows[0].id}`);
    console.log(`Nom: ${assignResult.rows[0].nom}`);
    console.log(`Assigné à l'ID: ${assignResult.rows[0].assigned_to}`);

    // Vérifier avec jointure pour voir le nom de l'utilisateur
    const checkResult = await client.query(`
      SELECT 
        t.id, 
        t.nom, 
        t.assigned_to,
        u.username as assigned_username
      FROM task t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id IN (1, 2, 3)
      ORDER BY t.id
    `);

    console.log('\n📋 État des tâches avec assignation:');
    checkResult.rows.forEach(task => {
      console.log(`ID: ${task.id} - ${task.nom} (Assigné à: ${task.assigned_username || 'Personne'})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

testAssignment();
