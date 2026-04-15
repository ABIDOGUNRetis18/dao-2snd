require('dotenv').config();
const { Pool } = require('pg');

// Configuration directe de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dao',
  user: process.env.DB_USER || 'erwann',
  password: process.env.DB_PASSWORD || 'erwann',
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
}

async function debugDaoTest1() {
  try {
    console.log('=== DEBUG DAO TEST1 ===\n');
    
    // 1. Récupérer les informations du DAO Test1
    const daoResult = await query(`
      SELECT id, numero, objet, statut, date_depot, created_at
      FROM daos 
      WHERE numero ILIKE '%test1%' OR objet ILIKE '%test1%'
    `);
    
    if (daoResult.rows.length === 0) {
      console.log('Aucun DAO trouvé avec "Test1"');
      return;
    }
    
    const dao = daoResult.rows[0];
    console.log('DAO trouvé:');
    console.log(`- ID: ${dao.id}`);
    console.log(`- Numéro: ${dao.numero}`);
    console.log(`- Objet: ${dao.objet}`);
    console.log(`- Statut actuel: ${dao.statut}`);
    console.log(`- Date de dépôt: ${dao.date_depot}`);
    console.log(`- Créé le: ${dao.created_at}\n`);
    
    // 2. Récupérer toutes les tâches du DAO (table tasks)
    const tasksResult = await query(`
      SELECT id, titre as nom, statut, progress, assigned_to, created_at
      FROM tasks 
      WHERE dao_id = $1
      ORDER BY id
    `, [dao.id]);
    
    console.log(`Nombre total de tâches (table tasks): ${tasksResult.rows.length}`);
    
    // Si aucune tâche dans "tasks", vérifier la structure des tables
    if (tasksResult.rows.length === 0) {
      console.log('Aucune tâche dans la table "tasks", vérification des structures...');
      
      // Vérifier les tables existantes
      const tablesResult = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND (table_name = 'task' OR table_name = 'tasks')
      `);
      
      console.log('Tables trouvées:', tablesResult.rows.map(r => r.table_name));
      
      // Vérifier la structure de la table task si elle existe
      if (tablesResult.rows.some(r => r.table_name === 'task')) {
        const columnsResult = await query(`
          SELECT column_name, data_type FROM information_schema.columns 
          WHERE table_name = 'task' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        
        console.log('\nColonnes de la table "task":');
        columnsResult.rows.forEach(col => {
          console.log(`- ${col.column_name} (${col.data_type})`);
        });
        
        // Essayer de récupérer les tâches avec les bonnes colonnes
        const taskResult = await query(`
          SELECT * FROM task WHERE dao_id = $1 ORDER BY id
        `, [dao.id]);
        
        console.log(`\nNombre total de tâches (table task): ${taskResult.rows.length}`);
        
        if (taskResult.rows.length > 0) {
          console.log('\nDétail des tâches trouvées:');
          taskResult.rows.forEach((task, index) => {
            console.log(`${index + 1}. Tâche:`, task);
          });
          
          // Utiliser les données de la table "task"
          tasksResult.rows = taskResult.rows;
        } else {
          console.log('Aucune tâche trouvée pour ce DAO dans aucune table');
        }
      } else {
        console.log('La table "task" n\'existe pas');
      }
      
      if (tasksResult.rows.length === 0) {
        console.log('\n=== ANALYSE FINALE ===');
        console.log('Le DAO Test1 n\'a aucune tâche associée.');
        console.log('Selon la logique implémentée:');
        console.log('- Si total_tasks = 0 -> statut = EN_ATTENTE');
        console.log('- Le statut actuel est: ' + dao.statut);
        console.log('- Le statut ne changera pas tant qu\'il n\'y aura pas de tâches');
        return;
      }
    }
    
    console.log('\nDétail des tâches:');
    tasksResult.rows.forEach((task, index) => {
      console.log(`${index + 1}. Tâche ID: ${task.id}`);
      console.log(`   Nom: ${task.nom}`);
      console.log(`   Statut: ${task.statut}`);
      console.log(`   Progress: ${task.progress}%`);
      console.log(`   Assigné à: ${task.assigned_to || 'Non assigné'}`);
      console.log('');
    });
    
    // 3. Calculer les statistiques selon la nouvelle logique
    const totalTasks = tasksResult.rows.length;
    const allCompletedTasks = tasksResult.rows.filter(task => 
      task.statut === 'termine' || Number(task.progress || 0) >= 100
    );
    
    const totalProgress = tasksResult.rows.reduce((sum, task) => 
      sum + Number(task.progress || 0), 0);
    const avgProgress = totalTasks > 0 ? totalProgress / totalTasks : 0;
    
    console.log('=== CALCUL DU STATUT ===');
    console.log(`Total tâches: ${totalTasks}`);
    console.log(`Tâches complétées: ${allCompletedTasks.length}`);
    console.log(`Progression totale: ${totalProgress}`);
    console.log(`Progression moyenne: ${avgProgress.toFixed(2)}%`);
    console.log(`Progression moyenne arrondie: ${Math.round(avgProgress)}%`);
    
    // 4. Déterminer le statut selon la logique
    let expectedStatus;
    if (totalTasks === 0) {
      expectedStatus = 'EN_ATTENTE';
    } else if (allCompletedTasks.length === totalTasks && Math.round(avgProgress) === 100) {
      expectedStatus = 'TERMINEE';
    } else if (avgProgress > 0) {
      expectedStatus = 'EN_COURS';
    } else {
      expectedStatus = 'EN_COURS'; // Par défaut
    }
    
    console.log(`\nStatut attendu: ${expectedStatus}`);
    console.log(`Statut actuel: ${dao.statut}`);
    console.log(`Doit être mis à jour: ${dao.statut !== expectedStatus ? 'OUI' : 'NON'}`);
    
    // 5. Vérifier les contraintes avant la mise à jour
    if (dao.statut !== expectedStatus) {
      console.log('\n=== VÉRIFICATION DES CONTRAINTES ===');
      
      // Vérifier la contrainte daos_statut_check
      const constraintResult = await query(`
        SELECT pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conname = 'daos_statut_check'
      `);
      
      if (constraintResult.rows.length > 0) {
        console.log('Contrainte daos_statut_check:', constraintResult.rows[0].definition);
      }
      
      // Vérifier les valeurs possibles pour le statut
      const checkResult = await query(`
        SELECT column_name, check_clause 
        FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE cc.constraint_name = 'daos_statut_check'
      `);
      
      if (checkResult.rows.length > 0) {
        console.log('Valeurs autorisées:', checkResult.rows[0].check_clause);
      }
      
      console.log('\n=== TENTATIVE DE MISE À JOUR ===');
      try {
        await query(
          "UPDATE daos SET statut = $1 WHERE id = $2",
          [expectedStatus, dao.id]
        );
        console.log(`Statut mis à jour de '${dao.statut}' à '${expectedStatus}'`);
        
        // Vérifier la mise à jour
        const verifyResult = await query(
          "SELECT statut FROM daos WHERE id = $1",
          [dao.id]
        );
        console.log(`Nouveau statut vérifié: ${verifyResult.rows[0].statut}`);
      } catch (error) {
        console.log('ERREUR de mise à jour:', error.message);
        console.log('\n=== SOLUTION ===');
        console.log('La contrainte daos_statut_check n\'accepte pas la valeur:', expectedStatus);
        console.log('Il faut modifier la contrainte dans la base de données pour accepter les nouveaux statuts:');
        console.log('- EN_ATTENTE');
        console.log('- EN_COURS'); 
        console.log('- A_RISQUE');
        console.log('- TERMINEE');
        console.log('- ARCHIVE');
      }
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

debugDaoTest1().then(() => {
  console.log('\n=== TERMINÉ ===');
  process.exit(0);
});
