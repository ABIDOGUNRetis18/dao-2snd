require('dotenv').config();
const { Pool } = require('pg');

async function testTaskAPI() {
  try {
    console.log('=== Test de l API /api/task ===');
    
    // 1. Test de connexion à la base de données
    console.log('\n1. Test de connexion PostgreSQL...');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'erwann',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dao'
    });
    
    const connection = await pool.connect();
    console.log('   Connexion réussie');
    
    // 2. Test de la requête exacte utilisée dans getTaskModels
    console.log('\n2. Test de la requête SQL...');
    const result = await connection.query(`
      SELECT id, nom, created_at
      FROM task
      ORDER BY id ASC
    `);
    
    console.log(`   Succès: ${result.rows.length} tâches trouvées`);
    
    if (result.rows.length > 0) {
      console.log('\n   Premières tâches:');
      result.rows.slice(0, 3).forEach((task, index) => {
        console.log(`     ${index + 1}. ID: ${task.id}, Nom: ${task.nom.substring(0, 50)}...`);
      });
    }
    
    // 3. Test de l'API HTTP
    console.log('\n3. Test de l API HTTP...');
    const http = require('http');
    
    const apiTest = new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/task',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, json });
          } catch (e) {
            resolve({ status: res.statusCode, error: e.message, raw: data });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.abort();
        reject(new Error('Timeout'));
      });
      req.end();
    });
    
    const apiResult = await apiTest;
    
    if (apiResult.status === 200 && apiResult.json.success) {
      console.log(`   Succès API: ${apiResult.json.data.length} tâches retournées`);
    } else {
      console.log(`   Erreur API: Status ${apiResult.status}`);
      if (apiResult.error) {
        console.log(`   Erreur parsing: ${apiResult.error}`);
      }
      if (apiResult.json) {
        console.log(`   Message: ${apiResult.json.message}`);
      }
    }
    
    connection.release();
    await pool.end();
    
    console.log('\\n=== Test terminé ===');
    
  } catch (error) {
    console.error('Erreur globale:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTaskAPI();
