"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.getClient = getClient;
exports.initializeDatabase = initializeDatabase;
const pg_1 = require("pg");
// Configuration de la base de données
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'dao_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20, // Maximum nombre de connexions dans le pool
    idleTimeoutMillis: 30000, // Temps avant qu'une connexion inactive soit fermée
    connectionTimeoutMillis: 2000, // Temps d'attente pour obtenir une connexion
};
console.log('Configuration DB:', {
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    password: poolConfig.password ? '***' : 'EMPTY'
});
// Créer le pool de connexions
const pool = new pg_1.Pool(poolConfig);
// Gestion des erreurs du pool
pool.on('error', (err) => {
    console.error('Erreur inattendue sur le pool de connexions PostgreSQL:', err);
});
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query exécutée', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        console.error('Erreur lors de l\'exécution de la query:', error);
        throw error;
    }
}
async function getClient() {
    return await pool.connect();
}
async function initializeDatabase() {
    try {
        // Test de connexion
        const client = await getClient();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Connexion à PostgreSQL réussie');
        // Création des tables si elles n'existent pas
        await createTables();
        console.log('✅ Tables initialisées avec succès');
        // Création des utilisateurs par défaut
        await createDefaultUsers();
        console.log('✅ Utilisateurs par défaut créés');
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
        throw error;
    }
}
async function createTables() {
    // La base de données existe déjà avec votre structure
    // On ne crée que les tables manquantes si nécessaire
    console.log('📋 Utilisation de la base de données existante');
}
async function createDefaultUsers() {
    const bcrypt = require('bcryptjs');
    // Vérifier si l'utilisateur admin existe déjà
    const existingAdmin = await query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (existingAdmin.rowCount === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        // Adapter à votre structure de table (sans full_name, avec role_id)
        await query(`
      INSERT INTO users (username, email, password, role_id)
      VALUES ($1, $2, $3, $4)
    `, [
            'admin',
            'admin@dao.com',
            hashedPassword,
            2 // role_id pour Administrateur (d'après votre schéma)
        ]);
        console.log('✅ Utilisateur admin créé');
    }
    else {
        console.log('ℹ️ Utilisateur admin existe déjà');
    }
}
// Fermer proprement le pool lors de l'arrêt du serveur
process.on('SIGINT', async () => {
    console.log('Fermeture du pool de connexions PostgreSQL...');
    await pool.end();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Fermeture du pool de connexions PostgreSQL...');
    await pool.end();
    process.exit(0);
});
//# sourceMappingURL=database.js.map