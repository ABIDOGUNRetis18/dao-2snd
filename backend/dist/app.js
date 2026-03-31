"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Charger les variables d'environnement AVANT les imports
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./utils/database");
// Importer les routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const dao_1 = __importDefault(require("./routes/dao"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middlewares
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'], // URLs du frontend
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/dao', dao_1.default);
// Route de test
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Backend DAO 2SND fonctionne correctement!',
        timestamp: new Date().toISOString()
    });
});
// Middleware 404 - doit être après toutes les autres routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});
// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(500).json({
        success: false,
        message: 'Erreur serveur interne'
    });
});
// Démarrer le serveur
async function startServer() {
    try {
        // Initialiser la base de données
        await (0, database_1.initializeDatabase)();
        console.log('Base de données initialisée avec succès');
        app.listen(PORT, () => {
            console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
            console.log(`📊 API disponible: http://localhost:${PORT}/api`);
            console.log(`🔐 Authentification: http://localhost:${PORT}/api/auth`);
            console.log(`🧪 Route de test: http://localhost:${PORT}/api/test`);
        });
    }
    catch (error) {
        console.error('Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=app.js.map