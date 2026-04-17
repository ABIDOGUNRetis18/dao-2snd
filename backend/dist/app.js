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
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("./utils/database");
// Importer les routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const dao_1 = __importDefault(require("./routes/dao"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const myTasks_1 = __importDefault(require("./routes/myTasks"));
const taskProgress_1 = __importDefault(require("./routes/taskProgress"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const messages_1 = __importDefault(require("./routes/messages"));
const team_1 = __importDefault(require("./routes/team"));
const taskAssignment_1 = __importDefault(require("./routes/taskAssignment"));
const taskModels_1 = __importDefault(require("./routes/taskModels"));
const chef_teams_1 = __importDefault(require("./routes/chef-teams"));
const memberTasks_1 = __importDefault(require("./routes/memberTasks"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Sécurité avec Helmet
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
// CORS configuré pour la production
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL_PROD?.split(',') || []
        : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/dao', dao_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/my-tasks', myTasks_1.default);
app.use('/api/task-progress', taskProgress_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/team', team_1.default);
app.use('/api/task-assignment', taskAssignment_1.default);
app.use('/api/task', taskModels_1.default);
app.use('/api/chef-teams', chef_teams_1.default);
app.use('/api/member-tasks', memberTasks_1.default);
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