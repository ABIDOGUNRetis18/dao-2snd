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

console.log('🧹 Nettoyage de la table task...');

try {
  // Supprimer tous les enregistrements de la table task
  const deleteAll = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "DELETE FROM task;"`;
  execSync(deleteAll, { encoding: 'utf8' });
  console.log('✅ Tous les enregistrements supprimés');
  
  // Réinitialiser la séquence d'ID
  const resetSequence = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "ALTER SEQUENCE task_id_seq RESTART WITH 1;"`;
  execSync(resetSequence, { encoding: 'utf8' });
  console.log('✅ Séquence d\'ID réinitialisée');
  
  // Insérer les 15 tâches avec les bons IDs
  const insertTasks = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "
    INSERT INTO task (id, nom) VALUES 
    (1, 'Résumé sommaire DAO et Création du drive'),
    (2, 'Demande de caution et garanties'),
    (3, 'Identification et renseignement des profils dans le drive'),
    (4, 'Identification et renseignement des ABE dans le drive'),
    (5, 'Légalisation des ABE, diplômes, certificats, attestations et pièces administratives'),
    (6, 'Indication directive d''élaboration de l''offre financier'),
    (7, 'Elaboration de la méthodologie'),
    (8, 'Planification prévisionnelle'),
    (9, 'Identification des références précises des équipements et matériels'),
    (10, 'Demande de cotation'),
    (11, 'Elaboration du squelette des offres'),
    (12, 'Rédaction du contenu des OF et OT'),
    (13, 'Contrôle et validation des offres'),
    (14, 'Impression et présentation des offres'),
    (15, 'Dépôt des offres et clôture');
  "`;
  execSync(insertTasks, { encoding: 'utf8' });
  console.log('✅ 15 tâches insérées avec les IDs 1-15');
  
  // Vérifier le résultat
  const countTasks = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "SELECT COUNT(*) FROM task;"`;
  const taskCount = execSync(countTasks, { encoding: 'utf8' });
  console.log('📊 Nombre de tâches après nettoyage:', taskCount.trim());
  
  // Afficher les tâches
  const listTasks = `PGPASSWORD="${envVars.DB_PASSWORD || ''}" psql -h ${envVars.DB_HOST || 'localhost'} -p ${envVars.DB_PORT || '5432'} -U ${envVars.DB_USER || 'postgres'} -d ${envVars.DB_NAME || 'dao'} -c "SELECT id, nom FROM task ORDER BY id;"`;
  const tasks = execSync(listTasks, { encoding: 'utf8' });
  console.log('\n📋 Liste des 15 tâches:');
  console.log(tasks);
  
  console.log('\n🎉 Nettoyage terminé avec succès!');
  
} catch (error) {
  console.error('❌ Erreur lors du nettoyage:', error.message);
  console.error('Détails:', error.stderr ? error.stderr.toString() : 'Aucun détail disponible');
}
