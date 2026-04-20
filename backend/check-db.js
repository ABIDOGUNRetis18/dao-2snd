const fs = require('fs');
const { execSync } = require('child_process');

// Lire le fichier .env
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('Variables d\'environnement trouvées:');
console.log('DB_HOST:', envVars.DB_HOST || 'localhost');
console.log('DB_PORT:', envVars.DB_PORT || '5432');
console.log('DB_NAME:', envVars.DB_NAME || 'dao');
console.log('DB_USER:', envVars.DB_USER || 'postgres');
console.log('DB_PASSWORD:', envVars.DB_PASSWORD ? '***' : 'vide');

// Construire la commande psql
const psqlCmd = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'}`;

try {
  console.log('\nTest de connexion à la base de données...');
  
  // Vérifier si la base de données existe
  const checkDb = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '${envVars.DB_NAME || 'dao'}';"`;
  const dbExists = execSync(checkDb, { encoding: 'utf8' });
  
  if (dbExists.includes('1')) {
    console.log('✅ Base de données', envVars.DB_NAME || 'dao', 'existe');
    
    // Vérifier si la table task existe
    const checkTable = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task');"`;
    const tableExists = execSync(checkTable, { encoding: 'utf8' });
    
    if (tableExists.includes('t')) {
      console.log('✅ Table task existe');
      
      // Compter les tâches
      const countTasks = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "SELECT COUNT(*) FROM task;"`;
      const taskCount = execSync(countTasks, { encoding: 'utf8' });
      console.log('📊 Nombre de tâches dans la table:', taskCount.trim());
      
      // Afficher les tâches si elles existent
      if (taskCount.trim() !== '0') {
        console.log('\n📋 Liste des tâches:');
        const listTasks = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "SELECT id, nom FROM task ORDER BY id;"`;
        const tasks = execSync(listTasks, { encoding: 'utf8' });
        console.log(tasks);
      }
    } else {
      console.log('❌ Table task n\'existe pas');
    }
    
    // Vérifier si la table tasks existe
    const checkTasksTable = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks');"`;
    const tasksTableExists = execSync(checkTasksTable, { encoding: 'utf8' });
    
    if (tasksTableExists.includes('t')) {
      console.log('✅ Table tasks existe');
      
      // Compter les instances de tâches
      const countTasksInstances = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "SELECT COUNT(*) FROM tasks;"`;
      const tasksCount = execSync(countTasksInstances, { encoding: 'utf8' });
      console.log('📊 Nombre d\'instances de tâches:', tasksCount.trim());
    } else {
      console.log('❌ Table tasks n\'existe pas');
    }
    
  } else {
    console.log('❌ Base de données', envVars.DB_NAME || 'dao', 'n\'existe pas');
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.error('Détails:', error.stderr ? error.stderr.toString() : 'Aucun détail disponible');
}
